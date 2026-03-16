<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalarySheetSnapshot extends Model
{
    protected $fillable = [
        'month',
        'year',
        'batch_id',
        'user_id',
        'snapshot_data',
    ];

    protected $casts = [
        'snapshot_data' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
