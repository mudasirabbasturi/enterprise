<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\ProjectTeamMember;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class ProjectTestController extends Controller
{
    // Phase 1: Load basic project data
    public function index()
    {
        $projects = Project::select('id', 'project_title', 'project_address', 'client_id')
            // ->where('project_status', '!=', 'Deliver')
            ->latest()
            ->take(2000) // Smaller for testing
            ->get()
            ->map(function ($project) {
                return [
                    'id' => $project->id,
                    'project_title' => $project->project_title,
                    'project_address' => $project->project_address,
                    'client_id' => $project->client_id,
                    // Initialize with empty array instead of null
                    'team_members' => [],
                    '_teamLoaded' => false, // Use same key as frontend expects
                ];
            });

        return Inertia::render('Pages/Project/Test/Index', [
            'projects' => $projects,
        ]);
    }

    public function getTeamMembers(Request $request)
    {
        try {
            $request->validate([
                'project_ids' => 'required|array',
                'project_ids.*' => 'integer|exists:projects,id'
            ]);

            $projectIds = $request->project_ids;
            
            $teamMembers = ProjectTeamMember::whereIn('project_id', $projectIds)
                ->with(['user:id,name'])
                ->get()
                ->groupBy('project_id')
                ->map(function ($members) {
                    return $members->map(function ($member) {
                        return [
                            'id' => $member->id,
                            'name' => $member->user->name,
                            'email' => $member->user->email,
                        ];
                    });
                })
                ->toArray();

            // Return as associative array (NOT object)
            return response()->json([
                'success' => true,
                'team_members' => $teamMembers, // Keep as array
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'team_members' => [] // Empty array
            ]);
        }
    }
}