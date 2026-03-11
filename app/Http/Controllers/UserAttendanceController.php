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
            'config' => \App\Models\PayrollConfig::all()->pluck('value', 'key')->all(),
        ]);
    }

    public function Index(Request $request)
    {
        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);

        // Fetch attendances for specific month/year
        $attendances = UserAttendance::with('user')
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->get();

        // Fetch users with branch and shift schedules for the master grid
        $users = User::with(['branch', 'userShiftSchedules.shift'])
            ->select('id', 'name', 'email', 'branch_id', 'is_permission_granted', 'ip_restriction')
            ->get();

        // Fetch approved leave requests for the month
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

        $config = \App\Models\PayrollConfig::all()->pluck('value', 'key')->all();

        return Inertia::render('Pages/WorkSchedule/UserAttendance', [
            'attendances' => $attendances,
            'users' => $users,
            'leaveRequests' => $leaveRequests,
            'selectedMonth' => (int)$month,
            'selectedYear' => (int)$year,
            'holidays' => $holidays,
            'config' => $config,
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
            'break' => 'nullable|array',
            'total_regular_hours' => 'nullable',
            'total_outside_hours' => 'nullable|array',
            'status' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        // Shift Restriction Logic
        $user = User::with(['userShiftSchedules.shift'])->findOrFail($validated['user_id']);
        $dayName = \Carbon\Carbon::parse($validated['date'])->format('l');
        $shiftSchedule = $user->userShiftSchedules->where('day', $dayName)->first();

        if ($shiftSchedule && $shiftSchedule->shift) {
            $shift = $shiftSchedule->shift;
            $config = \App\Models\PayrollConfig::all()->pluck('value', 'key')->all();
            $earlyBufferMins = intval(floatval($config['attendance_early_checkin_max_hours'] ?? 2) * 60);
            $lateBufferMins = intval(floatval($config['attendance_late_checkout_max_hours'] ?? 4) * 60);
            $needsIpCheck = false;
            if ($user->ip_restriction) {
                if ($request->input('manual_hours_save')) {
                    $outsideHours = $request->input('total_outside_hours', []);
                    if (is_array($outsideHours)) {
                        foreach ($outsideHours as $entry) {
                            if (($entry['work_from'] ?? 'office') === 'office') {
                                $needsIpCheck = true;
                                break;
                            }
                        }
                    }
                } else {
                    if (($validated['worked_from'] ?? 'office') === 'office') {
                        $needsIpCheck = true;
                    }
                }
            }

            if ($needsIpCheck) {
                $allowedIps = $config['user_attendace_allowed_ips'] ?? [];
                if (!is_array($allowedIps)) {
                    $allowedIps = json_decode($allowedIps, true) ?: [];
                }

                $currentIp = $this->getClientIp($request);
                if (!in_array($currentIp, $allowedIps)) {
                    $errorMessage = "Access Denied: Your IP ($currentIp) is not authorized for office attendance.";
                    if ($request->ajax() || $request->wantsJson()) {
                        return response()->json(['message' => $errorMessage], 403);
                    }
                    return redirect()->back()->withErrors(['user_id' => $errorMessage]);
                }
            }

            // Validate Check-in time against buffer
            if (!empty($validated['check_in'])) {
                $checkInTime = \Carbon\Carbon::parse($validated['date'] . ' ' . $validated['check_in']);
                $shiftStartTime = \Carbon\Carbon::parse($validated['date'] . ' ' . $shift->start_time);
                
                if ($checkInTime->lt($shiftStartTime->copy()->subMinutes($earlyBufferMins))) {
                    $bufferText = $earlyBufferMins >= 60 ? (round($earlyBufferMins/60, 1) . " hours") : ($earlyBufferMins . " minutes");
                    $errorMessage = "Too early! You can only check in up to {$bufferText} before your shift starts (" . $shift->start_time . ").";
                    if ($request->ajax() || $request->wantsJson()) {
                        return response()->json(['message' => $errorMessage], 422);
                    }
                    return redirect()->back()->withErrors([
                        'check_in' => $errorMessage
                    ]);
                }
            }

            // Validate Check-out time against buffer and check-in
            if (!empty($validated['check_out'])) {
                $checkOutTime = \Carbon\Carbon::parse($validated['date'] . ' ' . $validated['check_out']);
                $shiftEndTime = \Carbon\Carbon::parse($validated['date'] . ' ' . $shift->end_time);
                
                if ($shift->end_time < $shift->start_time) {
                    $shiftEndTime->addDay();
                    if ($checkOutTime->lt(\Carbon\Carbon::parse($validated['date'] . ' ' . $shift->start_time))) {
                        $checkOutTime->addDay();
                    }
                }

                // Ensure check-out is after check-in
                if (!empty($validated['check_in'])) {
                    $checkInTime = \Carbon\Carbon::parse($validated['date'] . ' ' . $validated['check_in']);
                    if ($checkOutTime->lte($checkInTime)) {
                        $errorMessage = "Invalid Check-out! You must check out after your check-in time.";
                        if ($request->ajax() || $request->wantsJson()) {
                            return response()->json(['message' => $errorMessage], 422);
                        }
                        return redirect()->back()->withErrors(['check_out' => $errorMessage]);
                    }
                }

                if ($checkOutTime->gt($shiftEndTime->copy()->addMinutes($lateBufferMins))) {
                    $bufferText = $lateBufferMins >= 60 ? (round($lateBufferMins/60, 1) . " hours") : ($lateBufferMins . " minutes");
                    $errorMessage = "Too late! You cannot check out more than {$bufferText} after your shift ends (" . $shift->end_time . ").";
                    if ($request->ajax() || $request->wantsJson()) {
                        return response()->json(['message' => $errorMessage], 422);
                    }
                    return redirect()->back()->withErrors([
                        'check_out' => $errorMessage
                    ]);
                }
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
            'break' => 'nullable|array',
            'total_regular_hours' => 'nullable',
            'total_outside_hours' => 'nullable|array',
            'status' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        // Shift Restriction Logic
        $user = User::with(['userShiftSchedules.shift'])->findOrFail($validated['user_id']);
        $dayName = \Carbon\Carbon::parse($validated['date'])->format('l');
        $shiftSchedule = $user->userShiftSchedules->where('day', $dayName)->first();

        if ($shiftSchedule && $shiftSchedule->shift) {
            $shift = $shiftSchedule->shift;
            $config = \App\Models\PayrollConfig::all()->pluck('value', 'key')->all();
            $earlyBufferMins = intval(floatval($config['attendance_early_checkin_max_hours'] ?? 2) * 60);
            $lateBufferMins = intval(floatval($config['attendance_late_checkout_max_hours'] ?? 4) * 60);
            $isAdminAction = $request->input('is_admin_action');

            if ($user->ip_restriction && !$isAdminAction) {
                $needsIpCheck = false;
                if ($request->input('manual_hours_save')) {
                    $outsideHours = $request->input('total_outside_hours', []);
                    if (is_array($outsideHours)) {
                        foreach ($outsideHours as $entry) {
                            if (($entry['work_from'] ?? 'office') === 'office') {
                                $needsIpCheck = true;
                                break;
                            }
                        }
                    }
                } else {
                    if (($validated['worked_from'] ?? 'office') === 'office') {
                        $needsIpCheck = true;
                    }
                }

                if ($needsIpCheck) {
                    $allowedIps = $config['user_attendace_allowed_ips'] ?? [];
                    if (!is_array($allowedIps)) {
                        $allowedIps = json_decode($allowedIps, true) ?: [];
                    }

                    $currentIp = $this->getClientIp($request);
                    if (!in_array($currentIp, $allowedIps)) {
                        $errorMessage = "Access Denied: Your IP ($currentIp) is not authorized for office attendance.";
                        if ($request->ajax() || $request->wantsJson()) {
                            return response()->json(['message' => $errorMessage], 403);
                        }
                        return redirect()->back()->withErrors(['user_id' => $errorMessage]);
                    }
                }
            }

            // Skip buffer checks for admin action
            if (!$isAdminAction) {
                // Prepare times for night shift handling
                $checkInTime = !empty($validated['check_in']) ? \Carbon\Carbon::parse($validated['date'] . ' ' . $validated['check_in']) : null;
                $checkOutTime = !empty($validated['check_out']) ? \Carbon\Carbon::parse($validated['date'] . ' ' . $validated['check_out']) : null;
                $shiftStartTime = \Carbon\Carbon::parse($validated['date'] . ' ' . $shift->start_time);
                $shiftEndTime = \Carbon\Carbon::parse($validated['date'] . ' ' . $shift->end_time);
                
                // Night shift day crossing
                if ($shift->end_time < $shift->start_time) {
                    $shiftEndTime->addDay();
                    if ($checkInTime && $checkInTime->lt($shiftStartTime->copy()->subHours(12))) $checkInTime->addDay();
                    if ($checkOutTime && $checkOutTime->lt($shiftStartTime->copy()->subHours(12))) $checkOutTime->addDay();
                }

                // Validate Check-in
                if ($checkInTime && $checkInTime->lt($shiftStartTime->copy()->subMinutes($earlyBufferMins))) {
                    $bufferText = $earlyBufferMins >= 60 ? (round($earlyBufferMins/60, 1) . " hours") : ($earlyBufferMins . " minutes");
                    $errorMessage = "Too early! You can only check in up to {$bufferText} before your shift starts (" . $shift->start_time . ").";
                    if ($request->ajax() || $request->wantsJson()) return response()->json(['message' => $errorMessage], 422);
                    return redirect()->back()->withErrors(['check_in' => $errorMessage]);
                }

                // Validate Check-out
                if ($checkOutTime) {
                    // Ensure check-out is after check-in
                    $curCheckInTime = $checkInTime;
                    if (!$curCheckInTime && !empty($attendance->check_in)) {
                        $curCheckInTime = \Carbon\Carbon::parse($validated['date'] . ' ' . $attendance->check_in);
                        // Handle potential day crossing for existing check-in too
                        if ($shift->end_time < $shift->start_time && $curCheckInTime->lt($shiftStartTime->copy()->subHours(12))) {
                            $curCheckInTime->addDay();
                        }
                    }

                    if ($curCheckInTime && $checkOutTime->lte($curCheckInTime)) {
                        $errorMessage = "Invalid Check-out! You must check out after your check-in time.";
                        if ($request->ajax() || $request->wantsJson()) return response()->json(['message' => $errorMessage], 422);
                        return redirect()->back()->withErrors(['check_out' => $errorMessage]);
                    }

                    // Strict upper limit (Shift End + Buffer)
                    if ($checkOutTime->gt($shiftEndTime->copy()->addMinutes($lateBufferMins))) {
                        $bufferText = $lateBufferMins >= 60 ? (round($lateBufferMins/60, 1) . " hours") : ($lateBufferMins . " minutes");
                        $errorMessage = "Too late! You cannot check out more than {$bufferText} after your shift ends (" . $shift->end_time . ").";
                        if ($request->ajax() || $request->wantsJson()) return response()->json(['message' => $errorMessage], 422);
                        return redirect()->back()->withErrors(['check_out' => $errorMessage]);
                    }
                }
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

    public function ToggleIpRestriction(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'ip_restriction' => 'required|boolean',
        ]);

        $user = User::findOrFail($validated['user_id']);
        $user->ip_restriction = $validated['ip_restriction'];
        $user->save();

        return response()->json(['message' => 'IP restriction updated successfully.']);
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

    public function GetTodayAttendance(Request $request)
    {
        $user = auth()->user();
        
        $now = now();
        if ($request->has('client_date')) {
            // Attempt to parse the client date, fallback to now if invalid
            try {
                $clientDate = \Carbon\Carbon::parse($request->input('client_date'));
                $now->setDateFrom($clientDate);
            } catch (\Exception $e) {}
        }

        $todayDate = $now->toDateString();
        $yesterdayDate = $now->copy()->subDay()->toDateString();

        // 1. Fetch relevant config
        $config = \App\Models\PayrollConfig::all()->pluck('value', 'key')->all();
        $earlyBufferMins = intval(floatval($config['attendance_early_checkin_max_hours'] ?? 2) * 60);
        $lateBufferMins = intval(floatval($config['attendance_late_checkout_max_hours'] ?? 4) * 60);

        // 2. Fetch today's and yesterday's shift schedules
        $user->load(['userShiftSchedules.shift']);
        $schedules = $user->userShiftSchedules;
        
        $todayDay = $now->format('l');
        $yesterdayDay = $now->copy()->subDay()->format('l');
        
        $todaySchedule = $schedules->firstWhere('day', $todayDay);
        $yesterdaySchedule = $schedules->firstWhere('day', $yesterdayDay);

        // 3. Priority 1: Check for any active record (In Progress - waiting for checkout)
        // This covers night shifts that started yesterday but are still active today.
        $activeAttendance = UserAttendance::where('user_id', $user->id)
            ->whereNull('check_out')
            ->orderBy('date', 'desc')
            ->first();

        if ($activeAttendance) {
            return response()->json([
                'attendance' => $activeAttendance,
                'userShiftSchedules' => $schedules,
                'config' => $config,
                'date_context' => $activeAttendance->date
            ]);
        }

        // 4. Priority 2: Today's record (could be completed or not started)
        // Following the rule: "yesterday checkin is closed ... only check in of today"
        $attendance = UserAttendance::where('user_id', $user->id)
            ->where('date', $todayDate)
            ->first();

        return response()->json([
            'attendance' => $attendance,
            'userShiftSchedules' => $schedules,
            'config' => $config,
            'date_context' => $todayDate
        ]);
    }

    public function GetCurrentIp(Request $request)
    {
        return response()->json(['ip' => $this->getClientIp($request)]);
    }

    protected function getClientIp(Request $request)
    {
        $ip = $request->ip();

        // If running locally (localhost), try to fetch the actual public IP for testing
        if ($ip === '127.0.0.1' || $ip === '::1') {
            try {
                $ctx = stream_context_create(['http' => ['timeout' => 3]]);
                $externalIp = @file_get_contents('https://api.ipify.org', false, $ctx);
                if ($externalIp && filter_var($externalIp, FILTER_VALIDATE_IP)) {
                    return $externalIp;
                }
            } catch (\Exception $e) {}
        }
        return $ip;
    }
}
