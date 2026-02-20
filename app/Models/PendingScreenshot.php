<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PendingScreenshot extends Model
{
    protected $fillable = [
        'user_id',
        'is_completed',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
