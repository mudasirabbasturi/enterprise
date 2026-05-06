<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatGroup extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description', 'avatar', 'created_by'];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'chat_group_user')->withPivot('role')->withTimestamps();
    }

    public function messages()
    {
        return $this->hasMany(GlobalMessage::class, 'group_id');
    }

    public function lastMessage()
    {
        return $this->hasOne(GlobalMessage::class, 'group_id')->latest();
    }
}
