<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectChatRead extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'project_id',
        'last_read_at',
    ];

    protected $dates = [
        'last_read_at',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
