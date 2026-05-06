<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\ProjectChat;
use App\Models\Media;
use App\Models\ProjectChatRead;
use App\Models\Project;
use Illuminate\Support\Facades\Auth;
use Pusher\Pusher;

class ProjectChatController extends Controller
{
    /**
     * Get total unread counts for sidebar badges.
     */
    public function getUnreadCounts()
    {
        $userId = Auth::id();
        
        // 1. Project Chat Unread
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

        // 2. Direct Chat Unread
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

        // 3. Group Chat Unread
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
     * Show the full page chat view.
     */
    public function fullPageChat()
    {
        $userId = Auth::id();
        $projects = Project::with([
            'projectTeamMembers.user.media' => function($query) {
                $query->where('category', 'profile')->latest()->limit(1);
            }
        ])
        ->where('project_status', '!=', 'Deliver')
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function ($project) use ($userId) {
            $lastRead = ProjectChatRead::where('user_id', $userId)
                ->where('project_id', $project->id)
                ->first();

            $query = ProjectChat::where('project_id', $project->id);
            if ($lastRead) {
                $query->where('created_at', '>', $lastRead->last_read_at);
            }
            
            $project->unread_count = $query->where('user_id', '!=', $userId)->count();
            return $project;
        });

        return \Inertia\Inertia::render('Pages/chat/ProjectChat', [
            'projects' => $projects
        ]);
    }

    /**
     * Get chat history for a project.
     */
    public function index($projectId)
    {
        $userId = Auth::id();
        
        // Mark as read
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
     * Store a new chat message.
     */
    public function store(Request $request, $projectId)
    {
        $request->validate([
            'message' => 'nullable|string',
            'file' => 'nullable|file',
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
            $path = public_path('uploads/media/group_chat_file');
            if (!file_exists($path)) {
                mkdir($path, 0777, true);
            }
            $file->move($path, $fileName);

            Media::create([
                'user_id' => Auth::id(),
                'file_path' => 'uploads/media/group_chat_file/' . $fileName,
                'category' => 'group_chat',
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

        // Broadcast to the specific project chat (for people looking at the chat)
        $this->broadcastMessage($projectId, 'event-new-message', $messageData);

        // Broadcast a notification to all team members' private channels
        $project = Project::with('projectTeamMembers')->find($projectId);
        if ($project) {
            foreach ($project->projectTeamMembers as $member) {
                // Don't notify the sender themselves for the badge, but keep them in sync if needed
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

        // Check if user is owner or admin (optional)
        if ($chat->user_id !== Auth::id() && Auth::user()->role_id !== 1) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Delete associated media
        foreach ($chat->media as $media) {
            $filePath = public_path($media->file_path);
            if (file_exists($filePath)) {
                unlink($filePath);
            }
            $media->delete();
        }

        $idToDelete = $chat->id;
        $chat->delete();

        // Broadcast deletion
        $this->broadcastMessage($projectId, 'event-delete-message', ['id' => $idToDelete]);

        return response()->json(['status' => 'success', 'message' => 'Message deleted']);
    }

    private function broadcastMessage($projectId, $event, $data)
    {
        $channel = 'project-chat-' . $projectId;
        $personalServerUrl = 'https://api-socket.bidwinners.net/publish';
        $usePersonalServer = false;

        try {
            $client = new \GuzzleHttp\Client(['timeout' => 2, 'verify' => false]);
            $client->post($personalServerUrl, [
                'json' => [
                    'channel' => $channel,
                    'event' => $event,
                    'data' => $data
                ]
            ]);
        } catch (\Exception $e) {
            \Log::info("Personal socket server error: " . $e->getMessage());
        }

        /* 
        $usePersonalServer = false;
        if (!$usePersonalServer) {
            $options = [ 
                'cluster' => 'ap2', 
                'useTLS' => true, 
            ];
            $pusherClient = new \GuzzleHttp\Client(['verify' => false]);
            $pusher = new Pusher(
                '5158315c26b8f6732773', // app key
                '9ba1bfd3baa3f4ec2a4c', // app secret
                '2057639', // app id
                $options,
                $pusherClient
            );
            $pusher->trigger($channel, $event, [
                'data' => $data,
                'channel' => $channel
            ]);
        }
        */
    }

    private function broadcastToUser($userId, $event, $data)
    {
        $channel = 'user-notifications-' . $userId;
        $personalServerUrl = 'https://api-socket.bidwinners.net/publish';

        try {
            $client = new \GuzzleHttp\Client(['timeout' => 2, 'verify' => false]);
            $client->post($personalServerUrl, [
                'json' => [
                    'channel' => $channel,
                    'event' => $event,
                    'data' => $data
                ]
            ]);
        } catch (\Exception $e) {
            \Log::info("Personal socket server error (User Notification): " . $e->getMessage());
        }
    }
}
