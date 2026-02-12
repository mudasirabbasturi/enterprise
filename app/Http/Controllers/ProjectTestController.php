<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\ProjectTeamMember;
use Inertia\Inertia;

class ProjectTestController extends Controller
{
    // Initial load - 20 projects
    public function index()
    {
        $projects = Project::select('id', 'project_title', 'project_address', 'client_id')
            ->latest()
            ->take(20) // Load only 20 initially
            ->get()
            ->map(function ($project) {
                return [
                    'id' => $project->id,
                    'project_title' => $project->project_title,
                    'project_address' => $project->project_address,
                    'client_id' => $project->client_id,
                    'team_members' => [],
                    '_teamLoaded' => false,
                ];
            });

        return Inertia::render('Pages/Project/Test/Index', [
            'projects' => $projects,
            'totalProjects' => Project::count(),
        ]);
    }

    // Load more projects (20 at a time)
    public function getMoreProjects(Request $request)
    {
        $request->validate([
            'skip' => 'required|integer|min:0',
            'take' => 'required|integer|min:1|max:50'
        ]);

        $skip = $request->skip;
        $take = $request->take;

        $projects = Project::select('id', 'project_title', 'project_address', 'client_id')
            ->latest()
            ->skip($skip)
            ->take($take)
            ->get()
            ->map(function ($project) {
                return [
                    'id' => $project->id,
                    'project_title' => $project->project_title,
                    'project_address' => $project->project_address,
                    'client_id' => $project->client_id,
                    'team_members' => [],
                    '_teamLoaded' => false,
                ];
            });

        return response()->json([
            'success' => true,
            'projects' => $projects,
            'hasMore' => ($skip + $take) < Project::count()
        ]);
    }

    // Load team members for multiple projects in batch
    public function getTeamMembers(Request $request)
    {
        try {
            $request->validate([
                'project_ids' => 'required|array',
                'project_ids.*' => 'integer|exists:projects,id'
            ]);

            $projectIds = $request->project_ids;
            
            // Get team members for all requested project IDs
            $teamMembers = ProjectTeamMember::whereIn('project_id', $projectIds)
                ->with(['user:id,name'])
                ->get()
                ->groupBy('project_id');
            
            // Prepare response array
            $response = [];
            foreach ($projectIds as $projectId) {
                $members = $teamMembers->get($projectId, collect())->map(function ($member) {
                    return [
                        'id' => $member->id,
                        'name' => $member->user->name,
                    ];
                })->toArray();
                
                $response[$projectId] = $members;
            }

            return response()->json([
                'success' => true,
                'team_members' => $response,
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to load team members: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'team_members' => []
            ]);
        }
    }
}