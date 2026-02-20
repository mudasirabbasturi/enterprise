<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'month', 'year', 'gross_salary', 'total_deductions', 
        'net_pay', 'payment_method', 'payment_date', 'reference', 'notes', 'status'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function adjustments()
    {
        return $this->hasMany(PayrollAdjustment::class);
    }
}
