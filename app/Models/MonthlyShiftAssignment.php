<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MonthlyShiftAssignment extends Model
{
    protected $fillable = [
        'shift_id',
        'month',
        'year',
        'start_day',
        'end_day',
    ];

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }
}
