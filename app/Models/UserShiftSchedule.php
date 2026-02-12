<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserShiftSchedule extends Model
{
    use SoftDeletes;

    protected $table = 'user_shift_shedules';

    protected $fillable = [
        'user_id',
        'shift_id',
        'day',
        'start_time',
        'end_time',
        'duration',
        'is_available',
        'notes',
    ];

    protected $casts = [
        'is_available' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }
}
