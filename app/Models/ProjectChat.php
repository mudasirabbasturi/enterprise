<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectChat extends Model
{
    protected $fillable = [
        'project_id',
        'user_id',
        'message',
        'reply_to_id',
    ];

    public function replyTo(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(ProjectChat::class, 'reply_to_id');
    }

    public function project(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function media()
    {
        return $this->hasMany(Media::class, 'model_id')->where('model_type', self::class);
    }
}
