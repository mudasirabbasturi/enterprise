<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GlobalMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'sender_id',
        'receiver_id',
        'group_id',
        'message',
        'file_path',
        'file_type',
        'is_read',
        'reply_to_id'
    ];

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function group()
    {
        return $this->belongsTo(ChatGroup::class, 'group_id');
    }

    public function replyTo()
    {
        return $this->belongsTo(GlobalMessage::class, 'reply_to_id');
    }

    public function replies()
    {
        return $this->hasMany(GlobalMessage::class, 'reply_to_id');
    }
}
