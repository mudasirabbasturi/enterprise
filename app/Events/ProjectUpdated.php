<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Project;

class ProjectUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $project;

    public function __construct(Project $project)
    {
        $this->project = $project;
    }

    public function broadcastOn(): Channel
    {
        return new Channel('projects');
    }

    public function broadcastAs(): string
    {
        return 'project.updated';
    }
}
