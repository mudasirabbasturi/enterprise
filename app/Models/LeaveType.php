<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
class LeaveType extends Model
{
    protected $fillable = [
        'name',
        'color',
        'max_per_year',
        'requires_approval',
    ];

    protected $casts = [
        'requires_approval' => 'boolean',
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
