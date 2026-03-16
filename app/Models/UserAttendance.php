<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserAttendance extends Model
{
    protected $fillable = [
        'user_id',
        'date',
        'clock',
        'status',
        'notes',
    ];

    protected $casts = [
        'clock' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

