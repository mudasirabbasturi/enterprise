<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserAllowedIp extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'ip_address',
        'notes',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
