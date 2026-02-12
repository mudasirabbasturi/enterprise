<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserActivity extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'details',
        'event_time'
    ];

    protected $casts = [
        'details' => 'array',
        'event_time' => 'datetime'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

