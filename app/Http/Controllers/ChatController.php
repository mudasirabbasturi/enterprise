<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Chat;
use App\Models\ChatMessage;
use App\Models\ChatParticipant;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Events\ChatMessageSent;
use Ably\AblyRest;

class ChatController extends Controller
{
    /**
     * Get unread count for sidebar
     */

    
    public function view()
    {
        return inertia('Pages/Chat/Chat');
    }

    public function ablyAuth(Request $request)
    {
        $ably = new AblyRest(config('broadcasting.connections.ably.key') ?? env('ABLY_KEY'));
        $tokenRequest = $ably->auth->createTokenRequest([
            'clientId' => (string) $request->user()->id,
        ]);

        return response()->json($tokenRequest);
    }
    /**
     * Get list of chats for the authenticated user
     */
    public function index()
    {
        $userId = Auth::id();
        $currentUser = Auth::user();

        // 1. Get all active users as potential direct contacts
        $users = User::where('id', '!=', $userId)
            ->where('status', 'active')
            ->with('media')
            ->get();

        $directContacts = $users->map(function($user) use ($userId) {
            // Find a direct chat between these two users
            $chat = Chat::where('type', 'direct')
                ->whereHas('participants', function($q) use ($userId) {
                    $q->where('user_id', $userId);
                })
                ->whereHas('participants', function($q) use ($user) {
                    $q->where('user_id', $user->id);
                })
                ->first();

            if ($chat) {
                // Attach latest message and unread count
                $latestMessage = $chat->messages()->latest()->first();
                $lastReadAt = $chat->participants()->where('user_id', $userId)->value('last_read_at');
                
                $unreadCount = $chat->messages()
                    ->where('sender_id', '!=', $userId)
                    ->when($lastReadAt, function($q) use ($lastReadAt) {
                        $q->where('created_at', '>', $lastReadAt);
                    })
                    ->count();

                return [
                    'id' => $chat->id,
                    'user_id' => $user->id,
                    'name' => $user->name,
                    'avatar' => $user->media->first()->file_path ?? null,
                    'type' => 'direct',
                    'unread_count' => $unreadCount,
                    'latest_message' => $latestMessage ? $latestMessage->message : null,
                    'latest_message_time' => $latestMessage ? $latestMessage->created_at->toIso8601String() : null,
                    'is_online' => (bool)$user->is_online,
                    'last_active_at' => $user->last_active_at ? $user->last_active_at->toIso8601String() : null,
                    'is_existing' => true
                ];
            }

            // No existing chat
            return [
                'id' => 'new-' . $user->id,
                'user_id' => $user->id,
                'name' => $user->name,
                'avatar' => $user->media->first()->file_path ?? null,
                'type' => 'direct',
                'unread_count' => 0,
                'latest_message' => null,
                'latest_message_time' => null,
                'is_online' => (bool)$user->is_online,
                'last_active_at' => $user->last_active_at ? $user->last_active_at->toIso8601String() : null,
                'is_existing' => false
            ];
        });

        // 2. Get Group Chats where the user is a participant
        $groupChats = Chat::where('type', 'group')
            ->whereHas('participants', function($q) use ($userId) {
                $q->where('user_id', $userId);
            })
            ->with(['participants.user.media', 'messages' => function($q) {
                $q->latest();
            }])
            ->get()
            ->map(function($chat) use ($userId) {
                $latestMessage = $chat->messages->first();
                $lastReadAt = $chat->participants()->where('user_id', $userId)->value('last_read_at');
                
                $unreadCount = $chat->messages()
                    ->where('sender_id', '!=', $userId)
                    ->when($lastReadAt, function($q) use ($lastReadAt) {
                        $q->where('created_at', '>', $lastReadAt);
                    })
                    ->count();

                return [
                    'id' => $chat->id,
                    'name' => $chat->name,
                    'type' => 'group',
                    'unread_count' => $unreadCount,
                    'latest_message' => $latestMessage ? $latestMessage->message : null,
                    'latest_message_time' => $latestMessage ? $latestMessage->created_at->toIso8601String() : null,
                    'is_existing' => true,
                    'participants' => $chat->participants
                ];
            });

        // 3. Combine and Sort: Chats with latest messages first, then others alphabetically
        $allChats = $directContacts->concat($groupChats);

        return response()->json($allChats->sort(function($a, $b) {
            $timeA = $a['latest_message_time'] ?? 0;
            $timeB = $b['latest_message_time'] ?? 0;
            
            if ($timeA != $timeB) {
                return $timeB <=> $timeA;
            }
            
            return strcmp($a['name'], $b['name']);
        })->values());
    }

    /**
     * Get messages for a specific chat
     */
    public function getMessages($chatId)
    {
        $userId = Auth::id();
        $chat = Chat::findOrFail($chatId);

        // Verify participant
        if (!$chat->participants()->where('user_id', $userId)->exists()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Mark as read
        ChatParticipant::where('chat_id', $chatId)
            ->where('user_id', $userId)
            ->update(['last_read_at' => now()]);

        $messages = ChatMessage::where('chat_id', $chatId)
            ->with(['sender.media', 'replyTo.sender'])
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($messages);
    }

    /**
     * Send a message to a chat
     */
    public function sendMessage(Request $request, $chatId)
    {
        $request->validate([
            'message' => 'nullable|string',
            'file' => 'nullable|file|max:10240',
            'reply_to_id' => 'nullable|exists:chat_messages,id'
        ]);

        $userId = Auth::id();
        $chat = Chat::findOrFail($chatId);

        // Verify participant
        if (!$chat->participants()->where('user_id', $userId)->exists()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $filePath = null;
        $fileType = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');

            // Use different folder per chat type
            $folder = $chat->type === 'group' ? 'group_files' : 'chat_files';
            $destinationPath = public_path("uploads/media/{$folder}");

            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0777, true);
            }

            $fileName = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->move($destinationPath, $fileName);
            $filePath = "uploads/media/{$folder}/" . $fileName;
            $fileType = $file->getClientMimeType();
        }

        $message = ChatMessage::create([
            'chat_id' => $chatId,
            'sender_id' => $userId,
            'message' => $request->message,
            'file_path' => $filePath,
            'file_type' => $fileType,
            'reply_to_id' => $request->reply_to_id
        ]);

        $message->load(['sender.media', 'replyTo.sender', 'chat']);

        // Mark sender's read status
        ChatParticipant::where('chat_id', $chatId)
            ->where('user_id', $userId)
            ->update(['last_read_at' => now()]);

        // Broadcast via Ably (Direct cURL with SSL bypass for Windows)
        try {
            $ablyKey = config('broadcasting.connections.ably.key') ?? env('ABLY_KEY');

            // 1. Broadcast to the Chat Channel (for active chat view)
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, "https://rest.ably.io/channels/chat.{$message->chat_id}/messages");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['name' => 'message.sent', 'data' => ['message' => $message]]));
            if (config('app.env') === 'local') curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Basic ' . base64_encode($ablyKey), 'Content-Type: application/json']);
            curl_exec($ch);
            curl_close($ch);

            // 2. Broadcast to each Participant's User Channel (for sidebar counters and sounds)
            $participants = $message->chat->participants()->where('user_id', '!=', $userId)->pluck('user_id');
            foreach ($participants as $participantId) {
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, "https://rest.ably.io/channels/user.{$participantId}/messages");
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
                curl_setopt($ch, CURLOPT_POST, 1);
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['name' => 'notification', 'data' => ['message' => $message]]));
                if (config('app.env') === 'local') curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Basic ' . base64_encode($ablyKey), 'Content-Type: application/json']);
                curl_exec($ch);
                curl_close($ch);
            }
        } catch (\Exception $e) {
            \Log::error("Ably Manual Broadcast Error: " . $e->getMessage());
        }

        return response()->json($message);
    }

    /**
     * Create a new chat (Direct or Group)
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'nullable|string|max:255',
            'type' => 'required|in:direct,group',
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id'
        ]);

        $userId = Auth::id();
        $user = Auth::user();
        $userIds = $request->user_ids;

        // Any user can create groups now

        if (!in_array($userId, $userIds)) {
            $userIds[] = $userId;
        }

        // For direct chats, check if one already exists
        if ($request->type === 'direct' && count($userIds) === 2) {
            $existingChat = Chat::where('type', 'direct')
                ->whereHas('participants', function ($query) use ($userIds) {
                    $query->whereIn('user_id', $userIds);
                }, '=', 2)
                ->first();

            if ($existingChat) {
                return response()->json($existingChat->load('participants.user.media'));
            }
        }

        return DB::transaction(function () use ($request, $userId, $userIds) {
            $chat = Chat::create([
                'name' => $request->name,
                'type' => $request->type,
                'created_by' => $userId
            ]);

            foreach ($userIds as $id) {
                ChatParticipant::create([
                    'chat_id' => $chat->id,
                    'user_id' => $id,
                    'role' => $id === $userId ? 'admin' : 'member'
                ]);
            }

            $chat->load(['participants.user.media', 'messages']);
            $latestMessage = $chat->messages->first();

            return response()->json([
                'id' => $chat->id,
                'name' => $chat->name,
                'type' => $chat->type,
                'unread_count' => 0,
                'latest_message' => $latestMessage ? $latestMessage->message : null,
                'latest_message_time' => $latestMessage ? $latestMessage->created_at->toIso8601String() : null,
                'is_existing' => true,
                'participants' => $chat->participants
            ]);
        });
    }

    /**
     * Get list of all users to start a new chat
     */
    public function getUsers()
    {
        $currentUser = Auth::user();
        
        $users = User::where('id', '!=', $currentUser->id)
            ->where('status', 'active')
            ->with(['media', 'role'])
            ->get();

        return response()->json($users);
    }

    /**
     * Delete a group chat (only admin/creator can delete)
     */
    public function destroy($chatId)
    {
        $userId = Auth::id();
        $chat = Chat::findOrFail($chatId);

        // Only group chats can be deleted this way
        if ($chat->type !== 'group') {
            return response()->json(['error' => 'Only group chats can be deleted.'], 403);
        }

        // No restrictions: anyone in the group can delete (as per user request)
        // Check if user is a participant
        $isParticipant = $chat->participants()->where('user_id', $userId)->exists();
        if (!$isParticipant && Auth::user()->role_id != 1) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Delete all messages and participants, then the chat
        $chat->messages()->delete();
        $chat->participants()->delete();
        $chat->delete();

        return response()->json(['message' => 'Group deleted successfully.']);
    }

    /**
     * Update a group chat
     */
    public function update(Request $request, $chatId)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'user_ids' => 'required|array|min:1'
        ]);

        $chat = Chat::findOrFail($chatId);
        if ($chat->type !== 'group') {
            return response()->json(['error' => 'Only group chats can be updated.'], 403);
        }

        DB::transaction(function () use ($request, $chat) {
            $chat->update(['name' => $request->name]);

            // Sync participants
            $chat->participants()->delete();
            
            $userIds = array_unique(array_merge($request->user_ids, [Auth::id()]));
            foreach ($userIds as $id) {
                ChatParticipant::create([
                    'chat_id' => $chat->id,
                    'user_id' => $id,
                    'role' => $id === Auth::id() ? 'admin' : 'member'
                ]);
            }
        });

        // Fetch it back with everything needed, matching the index structure
        $updatedChat = Chat::where('id', $chat->id)
            ->with(['participants.user.media', 'messages' => function($q) {
                $q->latest();
            }])
            ->first();

        $latestMessage = $updatedChat->messages->first();
        
        return response()->json([
            'id' => $updatedChat->id,
            'name' => $updatedChat->name,
            'type' => 'group',
            'unread_count' => 0, 
            'latest_message' => $latestMessage ? $latestMessage->message : null,
            'latest_message_time' => $latestMessage ? $latestMessage->created_at->toIso8601String() : null,
            'is_existing' => true,
            'participants' => $updatedChat->participants
        ]);
    }
    /**
     * Delete a message
     */
    public function destroyMessage($chatId, $messageId)
    {
        $userId = Auth::id();
        $message = ChatMessage::where('chat_id', $chatId)->findOrFail($messageId);

        // Only sender can delete their own message
        if ($message->sender_id !== $userId) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Delete associated file if exists
        if ($message->file_path) {
            $fullPath = public_path($message->file_path);
            if (file_exists($fullPath)) {
                unlink($fullPath);
            }
        }

        $message->delete();

        // Broadcast deletion via Ably
        try {
            $ablyKey = config('broadcasting.connections.ably.key') ?? env('ABLY_KEY');
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, "https://rest.ably.io/channels/chat.{$chatId}/messages");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['name' => 'message.deleted', 'data' => ['messageId' => $messageId]]));
            if (config('app.env') === 'local') curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Basic ' . base64_encode($ablyKey), 'Content-Type: application/json']);
            curl_exec($ch);
            curl_close($ch);
        } catch (\Exception $e) {}

        return response()->json(['success' => true]);
    }

    /**
     * Mark a chat as read for the current user
     */
    public function markAsRead($chatId)
    {
        $userId = Auth::id();
        
        ChatParticipant::where('chat_id', $chatId)
            ->where('user_id', $userId)
            ->update(['last_read_at' => now()]);

        return response()->json(['success' => true]);
    }

    /**
     * Get unread message counts for the authenticated user
     */
    public function getUnreadCount()
    {
        $user = Auth::user();
        if (!$user) return response()->json(['total' => 0, 'direct' => 0, 'group' => 0]);
        
        $unreadMessages = ChatMessage::whereHas('chat.participants', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->where('sender_id', '!=', $user->id)
            ->where(function($query) use ($user) {
                $query->whereExists(function ($q) use ($user) {
                    $q->select(DB::raw(1))
                      ->from('chat_participants')
                      ->whereColumn('chat_participants.chat_id', 'chat_messages.chat_id')
                      ->where('chat_participants.user_id', $user->id)
                      ->where(function($sq) {
                          $sq->whereNull('chat_participants.last_read_at')
                             ->orWhereColumn('chat_messages.created_at', '>', 'chat_participants.last_read_at');
                      });
                });
            })
            ->join('chats', 'chat_messages.chat_id', '=', 'chats.id')
            ->select('chats.type', DB::raw('count(*) as count'))
            ->groupBy('chats.type')
            ->get();

        $direct = $unreadMessages->where('type', 'direct')->first()?->count ?? 0;
        $group = $unreadMessages->where('type', 'group')->first()?->count ?? 0;

        return response()->json([
            'total' => $direct + $group,
            'direct' => (int)$direct,
            'group' => (int)$group
        ]);
    }

    /**
     * Update a user's chat group (Admin only)
     */
    public function updateUserChatGroup(Request $request, $userId)
    {
        if (Auth::user()->role_id != 1) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'chat_group' => 'nullable|string|max:255'
        ]);

        $user = User::findOrFail($userId);
        $user->chat_group = $request->chat_group;
        $user->save();

        return response()->json(['success' => true, 'user' => $user]);
    }
}
