<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProjectController extends Controller
{

    public function ProjectList(Request $request)
    {
        $status = $request->get('status', 'All');
        $query = DB::table('projects')
            ->select('id', 'project_title as name', 'project_status')
            ->orderBy('id', 'desc');
        $query->where('project_status', '!=', 'completed');
        if ($status !== 'All') {
            $query->where('project_status', $status);
        }
        $projects = $query->paginate(500);
        $projectIds = collect($projects->items())->pluck('id')->toArray();
        $teamMembers = DB::table('project_team_members')
            ->join('users', 'users.id', '=', 'project_team_members.user_id')
            ->leftJoin('media', function ($join) {
                $join->on('users.id', '=', 'media.user_id')
                    ->where('media.category', '=', 'profile');
            })
            ->select(
                'project_team_members.project_id',
                'project_team_members.id as team_member_id',
                'project_team_members.user_id',
                'project_team_members.steps',
                'project_team_members.status',
                'users.name as user_name',
                'media.id as media_id',
                'media.file_path',
                'media.category'
            )
            ->whereIn('project_team_members.project_id', $projectIds)
            ->get()
            ->groupBy('project_id');

        foreach ($projects as $project) {
            $members = $teamMembers[$project->id] ?? collect();

            $project->team_members = $members->map(function ($item) {
                return [
                    'id' => $item->team_member_id,
                    'project_id' => $item->project_id,
                    'user_id' => $item->user_id,
                    'steps' => $item->steps,
                    'status' => $item->status,
                    'user' => [
                        'id' => $item->user_id,
                        'name' => $item->user_name,
                        'media' => $item->media_id ? [
                            'id' => $item->media_id,
                            'user_id' => $item->user_id,
                            'file_path' => $item->file_path,
                            'category' => $item->category,
                        ] : null
                    ]
                ];
            })->values()->all();
        }

        return response()->json([
            'projects' => $projects,
        ]);
    }

    public function View(Request $request, $id)
    {
        try {

            $project = DB::table('projects')->where('id', $id)->first();
            return response()->json([
                'status' => true,
                'message' => 'Project details fetched successfully',
                'data' => $project,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /*
    |-----------------------------------------
    | CREATE PROJECT
    |-----------------------------------------
    */

    public function Create(Request $request)
    {
        try {
            $data = $request->except([
                '_token',
                '_method',
                'id',
                'created_at',
                'updated_at',
            ]);

            // Convert empty strings to null to avoid constraint errors
            foreach ($data as $key => $value) {
                if ($value === '') {
                    $data[$key] = null;
                }
            }

            $data['created_at'] = now();
            $data['updated_at'] = now();

            $projectId = DB::table('projects')->insertGetId($data);

            return response()->json([
                'status' => true,
                'message' => 'Project created successfully',
                'data' => DB::table('projects')->where('id', $projectId)->first(),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /*
    |-----------------------------------------
    | EDIT FULL PROJECT
    |-----------------------------------------
    */

    public function Edit(Request $request, $id)
    {
        try {

            $project = DB::table('projects')->where('id', $id)->first();
            return response()->json([
                'status' => true,
                'message' => 'Project details fetched successfully',
                'data' => $project,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /*
    |-----------------------------------------
    | EDIT FULL PROJECT
    |-----------------------------------------
    */

    public function Update(Request $request, $id)
    {
        try {

            $project = DB::table('projects')
                ->where('id', $id)
                ->first();

            if (!$project) {
                return response()->json([
                    'status' => false,
                    'message' => 'Project not found',
                ], 404);
            }

            $data = $request->except([
                '_token',
                '_method',
                'id',
                'created_at'
            ]);

            $data['updated_at'] = now();

            DB::table('projects')
                ->where('id', $id)
                ->update($data);

            return response()->json([
                'status' => true,
                'message' => 'Project updated successfully',
                'data' => DB::table('projects')->where('id', $id)->first(),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /*
    |-----------------------------------------
    | GET PROJECT COLUMN
    |-----------------------------------------
    */
    
    public function Column(Request $request, $id)
    {
        try {

            $project = DB::table('projects')->where('id', $id)->first();

            if (!$project) {
                return response()->json([
                    'status' => false,
                    'message' => 'Project not found',
                ], 404);
            }

            $field = $request->query('field'); // ?field=project_title

            $allowedFields = [
                'project_title',
                'project_address',
                'client_name_for_admin',
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

            if (!$field || !in_array($field, $allowedFields)) {
                return response()->json([
                    'status' => false,
                    'message' => 'Invalid field',
                ], 422);
            }

            return response()->json([
                'status' => true,
                'id' => $id, // ✔ YES include it in response
                'field' => $field,
                'value' => $project->$field,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /*
    |-----------------------------------------
    | EDIT PROJECT COLUMN
    |-----------------------------------------
    */

    public function ColumnUpdate(Request $request, $id)
    {
        try {

            $project = DB::table('projects')->where('id', $id)->first();

            if (!$project) {
                return response()->json([
                    'status' => false,
                    'message' => 'Project not found',
                ], 404);
            }

            $allowedFields = [
                'project_title',
                'project_address',
                'client_name_for_admin',
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

            $request->validate([
                'field' => 'required|in:' . implode(',', $allowedFields),
                'value' => 'nullable'
            ]);

            $field = $request->field;
            $value = $request->value;

            if ($field === 'project_due_date' && $value) {
                $value = date('Y-m-d', strtotime($value));
            }

            DB::table('projects')
                ->where('id', $id)
                ->update([
                    $field => $value,
                    'updated_at' => now()
                ]);

            return response()->json([
                'status' => true,
                'message' => 'Updated successfully',
                'id' => $id,
                'field' => $field,
                'value' => $value,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }


    /*
    |-----------------------------------------
    | PROJECT JOIN STORE
    |-----------------------------------------
    */

    public function JoinProject(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'user_id' => 'required|exists:users,id',
                'steps' => 'required|array',
                'steps.*' => 'string',
                'status' => 'nullable|string'
            ]);

            $project = DB::table('projects')->where('id', $id)->first();

            if (!$project) {
                return response()->json([
                    'status' => false,
                    'message' => 'Project not found',
                ], 404);
            }

            $alreadyJoined = DB::table('project_team_members')
                ->where('project_id', $id)
                ->where('user_id', $validated['user_id'])
                ->exists();

            if ($alreadyJoined) {
                return response()->json([
                    'status' => false,
                    'message' => 'You have already joined this project',
                ], 422);
            }

            DB::beginTransaction();

            $projectJoinId = DB::table('project_team_members')
                ->insertGetId([
                    'project_id' => $id,
                    'user_id' => $validated['user_id'],
                    'steps' => json_encode($validated['steps']),
                    'status' => $validated['status'] ?? 'in_progress',
                    'started_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

            if ($project->project_status === 'Pending') {
                DB::table('projects')
                    ->where('id', $id)
                    ->update([
                        'project_status' => 'Takeoff On Progress',
                        'updated_at' => now(),
                    ]);
            }

            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Successfully joined project.',
                'data' => DB::table('project_team_members')->where('id', $projectJoinId)->first(),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => false,
                'message' => 'Failed to join project. ' . $e->getMessage(),
            ], 500);
        }
    }

    public function EditJoinProject(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'user_id' => 'required|exists:users,id',
                'steps' => 'required|array',
                'steps.*' => 'string',
                'status' => 'nullable|string|in:in_progress,completed,on_hold,needs_review'
            ]);

            $teamMember = DB::table('project_team_members')->where('id', $id)->first();
            
            if (!$teamMember) {
                return response()->json([
                    'status' => false,
                    'message' => 'The specified project team member does not exist'
                ], 404);
            }

            if ($teamMember->user_id != $validated['user_id']) {
                return response()->json([
                    'status' => false,
                    'message' => 'You can only update your own project participation'
                ], 403);
            }

            $updateData = [
                'steps' => json_encode($validated['steps']),
                'status' => $validated['status'] ?? 'in_progress',
                'updated_at' => now(),
            ];

            // Set completed_at if status is being changed to "completed"
            if (isset($validated['status']) && $validated['status'] === 'completed' && $teamMember->status !== 'completed') {
                $updateData['completed_at'] = now();
            }
    
            // Clear completed_at if status changes from completed to something else
            if (isset($validated['status']) && $validated['status'] !== 'completed' && $teamMember->status === 'completed') {
                $updateData['completed_at'] = null;
            }

            DB::table('project_team_members')
                ->where('id', $id)
                ->update($updateData);

            return response()->json([
                'status' => true,
                'message' => 'Project tasks updated successfully',
                'data' => DB::table('project_team_members')->where('id', $id)->first(),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to update project tasks. ' . $e->getMessage()
            ], 500);
        }
    }

    public function DeleteJoinProject($id)
    {
        try {
            $teamMember = DB::table('project_team_members')->where('id', $id)->first();
            
            if (!$teamMember) {
                return response()->json([
                    'status' => false,
                    'message' => 'Team member record not found',
                ], 404);
            }

            DB::table('project_team_members')->where('id', $id)->delete();

            return response()->json([
                'status' => true,
                'message' => 'Successfully removed from joined project.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to leave project. ' . $e->getMessage(),
            ], 500);
        }
    }

}
