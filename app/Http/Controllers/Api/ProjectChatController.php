<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\ProjectChat;
use App\Models\Media;
use Illuminate\Support\Facades\Auth;
use Pusher\Pusher;

class ProjectChatController extends Controller
{
    /**
     * Show the full page chat view.
     */
    public function fullPageChat()
    {
        $projects = \App\Models\Project::with([
            'projectTeamMembers.user.media' => function($query) {
                $query->where('category', 'profile')->latest()->limit(1);
            }
        ])
        ->where('project_status', '!=', 'Deliver')
        ->orderBy('created_at', 'desc')
        ->get();

        return \Inertia\Inertia::render('Pages/chat/ProjectChat', [
            'projects' => $projects
        ]);
    }

    /**
     * Get chat history for a project.
     */
    public function index($projectId)
    {
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

        // Broadcast via Pusher
        $this->broadcastMessage($projectId, 'event-new-message', $messageData);

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
        $options = [ 
            'cluster' => 'ap2', 
            'useTLS' => true, 
        ];
        $client = new \GuzzleHttp\Client(['verify' => false]);
        $pusher = new Pusher(
            '5158315c26b8f6732773', // app key
            '9ba1bfd3baa3f4ec2a4c', // app secret
            '2057639', // app id
            $options,
            $client
        );
        $pusher->trigger('project-chat-' . $projectId, $event, [
            'data' => $data,
            'channel' => 'project-chat-' . $projectId
        ]);
    }
}
