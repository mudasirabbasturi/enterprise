<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PayrollAdjustment extends Model
{
    protected $fillable = [
        'user_id', 'payroll_payment_id', 'month', 'year', 'label', 'amount', 'type', 'reason'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function payrollPayment()
    {
        return $this->belongsTo(PayrollPayment::class);
    }
}
