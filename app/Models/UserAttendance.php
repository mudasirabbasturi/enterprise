<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserAttendance extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'date',
        'check_in',
        'check_out',
        'overtime_hours',
        'check_in_ip',
        'check_out_ip',
        'status',
        'notes',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

