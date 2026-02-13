<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
class LeaveType extends Model
{
    protected $fillable = [
        'name',
        'code',
        'color',
        'is_paid',
        'is_carry_forward',
        'max_per_year',
        'allow_half_day',
    ];

    protected $casts = [
        'is_paid' => 'boolean',
        'is_carry_forward' => 'boolean',
        'allow_half_day' => 'boolean',
    ];

    public function policies()
    {
        return $this->hasMany(LeavePolicy::class);
    }

    public function balances()
    {
        return $this->hasMany(LeaveBalance::class);
    }

    public function requests()
    {
        return $this->hasMany(LeaveRequest::class);
    }
}
