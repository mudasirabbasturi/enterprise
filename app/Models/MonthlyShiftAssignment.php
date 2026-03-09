<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MonthlyShiftAssignment extends Model
{
    protected $fillable = [
        'user_id',
        'shift_id',
        'month',
        'year',
        'start_day',
        'end_day',
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
