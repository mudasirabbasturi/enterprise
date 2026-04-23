<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserActivity extends Model
{
    protected $fillable = [
        'user_id',
        'app_name',
        'window_title',
        'clicks',
        'keystrokes',
        'is_idle',
        'tracked_at'
    ];

    protected $casts = [
        'tracked_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
