<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GlobalChatRead extends Model
{
    protected $fillable = [
        'user_id',
        'receiver_id',
        'group_id',
        'last_read_at'
    ];
}
