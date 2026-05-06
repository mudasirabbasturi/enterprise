<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LiveStreamSignal implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $userId;
    public $signalData;
    public $from; // 'admin' or 'tracker'

    public function __construct($userId, $signalData, $from)
    {
        $this->userId = $userId;
        $this->signalData = $signalData;
        $this->from = $from;
    }

    public function broadcastOn()
    {
        return new Channel('live-stream-' . $this->userId);
    }

    public function broadcastAs()
    {
        return 'signal';
    }
}
