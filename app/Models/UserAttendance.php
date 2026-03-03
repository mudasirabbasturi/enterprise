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
        'total_regular_hours',
        'total_outside_hours',
        'status',
        'notes',
    ];

    protected $casts = [
        'total_outside_hours' => 'json',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

