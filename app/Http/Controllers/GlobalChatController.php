<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\ChatGroup;
use App\Models\GlobalMessage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Pusher\Pusher;

use App\Models\GlobalChatRead;
use DB;

class GlobalChatController extends Controller
{
    public function index()
    {
        $userId = Auth::id();
        
        // Fetch users with unread counts
        $users = User::where('id', '!=', $userId)
            ->with(['media' => function($query) {
                $query->where('category', 'profile')->latest();
            }])
            ->get()
            ->map(function($user) use ($userId) {
                $lastRead = GlobalChatRead::where('user_id', $userId)
                    ->where('receiver_id', $user->id)
                    ->value('last_read_at');
                
                $query = GlobalMessage::whereNull('group_id')
                    ->where('sender_id', $user->id)
                    ->where('receiver_id', $userId);
                
                if ($lastRead) {
                    $query->where('created_at', '>', $lastRead);
                }
                
                $user->unread_count = $query->count();
                
                $latestMsg = GlobalMessage::whereNull('group_id')
                    ->where(function($q) use ($userId, $user) {
                        $q->where(function($q2) use ($userId, $user) {
                            $q2->where('sender_id', $userId)->where('receiver_id', $user->id);
                        })->orWhere(function($q2) use ($userId, $user) {
                            $q2->where('sender_id', $user->id)->where('receiver_id', $userId);
                        });
                    })->latest()->first();
                
                $user->latest_message_time = $latestMsg ? $latestMsg->created_at->timestamp : ($user->created_at ? $user->created_at->timestamp : 0);
                return $user;
            })->sortByDesc('latest_message_time')->values();
            
        // Fetch groups with unread counts
        $groups = Auth::user()->chatGroups()
            ->with(['members.media' => function($query) {
                $query->where('category', 'profile')->latest();
            }])
            ->get()
            ->map(function($group) use ($userId) {
                $lastRead = GlobalChatRead::where('user_id', $userId)
                    ->where('group_id', $group->id)
                    ->value('last_read_at');
                
                $query = GlobalMessage::where('group_id', $group->id)
                    ->where('sender_id', '!=', $userId);
                
                if ($lastRead) {
                    $query->where('created_at', '>', $lastRead);
                }
                
                $group->unread_count = $query->count();
                
                $latestMsg = GlobalMessage::where('group_id', $group->id)->latest()->first();
                $group->latest_message_time = $latestMsg ? $latestMsg->created_at->timestamp : ($group->created_at ? $group->created_at->timestamp : 0);
                
                return $group;
            })->sortByDesc('latest_message_time')->values();
        
        return Inertia::render('Pages/chat/GlobalChat', [
            'users' => $users,
            'groups' => $groups
        ]);
    }

    public function markAsRead(Request $request)
    {
        $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'group_id' => 'nullable|exists:chat_groups,id',
        ]);

        $userId = Auth::id();
        $targetUserId = $request->user_id;
        $groupId = $request->group_id;

        try {
            GlobalChatRead::updateOrCreate(
                [
                    'user_id' => $userId,
                    'receiver_id' => $targetUserId,
                    'group_id' => $groupId
                ],
                ['last_read_at' => now()]
            );
        } catch (\Exception $e) {
            \Log::error("Failed to mark as read: " . $e->getMessage());
        }

        return response()->json(['status' => 'success']);
    }

    public function getUnreadCounts()
    {
        $userId = Auth::id();
        
        // Count unread direct messages (not in a group, sent to me, after my last read time for that sender)
        $directUnread = DB::table('global_messages')
            ->whereNull('group_id')
            ->where('receiver_id', $userId)
            ->whereNotExists(function ($query) use ($userId) {
                $query->select(DB::raw(1))
                    ->from('global_chat_reads')
                    ->whereRaw('global_chat_reads.user_id = ?', [$userId])
                    ->whereRaw('global_chat_reads.receiver_id = global_messages.sender_id')
                    ->whereRaw('global_chat_reads.last_read_at >= global_messages.created_at');
            })
            ->count();

        // Count unread group messages (in a group I belong to, not sent by me, after my last read time for that group)
        $groupsUnread = DB::table('global_messages')
            ->whereNotNull('group_id')
            ->where('sender_id', '!=', $userId)
            ->whereIn('group_id', function($query) use ($userId) {
                $query->select('chat_group_id')
                    ->from('chat_group_user')
                    ->where('user_id', $userId);
            })
            ->whereNotExists(function ($query) use ($userId) {
                $query->select(DB::raw(1))
                    ->from('global_chat_reads')
                    ->whereRaw('global_chat_reads.user_id = ?', [$userId])
                    ->whereRaw('global_chat_reads.group_id = global_messages.group_id')
                    ->whereRaw('global_chat_reads.last_read_at >= global_messages.created_at');
            })
            ->count();

        return response()->json([
            'direct' => (int)$directUnread,
            'groups' => (int)$groupsUnread,
            'global' => (int)($directUnread + $groupsUnread),
            'project' => 0
        ]);
    }

    public function getMessages(Request $request)
    {
        $userId = $request->query('user_id');
        $groupId = $request->query('group_id');

        // Mark as read when fetching messages
        $this->markAsRead($request);

        if ($groupId) {
            return GlobalMessage::where('group_id', $groupId)
                ->with(['sender.media', 'replyTo'])
                ->orderBy('created_at', 'asc')
                ->get();
        }

        return GlobalMessage::whereNull('group_id')
            ->where(function ($query) use ($userId) {
                $query->where(function ($q) use ($userId) {
                    $q->where('sender_id', Auth::id())->where('receiver_id', $userId);
                })->orWhere(function ($q) use ($userId) {
                    $q->where('sender_id', $userId)->where('receiver_id', Auth::id());
                });
            })
            ->with(['sender.media', 'replyTo'])
            ->orderBy('created_at', 'asc')
            ->get();
    }

    public function sendMessage(Request $request)
    {
        $request->validate([
            'message' => 'nullable|string',
            'receiver_id' => 'nullable|exists:users,id',
            'group_id' => 'nullable|exists:chat_groups,id',
            'file' => 'nullable|file|max:10240', // 10MB max
            'reply_to_id' => 'nullable|exists:global_messages,id'
        ]);

        $filePath = null;
        $fileType = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $destinationPath = public_path('uploads/media/global_chat_files');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0777, true);
            }
            $fileName = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->move($destinationPath, $fileName);
            $filePath = 'uploads/media/global_chat_files/' . $fileName;
            $fileType = $file->getClientMimeType();
        }

        $message = GlobalMessage::create([
            'sender_id' => Auth::id(),
            'receiver_id' => $request->receiver_id,
            'group_id' => $request->group_id,
            'message' => $request->message,
            'file_path' => $filePath,
            'file_type' => $fileType,
            'reply_to_id' => $request->reply_to_id
        ]);

        $message->load(['sender.media', 'replyTo']);

        // Broadcast
        if ($message->group_id) {
            $groupChannel = 'global-chat.group.' . $message->group_id;
            $channels = [$groupChannel];
            
            // Also notify members personally so their Layout.jsx catches it for counts/sounds
            $group = ChatGroup::find($message->group_id);
            if ($group) {
                foreach ($group->members as $member) {
                    if ($member->id != $message->sender_id) {
                        $channels[] = 'global-chat.user.' . $member->id;
                    }
                }
            }
            $this->broadcastMultiple($channels, 'message.sent', ['message' => $message]);
        } else {
            $channel = 'global-chat.user.' . $message->receiver_id;
            $this->broadcastMessage($channel, 'message.sent', ['message' => $message]);
        }

        return response()->json($message);
    }

    public function deleteMessage($id)
    {
        $message = GlobalMessage::findOrFail($id);
        
        // Only sender can delete
        if ($message->sender_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $idToDelete = $message->id;
        
        if ($message->file_path) {
            $path = public_path($message->file_path);
            if (file_exists($path)) {
                unlink($path);
            }
        }
        
        $message->delete();
        
        // Broadcast deletion
        if ($message->group_id) {
            $groupChannel = 'global-chat.group.' . $message->group_id;
            $channels = [$groupChannel];
            
            $group = ChatGroup::find($message->group_id);
            if ($group) {
                foreach ($group->members as $member) {
                    if ($member->id != $message->sender_id) {
                        $channels[] = 'global-chat.user.' . $member->id;
                    }
                }
            }
            $this->broadcastMultiple($channels, 'message.deleted', ['id' => $idToDelete]);
        } else {
            $channel = 'global-chat.user.' . $message->receiver_id;
            $this->broadcastMessage($channel, 'message.deleted', ['id' => $idToDelete]);
        }

        return response()->json(['status' => 'success']);
    }

    public function createGroup(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id'
        ]);

        $group = ChatGroup::create([
            'name' => $request->name,
            'created_by' => Auth::id()
        ]);

        $userIds = $request->user_ids;
        if (!in_array(Auth::id(), $userIds)) {
            $userIds[] = Auth::id();
        }

        $group->members()->attach($userIds);

        return response()->json($group->load('members'));
    }

    public function updateGroup(Request $request, $id)
    {
        $group = ChatGroup::findOrFail($id);
        
        $request->validate([
            'name' => 'nullable|string|max:255',
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id'
        ]);

        if ($request->has('name')) {
            $group->update(['name' => $request->name]);
        }

        $group->members()->sync($request->user_ids);

        return response()->json($group->load('members'));
    }

    public function deleteGroup($id)
    {
        $group = ChatGroup::findOrFail($id);
        
        // Only creator can delete
        if ($group->created_by !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $group->delete();

        return response()->json(['status' => 'success']);
    }

    private function broadcastMultiple($channels, $event, $data)
    {
        $personalServerUrl = 'https://api-socket.bidwinners.net/publish';

        try {
            $client = new \GuzzleHttp\Client([
                'timeout' => 2.0, 
                'connect_timeout' => 2.0,
                'verify' => false
            ]);
            
            $promises = [];
            foreach ($channels as $channel) {
                $promises[] = $client->postAsync($personalServerUrl, [
                    'json' => [
                        'channel' => $channel,
                        'event' => $event,
                        'data' => $data
                    ]
                ]);
            }
            
            \GuzzleHttp\Promise\Utils::all($promises)->wait();
        } catch (\Exception $e) {
            \Log::info("Personal socket server error: " . $e->getMessage());
        }
    }

    private function broadcastMessage($channel, $event, $data)
    {
        $personalServerUrl = 'https://api-socket.bidwinners.net/publish';
        $usePersonalServer = false;

        try {
            $client = new \GuzzleHttp\Client([
                'timeout' => 1.0, 
                'connect_timeout' => 1.0,
                'verify' => false
            ]);
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
            $pusher->trigger($channel, $event, $data);
        }
        */
    }
}
