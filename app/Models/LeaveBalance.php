<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeaveBalance extends Model
{
    protected $fillable = [
        'user_id',
        'leave_type_id',
        'year',
        'allocated',
        'used',
        'pending',
        'remaining',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function leaveType()
    {
        return $this->belongsTo(LeaveType::class);
    }

    /**
     * Recalculate and update the used, pending, and remaining balances for a user's leave type.
     */
    public static function updateBalances($userId, $leaveTypeId, $year)
    {
        $balance = self::firstOrCreate(
            ['user_id' => $userId, 'leave_type_id' => $leaveTypeId, 'year' => $year],
            ['allocated' => 0, 'used' => 0, 'pending' => 0, 'remaining' => 0]
        );

        $requests = LeaveRequest::where('user_id', $userId)
            ->where('leave_type_id', $leaveTypeId)
            ->where(function ($query) use ($year) {
                $query->whereYear('start_date', $year)
                    ->orWhereYear('end_date', $year);
            })
            ->get();

        $used = 0;
        $pending = 0;

        foreach ($requests as $request) {
            // For simplicity, we count requests starting in this year. 
            // In a more complex setup, you'd split days across years.
            if ($request->start_date->year == $year) {
                if ($request->status === 'approved') {
                    $used += $request->total_days;
                } elseif ($request->status === 'pending') {
                    $pending += $request->total_days;
                }
            }
        }

        $balance->update([
            'used' => $used,
            'pending' => $pending,
            'remaining' => $balance->allocated - $used - $pending,
        ]);
    }
}
