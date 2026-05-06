<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GlobalMessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;

    public function __construct($message)
    {
        $this->message = $message;
    }

    public function broadcastOn()
    {
        if ($this->message->group_id) {
            return new Channel('global-chat.group.' . $this->message->group_id);
        }
        
        // For private chat, we broadcast on a channel that both users can listen to
        // Or we can use a private channel. Let's use a public one for simplicity as per user's previous patterns
        return new Channel('global-chat.user.' . $this->message->receiver_id);
    }

    public function broadcastAs()
    {
        return 'message.sent';
    }
}
