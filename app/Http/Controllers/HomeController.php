<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\User;
use App\Models\Project;
use App\Models\Client;
use App\Models\Department;
use App\Models\Branch;
use App\Models\UserAttendance;
use App\Models\ProjectTeamMember;
use Carbon\Carbon;

class HomeController extends Controller
{
    public function Index()
    {
        // $userStats = $this->getUserStats();
        // $projectStats = $this->getProjectStats();
        // $attendanceStats = [
        //     'weekly' => $this->getAttendanceStats('weekly'),
        //     'monthly' => $this->getAttendanceStats('monthly')
        // ];
        // $departmentStats = $this->getDepartmentStats();
        // $branchStats = $this->getBranchStats();
        // $teamStats = $this->getTeamStats();
        // return Inertia('Home', [
        //     'userStats' => $userStats,
        //     'projectStats' => $projectStats,
        //     'attendanceStats' => $attendanceStats,
        //     'departmentStats' => $departmentStats,
        //     'branchStats' => $branchStats,
        //     'teamStats' => $teamStats,
        // ]);

        $projects = Project::with([
            'projectTeamMembers.user.media' => function($query) {
                $query->where('category', 'profile')->latest()->limit(1);
            },
            'client'
        ])
        ->where('project_status', "Pending") 
        ->latest()
        ->get();
        $clients = Client::get();
        return Inertia('Pages/Project/Index', [
            'projects' => $projects,
            'status' => "Pending",
            'clients' => $clients,
        ]);
    }
    protected function getUserStats()
    {
        $months = [];
        $counts = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $months[] = $date->format('M Y');
            $counts[] = User::whereYear('created_at', $date->year)
                            ->whereMonth('created_at', $date->month)
                            ->count();
        }
        return [
            'months' => $months,
            'counts' => $counts
        ];
    }
    protected function getProjectStats()
    {
        $statuses = ['Planned', 'Pending', 'Takeoff On Progress', 'Pricing On Progress', 'Completed', 'Hold', 'Revision', 'Cancelled', 'Deliver'];
        $counts = [];
        
        foreach ($statuses as $status) {
            $counts[] = Project::where('project_status', $status)->count();
        }
        $timeline = Project::select('project_title as title', 'project_status as status', 'created_at as start_date', 'project_due_date as due_date')
                          ->whereNotNull('project_due_date')
                          ->limit(20)
                          ->get()
                          ->map(function($project) {
                              return [
                                  'title' => $project->title,
                                  'status' => $project->status,
                                  'start_date' => $project->start_date,
                                  'due_date' => $project->due_date,
                                  'duration' => Carbon::parse($project->start_date)->diffInDays(Carbon::parse($project->due_date))
                              ];
                          })
                          ->toArray();
        
        return [
            'statuses' => $statuses,
            'counts' => $counts,
            'timeline' => $timeline
        ];
    }
    protected function getAttendanceStats($period = 'weekly')
    {
        $labels = [];
        $present = [];
        $late = [];
        $absent = [];
        if ($period === 'weekly') {
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::now()->subDays($i);
                $labels[] = $date->format('D');
                $dayAttendance = UserAttendance::whereDate('date', $date->toDateString())->get();
                $present[] = $dayAttendance->where('status', 'present')->count();
                $late[] = $dayAttendance->where('status', 'late')->count();
                $absent[] = $dayAttendance->where('status', 'absent')->count();
            }
        } else {
            for ($i = 5; $i >= 0; $i--) {
                $date = Carbon::now()->subMonths($i);
                $labels[] = $date->format('M Y');
                $monthAttendance = UserAttendance::whereYear('date', $date->year)
                                               ->whereMonth('date', $date->month)
                                               ->get();
                $present[] = $monthAttendance->where('status', 'present')->count();
                $late[] = $monthAttendance->where('status', 'late')->count();
                $absent[] = $monthAttendance->where('status', 'absent')->count();
            }
        }
        return [
            'labels' => $labels,
            'present' => $present,
            'late' => $late,
            'absent' => $absent
        ];
    }
    protected function getDepartmentStats()
    {
        $departments = Department::withCount('users')->get();
        return [
            'names' => $departments->pluck('name'),
            'counts' => $departments->pluck('users_count')
        ];
    }
    protected function getBranchStats()
    {
        $branches = Branch::withCount('users')->get();
        $metrics = ['Employees'];
        $branchData = $branches->map(function($branch) {
            return [
                'name' => $branch->name,
                'values' => [$branch->users_count]
            ];
        });
        return [
            'metrics' => $metrics,
            'branches' => $branchData
        ];
    }
    protected function getTeamStats()
    {
        $topPerformers = User::withCount(['projectTeamMembers as completed_projects_count' => function($query) {
                                $query->where('status', 'completed');
                            }])
                            ->withSum(['projectTeamMembers as total_points_gained' => function($query) {
                                $query->where('status', 'completed');
                            }], 'points_gain')
                            ->orderByDesc('total_points_gained')
                            ->limit(5)
                            ->get()
                            ->map(function($user) {
                                return [
                                    'name' => $user->name,
                                    'avatar' => $user->avatar_url,
                                    'completed_projects' => $user->completed_projects_count,
                                    'points_gained' => $user->total_points_gained ?? 0,
                                    'department' => $user->department->name ?? 'N/A'
                                ];
                            });
        $totalAssignments = ProjectTeamMember::count();
        $completedAssignments = ProjectTeamMember::where('status', 'completed')->count();
        $completionRate = $totalAssignments > 0 ? round(($completedAssignments / $totalAssignments) * 100) : 0;
        $totalPoints = ProjectTeamMember::where('status', 'completed')->sum('points_gain');
        return [
            'topPerformers' => $topPerformers,
            'assignmentStats' => [
                'total' => $totalAssignments,
                'completed' => $completedAssignments,
                'completionRate' => $completionRate,
                'totalPoints' => $totalPoints
            ]
        ];
    }
    
}