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
use Pusher\Pusher;


class ProjectController extends Controller
{

    public function Index()
    {
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
        $userName = Auth::user()->name;
        $userEmail = Auth::user()->email;
        $validated = $request->validated();
        $project = Project::create($validated);
        $project = Project::with([
            'projectTeamMembers.user.media' => function ($query) {
                $query->where('category', 'profile')->latest()->limit(1);
            },
            'client'
        ])->find($project->id);

        // $options = [ 
        //     'cluster' => config('broadcasting.connections.pusher.options.cluster'), 
        //     'useTLS' => true, 
        // ];
        // $pusher = new Pusher(
        //     config('broadcasting.connections.pusher.key'),
        //     config('broadcasting.connections.pusher.secret'),
        //     config('broadcasting.connections.pusher.app_id'),
        //     $options
        // );

        $options = [ 
            'cluster' => 'ap2', 
            'useTLS' => true, 
        ];
        $pusher = new Pusher(
            '5158315c26b8f6732773', // app key
            '9ba1bfd3baa3f4ec2a4c', // app secret
            '2057639', // app id
            $options
        );
        $pusher->trigger('project-channel', 'event-project-created', [
            'message' => $userName . ' added new project ' . $project->project_title,
            'userEmail' => $userEmail,
            'project' => $project,
        ]);
        return response()->json([
            'message' => 'Project Created Successfully.',
            'project' => $project,
        ]);
    }

    public function Update(UpdateProjectRequest $request, $id)
    {
        $project = Project::findOrFail($id);
        $validated = $request->validated();
        $project->update($validated);
        return response()->json([
            'message' => 'Project updated successfully.',
            'project' => $project,
        ]);
        // return redirect()->back()->with('message', 'Project updated successfully.');
    }

    public function Destroy($id)
    {
        $userName = Auth::user()->name;
        $userEmail = Auth::user()->email;
        $project = Project::findOrFail($id);
        $project->delete();
        $options = [ 
            'cluster' => 'ap2', 
            'useTLS' => true, 
        ];
        $pusher = new Pusher(
            '5158315c26b8f6732773', // app key
            '9ba1bfd3baa3f4ec2a4c', // app secret
            '2057639', // app id
            $options
        );
        $pusher->trigger('project-channel', 'event-project-delete', [
            'message' => $userName . ' delete the project ' . $project->project_title,
            'userEmail' => $userEmail,
            'project' => $project,
        ]);
        return response()->json([
            'message' => 'Project deleted successfully.',
            'project' => $project, 
        ]);
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
        'project_points' => 'nullable|numeric|max:255',
        'project_source' => 'nullable|in:InSource,OutSource',
        'project_status' => 'nullable|in:Planned,Pending,Takeoff On Progress,Pricing On Progress,Completed,Hold,Revision,Cancelled,Deliver',
        'preview_status' => 'nullable|in:active,draft',
    ];

    public function projectColumnUpdate(Request $request, $id)
    {
        $project = Project::findOrFail($id);
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

        return response()->json([
            'message' => ucfirst(str_replace('_', ' ', $field)) . ' updated successfully.',
            'project' => $project,
        ]);
        
        // return redirect()->back()->with('message', ucfirst(str_replace('_', ' ', $field)) . ' updated successfully.');
    }

    public function JoinProject(Request $request, $id)
    {
        $userName = Auth::user()->name;
        $userEmail = Auth::user()->email;
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
            // Reload project with relations
            $project = Project::with([
                'projectTeamMembers.user.media' => function ($query) {
                    $query->where('category', 'profile')->latest()->limit(1);
                },
                'client'
            ])->find($id);
            // Trigger Pusher AFTER full project is loaded
            $options = [ 
                'cluster' => 'ap2', 
                'useTLS' => true, 
            ];
            $pusher = new Pusher(
                '5158315c26b8f6732773', // app key
                '9ba1bfd3baa3f4ec2a4c', // app secret
                '2057639', // app id
                $options
            );
            $pusher->trigger('project-channel', 'event-project-joined', [
                'message' =>  $userName . ' joined project: ' . $project->project_title,
                'userEmail' => $userEmail,
                'project' => $project,
            ]);
            return response()->json([
                'message' => 'Successfully joined project.',
                'project' => $project,
                'error' => false,
            ]);

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
        $userName = Auth::user()->name;
        $userEmail = Auth::user()->email;
        $teamMember = ProjectTeamMember::findOrFail($id);
        $projectId = $teamMember->project_id;
        $teamMember->delete();
        $project = Project::with([
            'projectTeamMembers.user.media' => function ($query) {
                $query->where('category', 'profile')->latest()->limit(1);
            },
            'client'
        ])->find($projectId);

        $options = [ 
            'cluster' => 'ap2', 
            'useTLS' => true, 
        ];
        $pusher = new Pusher(
            '5158315c26b8f6732773',
            '9ba1bfd3baa3f4ec2a4c',
            '2057639',
            $options
        );
        $pusher->trigger('project-channel', 'event-project-leave', [
            'message' =>  $userName . ' leave project: ' . $project->project_title,
            'userEmail' => $userEmail,
            'project' => $project,
        ]);
        return response()->json([
            'message' => 'Successfully removed from joined project.',
            'project' => $project,
            'error' => false,
        ]);
    }

    /**
     * Add or edit score for a team member.
     *
     * @param \Illuminate\Http\Request $request
     * @param int $teamMemberId
     * @return \Illuminate\Http\RedirectResponse
     */
    
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

    public function BulkUpdateScores(Request $request, $projectId)
    {
        $project = Project::with('projectTeamMembers')->findOrFail($projectId);

        $members = $request->input('members', []);

        $totalProjectPoints = (int) $project->project_points;
        $totalUsed = collect($members)->sum(fn($m) => (int) ($m['points_gain'] ?? 0));

        if ($totalUsed > $totalProjectPoints) {
            return response()->json([
                'message' => 'Total assigned points exceed total project points.',
            ], 422);
        }

        foreach ($members as $m) {
            ProjectTeamMember::where('id', $m['id'])
                ->where('project_id', $projectId)
                ->update(['points_gain' => (int) $m['points_gain']]);
        }

        return response()->json([
            'message' => 'All member scores updated successfully!',
            'project' => $project->fresh(['projectTeamMembers.user']),
        ]);
    }


}
