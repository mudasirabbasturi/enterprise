<?php

namespace App\Http\Controllers;

use App\Models\UserAttendance;
use App\Models\User;
use App\Models\Holiday;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserAttendanceController extends Controller
{
    public function MyAttendance(Request $request)
    {
        $year = $request->input('year', now()->year);
        $user = auth()->user();

        // Fetch all attendances for the logged-in user in the selected year
        $attendances = UserAttendance::where('user_id', $user->id)
            ->whereYear('date', $year)
            ->get();

        // Load shift schedules for the authenticated user
        $user->load('userShiftSchedules.shift');

        // Fetch approved leave requests for the year
        $leaveRequests = \App\Models\LeaveRequest::with('leaveType')
            ->where('user_id', $user->id)
            ->where('status', 'approved')
            ->where(function($query) use ($year) {
                $query->whereYear('start_date', $year)
                      ->orWhereYear('end_date', $year);
            })
            ->get();

        $holidays = Holiday::whereYear('date', $year)->get();

        return Inertia::render('Pages/WorkSchedule/MyAttendance', [
            'attendances' => $attendances,
            'leaveRequests' => $leaveRequests,
            'userShiftSchedules' => $user->userShiftSchedules,
            'selectedYear' => (int)$year,
            'holidays' => $holidays,
        ]);
    }

    public function Index(Request $request)
    {
        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);

        // Fetch attendances for specific month/year if needed, 
        // or just return all and filter on frontend for now to match the reference logic.
        // However, for performance and "full functionality", we should filter in backend.
        $attendances = UserAttendance::with('user')
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->get();

        // Fetch users with branch, allowed IPs, and shift schedules (with shift details) for the master grid
        $users = User::with(['branch', 'userAllowedIp' => function($query) {
            $query->select('user_id', 'ip_address', 'notes');
        }, 'userShiftSchedules.shift'])->select('id', 'name', 'email', 'branch_id')->get();

        // Fetch approved leave requests for the month to show in attendance
        $leaveRequests = \App\Models\LeaveRequest::with('leaveType')
            ->where('status', 'approved')
            ->where(function($query) use ($year, $month) {
                $query->whereYear('start_date', $year)
                      ->whereMonth('start_date', $month)
                      ->orWhere(function($q) use ($year, $month) {
                          $q->whereYear('end_date', $year)
                            ->whereMonth('end_date', $month);
                      });
            })
            ->get();

        $holidays = Holiday::whereYear('date', $year)
            ->whereMonth('date', $month)
            ->get();

        return Inertia::render('Pages/WorkSchedule/UserAttendance', [
            'attendances' => $attendances,
            'users' => $users,
            'leaveRequests' => $leaveRequests,
            'selectedMonth' => (int)$month,
            'selectedYear' => (int)$year,
            'holidays' => $holidays,
        ]);
    }

    public function Store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'check_in' => 'nullable',
            'check_out' => 'nullable',
            'worked_from' => 'required|in:home,office',
            'check_in_ip' => 'nullable|ip',
            'check_out_ip' => 'nullable|ip',
            'break_start' => 'nullable',
            'break_end' => 'nullable',
            'total_regular_hours' => 'nullable',
            'total_outside_hours' => 'nullable|array',
            'status' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        // Shift Restriction Logic
        $user = User::with(['userAllowedIp', 'userShiftSchedules'])->findOrFail($validated['user_id']);
        $dayName = \Carbon\Carbon::parse($validated['date'])->format('l');
        $hasShift = $user->userShiftSchedules->contains('day', $dayName);

        if (!$hasShift) {
            return redirect()->back()->withErrors([
                'date' => "User {$user->name} is not scheduled to work on $dayName ($validated[date])."
            ]);
        }

        $allowedIps = $user->userAllowedIp->pluck('ip_address')->toArray();

        if (count($allowedIps) > 0) {
            $currentIp = $request->ip();
            if (!in_array($currentIp, $allowedIps)) {
                 return redirect()->back()->withErrors([
                    'user_id' => "Access Denied: Your IP ($currentIp) is not authorized for this user's attendance."
                ]);
            }
        }

        // Auto-capture IP if not provided
        if (empty($validated['check_in_ip'])) {
            $validated['check_in_ip'] = $request->ip();
        }

        UserAttendance::updateOrCreate(
            ['user_id' => $validated['user_id'], 'date' => $validated['date']],
            $validated
        );

        if ($request->header('X-Inertia')) {
            return redirect()->back()->with('message', 'Attendance record saved successfully.');
        }

        if ($request->ajax() || $request->wantsJson()) {
            return response()->json(['message' => 'Attendance record saved successfully.']);
        }

        return redirect()->back()->with('message', 'Attendance record saved successfully.');
    }

    public function Update(Request $request, $id)
    {
        $attendance = UserAttendance::findOrFail($id);
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'check_in' => 'nullable',
            'check_out' => 'nullable',
            'worked_from' => 'required|in:home,office',
            'check_in_ip' => 'nullable|ip',
            'check_out_ip' => 'nullable|ip',
            'break_start' => 'nullable',
            'break_end' => 'nullable',
            'total_regular_hours' => 'nullable',
            'total_outside_hours' => 'nullable|array',
            'status' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        // Shift Restriction Logic
        $user = User::with(['userAllowedIp', 'userShiftSchedules'])->findOrFail($validated['user_id']);
        $dayName = \Carbon\Carbon::parse($validated['date'])->format('l');
        $hasShift = $user->userShiftSchedules->contains('day', $dayName);

        if (!$hasShift) {
            return redirect()->back()->withErrors([
                'date' => "User {$user->name} is not scheduled to work on $dayName ($validated[date])."
            ]);
        }

        $allowedIps = $user->userAllowedIp->pluck('ip_address')->toArray();

        if (count($allowedIps) > 0) {
            $currentIp = $request->ip();
            if (!in_array($currentIp, $allowedIps)) {
                 return redirect()->back()->withErrors([
                    'user_id' => "Access Denied: Your IP ($currentIp) is not authorized for this user's attendance."
                ]);
            }
        }

        // Auto-capture check-out IP if checking out
        if ($attendance->check_in && !empty($validated['check_out']) && empty($validated['check_out_ip'])) {
            $validated['check_out_ip'] = $request->ip();
        }

        $attendance->update($validated);

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Attendance record updated successfully.']);
        }

        return redirect()->back()->with('message', 'Attendance record updated successfully.');
    }

    public function Destroy(Request $request, $id)
    {
        $attendance = UserAttendance::findOrFail($id);
        $attendance->delete();

        if ($request->ajax() || $request->wantsJson()) {
            return response()->json(['message' => 'Attendance record deleted successfully.']);
        }

        return redirect()->back()->with('message', 'Attendance record deleted successfully.');
    }
}
