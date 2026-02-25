<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserAttendance extends Model
{
    protected $fillable = [
        'user_id',
        'date',
        'check_in',
        'check_out',
        'worked_from',
        'check_in_ip',
        'check_out_ip',
        'break_start',
        'break_end',
        'status',
        'notes',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

