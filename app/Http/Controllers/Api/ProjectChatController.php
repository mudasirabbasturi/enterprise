<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Project;
use App\Models\ProjectChat;
use Illuminate\Support\Facades\DB;

class ProjectChatController extends Controller
{

    public function chatUserList(Request $request) {
        $users = DB::table('users')
            // FIX: Change 'id as userId' to 'users.id as userId'
            ->select('users.id as userId', 'users.name', 'users.email', 'users.picture_path', 'media.file_path') 
            ->join('media', 'users.id', '=', 'media.user_id')
            ->where('users.status', '=', 'active') // Good practice to prefix here too
            ->where('media.category', '=', 'profile')
            ->orderBy('users.id', 'desc')
            ->get();

        return response()->json([
            'users' => $users
        ]);
    }

    public function chatProjectList(Request $request)
    {
        $status = $request->get('status', 'All');

        $query = DB::table('projects')
            ->select('id', 'project_title as name', 'project_status')
            ->orderBy('id', 'desc');

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

    public function getProjectChatMessages($project_id) {
        $chatMessages = DB::table('project_chats')
            ->where('project_chats.project_id', $project_id)
            ->join('users', 'users.id', '=', 'project_chats.user_id')
            ->leftJoin('media as profile_media', function ($join) {
                $join->on('users.id', '=', 'profile_media.user_id')
                    ->where('profile_media.category', '=', 'profile');
            })
            ->select(
                'project_chats.id',
                'project_chats.project_id',
                'project_chats.user_id as senderId',
                'project_chats.message as content',
                'project_chats.created_at as timestamp',
                'project_chats.reply_to_id',
                'users.name as user_name',
                'users.email as user_email',
                'profile_media.file_path as user_avatar'
            )
            ->orderBy('project_chats.created_at', 'asc')
            ->get();

        $messageIds = $chatMessages->pluck('id')->toArray();

        // Fetch all file attachments for these messages
        $attachments = DB::table('media')
            ->where('model_type', 'App\Models\ProjectChat')
            ->whereIn('model_id', $messageIds)
            ->select('model_id', 'file_path', 'id as media_id')
            ->get()
            ->keyBy('model_id');

        // Fetch reply-to message content
        $replyIds = $chatMessages->pluck('reply_to_id')->filter()->unique()->toArray();
        $replyMessages = [];
        if (!empty($replyIds)) {
            $replyMessages = DB::table('project_chats')
                ->join('users', 'users.id', '=', 'project_chats.user_id')
                ->whereIn('project_chats.id', $replyIds)
                ->select('project_chats.id', 'project_chats.message', 'users.name as user_name')
                ->get()
                ->keyBy('id');
        }

        // Attach file and reply data to each message
        $chatMessages->each(function ($msg) use ($attachments, $replyMessages) {
            $attachment = $attachments[$msg->id] ?? null;
            if ($attachment) {
                $fileName = basename($attachment->file_path);
                $msg->file = [
                    'name' => $fileName,
                    'url'  => $attachment->file_path,
                ];
            } else {
                $msg->file = null;
            }

            if ($msg->reply_to_id && isset($replyMessages[$msg->reply_to_id])) {
                $reply = $replyMessages[$msg->reply_to_id];
                $msg->reply_to_message = $reply->message;
                $msg->reply_to_user_name = $reply->user_name;
            } else {
                $msg->reply_to_message = null;
                $msg->reply_to_user_name = null;
            }
        });

        return response()->json([
            'chat_messages' => $chatMessages
        ]);
    }

    // public function sendProjectMessage(Request $request)
    // {
    //     $request->validate([
    //         'project_id' => 'required|integer|exists:projects,id',
    //         'user_id' => 'required|integer|exists:users,id',
    //         'message' => 'required|string',
    //         'reply_to_id' => 'nullable|integer'
    //     ]);

    //     $messageId = DB::table('project_chats')->insertGetId([
    //         'project_id' => $request->project_id,
    //         'user_id' => $request->user_id,
    //         'message' => $request->message,
    //         'reply_to_id' => $request->reply_to_id,
    //         'created_at' => now(),
    //         'updated_at' => now(),
    //     ]);

    //     // return full message object (useful for UI append)
    //     $message = DB::table('project_chats')
    //         ->where('project_chats.id', $messageId)
    //         ->join('users', 'users.id', '=', 'project_chats.user_id')
    //         ->leftJoin('media', function ($join) {
    //             $join->on('users.id', '=', 'media.user_id')
    //                 ->where('media.category', '=', 'profile');
    //         })
    //         ->select(
    //             'project_chats.id',
    //             'project_chats.project_id',
    //             'project_chats.user_id as senderId',
    //             'project_chats.message as content',
    //             'project_chats.created_at as timestamp',
    //             'project_chats.reply_to_id',
    //             'users.name as user_name',
    //             'media.file_path as user_avatar'
    //         )
    //         ->first();

    //     return response()->json([
    //         'success' => true,
    //         'message' => $message
    //     ]);
    // }

    public function sendProjectMessage(Request $request)
    {
        $request->validate([
            'project_id' => 'required|exists:projects,id',
            'user_id' => 'required|exists:users,id',
            'message' => 'nullable|string',
            'reply_to_id' => 'nullable|exists:project_chats,id',
            'file' => 'nullable|file|max:20480',
        ]);

        if (!$request->filled('message') && !$request->hasFile('file')) {
            return response()->json([
                'success' => false,
                'message' => 'Message or file is required'
            ], 422);
        }

        $messageId = DB::table('project_chats')->insertGetId([
            'project_id' => $request->project_id,
            'user_id' => $request->user_id,
            'message' => $request->message ?? '',
            'reply_to_id' => $request->reply_to_id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $fileData = null;

        if ($request->hasFile('file')) {

            $file = $request->file('file');

            $fileName = time() . '_' . $file->getClientOriginalName();

            $path = public_path('uploads/media/project_chat');

            if (!file_exists($path)) {
                mkdir($path, 0777, true);
            }

            $file->move($path, $fileName);

            $mediaId = DB::table('media')->insertGetId([
                'user_id' => $request->user_id,
                'file_path' => 'uploads/media/project_chat/' . $fileName,
                'category' => 'project_chat',
                'model_type' => 'App\Models\ProjectChat',
                'model_id' => $messageId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $fileData = [
                'id' => $mediaId,
                'name' => $fileName,
                'url' => '/uploads/media/project_chat/' . $fileName,
            ];
        }

        $message = DB::table('project_chats')
            ->join('users', 'users.id', '=', 'project_chats.user_id')
            ->leftJoin('media as profile_media', function ($join) {
                $join->on('users.id', '=', 'profile_media.user_id')
                    ->where('profile_media.category', '=', 'profile');
            })
            ->where('project_chats.id', $messageId)
            ->select(
                'project_chats.id',
                'project_chats.project_id',
                'project_chats.user_id as senderId',
                'project_chats.message as content',
                'project_chats.created_at as timestamp',
                'project_chats.reply_to_id',
                'users.name as user_name',
                'profile_media.file_path as user_avatar'
            )
            ->first();

        if ($message->reply_to_id) {

            $replyMessage = DB::table('project_chats')
                ->join('users', 'users.id', '=', 'project_chats.user_id')
                ->where('project_chats.id', $message->reply_to_id)
                ->select(
                    'project_chats.id',
                    'project_chats.message',
                    'users.name as user_name'
                )
                ->first();

            $message->reply_to_message = $replyMessage?->message;
            $message->reply_to_user_name = $replyMessage?->user_name;
        }

        $message->file = $fileData;

        return response()->json([
            'success' => true,
            'message' => $message
        ]);
    }
    
    public function deleteProjectMessage($id)
    {
        $message = DB::table('project_chats')
            ->where('id', $id)
            ->first();

        if (!$message) {
            return response()->json([
                'success' => false,
                'message' => 'Message not found'
            ], 404);
        }

        // Find attached media
        $mediaFiles = DB::table('media')
            ->where('model_type', 'App\Models\ProjectChat')
            ->where('model_id', $id)
            ->get();

        foreach ($mediaFiles as $media) {

            $filePath = public_path($media->file_path);

            if (file_exists($filePath)) {
                unlink($filePath);
            }
        }

        // Delete media records
        DB::table('media')
            ->where('model_type', 'App\Models\ProjectChat')
            ->where('model_id', $id)
            ->delete();

        // Delete message
        DB::table('project_chats')
            ->where('id', $id)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Message deleted successfully'
        ]);
    }
}
