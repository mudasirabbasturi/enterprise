<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserScreenshot extends Model
{
    protected $fillable = [
        'user_id',
        'file_path',
        'screenshot_time',
    ];

    protected $casts = [
        'screenshot_time' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
