<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeavePolicy extends Model
{
    protected $fillable = [
        'leave_type_id',
        'branch_id',
        'department_id',
        'designation_id',
        'days_per_year',
        'max_per_month',
        'requires_approval',
        'allow_half_day',
    ];

    protected $casts = [
        'requires_approval' => 'boolean',
        'allow_half_day' => 'boolean',
    ];

    public function leaveType()
    {
        return $this->belongsTo(LeaveType::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function designation()
    {
        return $this->belongsTo(Designation::class);
    }
}
