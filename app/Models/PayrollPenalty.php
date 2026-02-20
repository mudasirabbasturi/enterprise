<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollPenalty extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'type', 'amount', 'date', 'reason', 'recorded_by_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by_id');
    }
}
