<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserAttendance;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;

class MobileAttendanceController extends Controller
{
    /**
     * Get today's attendance record for a user.
     */
    public function today($userId)
    {
        $today = Carbon::today()->toDateString();
        
        $attendance = UserAttendance::where('user_id', $userId)
            ->where('date', $today)
            ->first();

        return response()->json([
            'attendance' => $attendance,
            'date' => $today,
            'server_time' => now()->format('H:i:s'),
        ]);
    }

    /**
     * Store a new attendance record (Check In).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'check_in' => 'nullable',
            'check_out' => 'nullable',
            'worked_from' => 'required|in:home,office',
            'break_start' => 'nullable',
            'break_end' => 'nullable',
            'total_regular_hours' => 'nullable',
            'total_outside_hours' => 'nullable|array',
            'status' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        // Auto-capture IP
        $validated['check_in_ip'] = $request->ip();

        $attendance = UserAttendance::updateOrCreate(
            ['user_id' => $validated['user_id'], 'date' => $validated['date']],
            $validated
        );

        return response()->json([
            'message' => 'Attendance record saved successfully.',
            'attendance' => $attendance->fresh(),
        ]);
    }

    /**
     * Update an existing attendance record (Check Out, Break, Manual Hours).
     */
    public function update(Request $request, $id)
    {
        $attendance = UserAttendance::findOrFail($id);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'check_in' => 'nullable',
            'check_out' => 'nullable',
            'worked_from' => 'required|in:home,office',
            'break_start' => 'nullable',
            'break_end' => 'nullable',
            'total_regular_hours' => 'nullable',
            'total_outside_hours' => 'nullable|array',
            'status' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        // Auto-capture check-out IP if checking out
        if ($attendance->check_in && !empty($validated['check_out'])) {
            $validated['check_out_ip'] = $request->ip();
        }

        $attendance->update($validated);

        return response()->json([
            'message' => 'Attendance record updated successfully.',
            'attendance' => $attendance->fresh(),
        ]);
    }
}
