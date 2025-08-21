<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Models\Project;
use App\Models\Client;
use App\Models\ProjectTeamMember;
use Illuminate\Support\Facades\DB;


class ProjectController extends Controller
{

    public function Index()
    {
        // if (!Gate::allows('viewAny', Project::class)) {
        //     abort(403, 'Unauthorized access to projects.');
        // }
        $projects = Project::with([
            'projectTeamMembers.user.media' => function($query) {
                $query->where('category', 'profile')->latest()->limit(1);
            },
            'client'
        ])->latest()->get();
        $clients = Client::get();
        return Inertia('Pages/Project/Index', [
            'projects' => $projects,
            'clients' => $clients,
        ]);
    }

    public function Store(StoreProjectRequest $request)
    {
        $validated = $request->validated();
        Project::create($validated);
        return redirect()->back()->with('message', 'Project created successfully.');
    }
    
    public function Update(UpdateProjectRequest $request, $id)
    {
        $project = Project::findOrFail($id);
        $validated = $request->validated();
        $project->update($validated);
        return redirect()->back()->with('message', 'Project updated successfully.');
    }

    public function Destroy($id)
    {
        $project = Project::findOrFail($id);
        $project->delete();
        return back()->with('message', 'Project deleted successfully!');
    }

    public function Status(Request $request, $status)
    {
        $projects = Project::with([
            'projectTeamMembers.user.media' => function($query) {
                $query->where('category', 'profile')->latest()->limit(1);
            },
            'client'
        ])
        ->where('project_status', $status) 
        ->latest()
        ->get();
        $clients = Client::get();
        return Inertia('Pages/Project/Index', [
            'projects' => $projects,
            'status' => $status,
            'clients' => $clients,
        ]);
    }

    protected $allowedFields = [
        'project_title',
        'project_address',
        'client_id',
        'project_pricing',
        'project_area',
        'project_construction_type',
        'project_line_items_pricing',
        'project_floor_number',
        'project_main_scope',
        'project_scope_details',
        'project_template',
        'project_init_link',
        'project_final_link',
        'project_admin_notes',
        'project_notes_estimator',
        'notes_private',
        'budget_total',
        'deduction_amount',
        'project_due_date',
        'project_points',
        'project_status',
        'project_source',
        'preview_status',
    ];

    protected $validationRules = [
        'client_id' => 'required|exists:clients,id',
        'project_title' => 'required|string|max:255',
        'project_address' => 'nullable|string',
        'client_id' => 'nullable|exists:clients,id',
        'project_pricing' => 'nullable|string|max:255',
        'project_area' => 'nullable|string|max:255',
        'project_construction_type' => 'nullable|in:commercial,residential',
        'project_line_items_pricing' => 'nullable|string|max:255',
        'project_floor_number' => 'nullable|string|max:255',
        'project_main_scope' => 'nullable|string',
        'project_scope_details' => 'nullable|string',
        'project_template' => 'nullable|string|max:255',
        'project_init_link' => 'nullable|url',
        'project_final_link' => 'nullable|url',
        'project_admin_notes' => 'nullable|string',
        'project_notes_estimator' => 'nullable|string',
        'notes_private' => 'nullable|string',
        'budget_total' => 'nullable|numeric|min:0',
        'deduction_amount' => 'nullable|numeric|min:0',
        'project_due_date' => 'nullable|date',
        'project_points' => 'nullable|string|max:255',
        'project_source' => 'nullable|in:InSource,OutSource',
        'project_status' => 'nullable|in:Planned,Pending,Takeoff On Progress,Pricing On Progress,Completed,Hold,Revision,Cancelled,Deliver',
        'preview_status' => 'nullable|in:active,draft',
    ];

    public function projectColumnUpdate(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        // Authorize the update (using Laravel Gates/Policies if you have them)
        $validated = $request->validate([
            'id' => 'required|exists:projects,id',
            'field' => ['required', 'string', Rule::in($this->allowedFields)],
            $request->field => $this->validationRules[$request->field] ?? 'nullable',
        ]);

        $field = $validated['field'];
        $value = $validated[$field] ?? null;

        if ($field === 'project_due_date' && !empty($value)) {
            $value = \Carbon\Carbon::parse($value)->format('Y-m-d');
        }
        $project->update([
            $field => $value
        ]);
        return back()->with('message', ucfirst(str_replace('_', ' ', $field)) . ' updated successfully.');
 
    }

    public function JoinProject(Request $request, $id)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'steps' => 'required|array',
            'steps.*' => 'string',
            'status' => 'string'
        ]);

        $project = Project::find($id);
        
        if (!$project) {
            return back()->withErrors([
                'project' => 'The specified project does not exist'
            ]);
        }

        // Check if user is already a member
        $existingMember = ProjectTeamMember::where([
            'project_id' => $id,
            'user_id' => $validated['user_id']
        ])->exists();

        if ($existingMember) {
            return back()->withErrors([
                'user_id' => 'You have already joined this project'
            ]);
        }

        try {
            DB::transaction(function () use ($id, $validated, $project) {
                ProjectTeamMember::create([
                    'project_id' => $id,
                    'user_id' => $validated['user_id'],
                    'steps' => $validated['steps'],
                    'status' => $validated['status'] ?? 'in_progress',
                    'started_at' => now()
                ]);
                if ($project->project_status === 'Pending') {
                    $project->update([
                        'project_status' => 'Takeoff On Progress',
                        'updated_at' => now()
                    ]);
                }
            });

            return back()->with('message', 'Successfully joined project');
        } catch (\Exception $e) {
            return back()->withErrors([
                'system' => 'Failed to join project. Please try again.'
            ]);
        }
    }

    public function EditJoinProject(Request $request, $id)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'steps' => 'required|array',
            'steps.*' => 'string',
            'status' => 'sometimes|string|in:in_progress,completed,on_hold,needs_review'
        ]);

        $teamMember = ProjectTeamMember::find($id);
        
        if (!$teamMember) {
            return back()->withErrors([
                'member' => 'The specified project team member does not exist'
            ]);
        }

        if ($teamMember->user_id != $validated['user_id']) {
            return back()->withErrors([
                'user' => 'You can only update your own project participation'
            ]);
        }

        try {
            $updateData = [
                'steps' => $validated['steps'],
                'status' => $validated['status'] ?? 'in_progress',
                'updated_at' => now(),
            ];

            // Set completed_at if status is being changed to "completed"
            if ($validated['status'] === 'completed' && $teamMember->status !== 'completed') {
                $updateData['completed_at'] = now();
            }
    
            // Clear completed_at if status changes from completed to something else
            if ($validated['status'] !== 'completed' && $teamMember->status === 'completed') {
                $updateData['completed_at'] = null;
            }

            $teamMember->update($updateData);
            
            return back()->with('message', 'Project tasks updated successfully');
        } catch (\Exception $e) {
            logger()->error('Project team update failed: ' . $e->getMessage());
            return back()->withErrors([
                'system' => 'Failed to update project tasks. Please try again.'
            ]);
        }
    }
    public function DeleteJoinProject($id) {
        $teamMember = ProjectTeamMember::findOrFail($id);
        $teamMember->delete();
        return back()->with('message', 'You Have Successfully Remove Yourself From Joined Task!');
    }

    /**
     * Add or edit score for a team member.
     *
     * @param \Illuminate\Http\Request $request
     * @param int $teamMemberId
     * @return \Illuminate\Http\RedirectResponse
     */
    // public function AddEditScore(Request $request, $teamMemberId)
    // {
    //     $request->validate([
    //         'points_gain' => 'required|numeric|min:0'
    //     ]);
    //     try {
    //         DB::beginTransaction();
    //         $teamMember = ProjectTeamMember::findOrFail($teamMemberId);
    //         $project = $teamMember->project;
    //         $totalUsedPoints = $project->projectTeamMembers()
    //             ->where('id', '!=', $teamMemberId)
    //             ->sum('points_gain');
    //         $newTotalPoints = $totalUsedPoints + $request->points_gain;
    //         if ($newTotalPoints > $project->project_points) {
    //             return back()->withErrors([
    //                 'points_gain' => 'Total points exceed project limit. Available: ' . 
    //                                 ($project->project_points - $totalUsedPoints)
    //             ]);
    //         }
    //         $teamMember->update([
    //             'points_gain' => $request->points_gain
    //         ]);
    //         DB::commit();
    //         return back()->with('message', 'Points updated successfully!');
            
    //     } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
    //         DB::rollBack();
    //         return back()->withErrors(['message' => 'Team member not found.']);
            
    //     } catch (\Exception $e) {
    //         DB::rollBack();
    //         return back()->withErrors(['message' => 'Error updating points: ' . $e->getMessage()]);
    //     }
    // }

    
    public function AddEditScore(Request $request, $teamMemberId)
    {
        $request->validate([
            'points_gain' => 'required|numeric|min:0'
        ]);
        try {
            DB::beginTransaction();
            $teamMember = ProjectTeamMember::findOrFail($teamMemberId);
            $project = $teamMember->project;
            $totalUsedPoints = $project->projectTeamMembers()
                ->where('id', '!=', $teamMemberId)
                ->sum('points_gain');
            $availablePoints = $project->project_points - $totalUsedPoints;
            $newPoints = min(max(0, $request->points_gain), $availablePoints);
            if ($request->points_gain > $availablePoints) {
                return back()->withErrors([
                    'points_gain' => 'Not enough points available. Max you can assign: ' . $availablePoints
                ]);
            }
            $teamMember->update([
                'points_gain' => $newPoints
            ]);
            DB::commit();
            return back()->with('message', 'Points updated successfully!');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Team member not found.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Error updating points: ' . $e->getMessage()]);
        }
    }

}
