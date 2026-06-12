<?php

namespace App\Http\Controllers;

use App\Models\ProjectChat;
use App\Models\Media;
use App\Models\ProjectChatRead;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ProjectChatController extends Controller
{
    /**
     * Get total unread counts for sidebar badges.
     */
    public function getUnreadCounts()
    {
        $userId = Auth::id();
        
        $totalProjectUnread = 0;
        $projects = Project::where('project_status', '!=', 'Deliver')->get();
        
        foreach ($projects as $project) {
            $lastRead = ProjectChatRead::where('user_id', $userId)
                ->where('project_id', $project->id)
                ->first();

            $query = ProjectChat::where('project_id', $project->id)->where('user_id', '!=', $userId);
            if ($lastRead) {
                $query->where('created_at', '>', $lastRead->last_read_at);
            }
            $totalProjectUnread += $query->count();
        }

        $directUnreads = 0;
        $directReads = \App\Models\GlobalChatRead::where('user_id', $userId)
            ->whereNotNull('receiver_id')
            ->pluck('last_read_at', 'receiver_id');
            
        $directMessages = \App\Models\GlobalMessage::whereNull('group_id')
            ->where('receiver_id', $userId)
            ->get();
            
        foreach ($directMessages as $msg) {
            $lastRead = $directReads->get($msg->sender_id);
            if (!$lastRead || \Carbon\Carbon::parse($msg->created_at)->gt(\Carbon\Carbon::parse($lastRead))) {
                $directUnreads++;
            }
        }

        $groupUnreads = 0;
        $myGroupIds = Auth::user()->chatGroups()->pluck('chat_groups.id');
        
        $groupReads = \App\Models\GlobalChatRead::where('user_id', $userId)
            ->whereNotNull('group_id')
            ->pluck('last_read_at', 'group_id');
            
        $groupMessages = \App\Models\GlobalMessage::whereIn('group_id', $myGroupIds)
            ->where('sender_id', '!=', $userId)
            ->get();
            
        foreach ($groupMessages as $msg) {
            $lastRead = $groupReads->get($msg->group_id);
            if (!$lastRead || \Carbon\Carbon::parse($msg->created_at)->gt(\Carbon\Carbon::parse($lastRead))) {
                $groupUnreads++;
            }
        }

        return response()->json([
            'project' => $totalProjectUnread,
            'global' => $directUnreads + $groupUnreads,
            'direct' => $directUnreads,
            'groups' => $groupUnreads
        ]);
    }

    /**
     * Get chat history for a project.
     */
    public function getMessages($projectId)
    {
        $userId = Auth::id();
        
        ProjectChatRead::updateOrCreate(
            ['user_id' => $userId, 'project_id' => $projectId],
            ['last_read_at' => now()]
        );

        $chats = ProjectChat::with(['user:id,name', 'user.media', 'replyTo.user:id,name', 'media'])
            ->where('project_id', $projectId)
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($chat) {
                return [
                    'id' => $chat->id,
                    'message' => $chat->message,
                    'user_id' => $chat->user_id,
                    'user_name' => $chat->user->name,
                    'avatar' => $chat->user->media->first() ? '/' . $chat->user->media->first()->file_path : null,
                    'reply_to_id' => $chat->reply_to_id,
                    'reply_to_message' => $chat->replyTo ? $chat->replyTo->message : null,
                    'reply_to_user_name' => $chat->replyTo && $chat->replyTo->user ? $chat->replyTo->user->name : null,
                    'file' => $chat->media->first() ? [
                        'name' => basename($chat->media->first()->file_path),
                        'url' => '/' . $chat->media->first()->file_path
                    ] : null,
                    'created_at' => $chat->created_at->toDateTimeString(),
                ];
            });

        return response()->json($chats);
    }

    /**
     * Mark project chat as read.
     */
    public function markAsRead($projectId)
    {
        ProjectChatRead::updateOrCreate(
            ['user_id' => Auth::id(), 'project_id' => $projectId],
            ['last_read_at' => now()]
        );
        
        return response()->json(['status' => 'success']);
    }

    /**
     * Store a new chat message.
     */
    public function store(Request $request, $projectId)
    {
        $request->validate([
            'message' => 'nullable|string',
            'file' => 'nullable|file|max:20480',
            'reply_to_id' => 'nullable|exists:project_chats,id',
        ]);

        if (!$request->filled('message') && !$request->hasFile('file')) {
            return response()->json(['error' => 'Message or file is required'], 422);
        }

        $chat = ProjectChat::create([
            'project_id' => $projectId,
            'user_id' => Auth::id(),
            'message' => $request->message ?? '',
            'reply_to_id' => $request->reply_to_id,
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $path = public_path('uploads/media/project_chat');
            if (!file_exists($path)) {
                mkdir($path, 0777, true);
            }
            $file->move($path, $fileName);

            Media::create([
                'user_id' => Auth::id(),
                'file_path' => 'uploads/media/project_chat/' . $fileName,
                'category' => 'project_chat',
                'model_type' => 'App\Models\ProjectChat',
                'model_id' => $chat->id,
            ]);
        }

        $chat->load(['user:id,name', 'user.media', 'replyTo.user:id,name', 'media']);

        $messageData = [
            'id' => $chat->id,
            'message' => $chat->message,
            'user_id' => $chat->user_id,
            'user_name' => $chat->user->name,
            'avatar' => $chat->user->media->first() ? '/' . $chat->user->media->first()->file_path : null,
            'reply_to_id' => $chat->reply_to_id,
            'reply_to_message' => $chat->replyTo ? $chat->replyTo->message : null,
            'reply_to_user_name' => $chat->replyTo && $chat->replyTo->user ? $chat->replyTo->user->name : null,
            'file' => $chat->media->first() ? [
                'name' => basename($chat->media->first()->file_path),
                'url' => '/' . $chat->media->first()->file_path
            ] : null,
            'created_at' => $chat->created_at->toDateTimeString(),
        ];

        $this->broadcastMessage($projectId, 'event-new-message', $messageData);

        $project = Project::with('projectTeamMembers')->find($projectId);
        if ($project) {
            foreach ($project->projectTeamMembers as $member) {
                $this->broadcastToUser($member->user_id, 'project-chat-notification', [
                    'project_id' => $projectId,
                    'message' => $messageData
                ]);
            }
        }

        return response()->json([
            'status' => 'success',
            'data' => $messageData
        ]);
    }

    /**
     * Delete a chat message.
     */
    public function destroy($projectId, $chatId)
    {
        $chat = ProjectChat::where('project_id', $projectId)
            ->where('id', $chatId)
            ->firstOrFail();

        if ($chat->user_id !== Auth::id() && Auth::user()->role_id !== 1) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        foreach ($chat->media as $media) {
            $filePath = public_path($media->file_path);
            if (file_exists($filePath)) {
                unlink($filePath);
            }
            $media->delete();
        }

        $idToDelete = $chat->id;
        $chat->delete();

        $this->broadcastMessage($projectId, 'event-delete-message', ['id' => $idToDelete]);

        return response()->json(['status' => 'success', 'message' => 'Message deleted']);
    }

    private function broadcastMessage($projectId, $event, $data)
    {
        try {
            $ablyKey = config('broadcasting.connections.ably.key') ?? env('ABLY_KEY');
            $name = $event === 'event-new-message' ? 'message.sent' : 'message.deleted';
            $payload = ['name' => $name];
            if ($name === 'message.deleted') {
                $payload['data'] = ['messageId' => $data['id']];
            } else {
                $payload['data'] = ['message' => $data];
            }

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, "https://rest.ably.io/channels/project-chat.{$projectId}/messages");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            if (config('app.env') === 'local') curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Basic ' . base64_encode($ablyKey), 'Content-Type: application/json']);
            curl_exec($ch);
            curl_close($ch);
        } catch (\Exception $e) {
            \Log::error("Ably Project Message Broadcast Error: " . $e->getMessage());
        }
    }

    private function broadcastToUser($userId, $event, $data)
    {
        try {
            $ablyKey = config('broadcasting.connections.ably.key') ?? env('ABLY_KEY');

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, "https://rest.ably.io/channels/user.{$userId}/messages");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['name' => 'project-notification', 'data' => $data]));
            if (config('app.env') === 'local') curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Basic ' . base64_encode($ablyKey), 'Content-Type: application/json']);
            curl_exec($ch);
            curl_close($ch);
        } catch (\Exception $e) {
            \Log::error("Ably User Notification Broadcast Error: " . $e->getMessage());
        }
    }
}