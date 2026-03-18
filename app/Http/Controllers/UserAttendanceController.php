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
            ->select('id', 'name', 'email', 'branch_id', 'is_permission_granted', 'ip_restriction', 'status')
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
            'work_from' => 'nullable|in:home,office',
            'status' => 'nullable|string',
            'notes' => 'nullable|string',
            'type' => 'nullable|string', // check_in, check_out, break_start, break_end
        ]);

        $user = User::findOrFail($validated['user_id']);
        $config = \App\Models\PayrollConfig::all()->pluck('value', 'key')->all();
        $workFrom = $request->input('work_from', 'office');
        
        // IP Restriction: ONLY for office AND user has restriction true
        if ($workFrom === 'office' && $user->ip_restriction) {
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

        $attendance = UserAttendance::firstOrNew(['user_id' => $validated['user_id'], 'date' => $validated['date']]);
        if ($request->is_admin_action) {
            $clock = $request->input('clock', []);
        } else {
            $type = $request->input('type', 'check_in');
            $currentTime = now()->format('H:i:s');

            if ($type === 'check_in') {
                $clock[] = [
                    'work_from' => $workFrom,
                    'check_in' => $currentTime,
                    'break' => [
                        'break_start' => null,
                        'break_end' => null,
                    ],
                    'check_out' => null,
                    'status' => ($workFrom === 'home' ? 'pending' : 'approved')
                ];
                $attendance->status = $validated['status'] ?? 'Marked';
            }
        }

        if ($request->is_admin_action && empty($clock) && $attendance->exists) {
            $attendance->delete();
            return response()->json(['message' => 'Attendance record deleted because no segments were left.']);
        }

        $attendance->clock = $clock;
        if ($request->is_admin_action && isset($validated['status'])) {
            $attendance->status = $validated['status'];
        }
        $attendance->notes = $validated['notes'] ?? $attendance->notes;
        $attendance->save();

        return response()->json(['message' => 'Attendance record saved successfully.', 'attendance' => $attendance]);
    }

    public function Update(Request $request, $id)
    {
        $attendance = UserAttendance::findOrFail($id);
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'work_from' => 'nullable|in:home,office',
            'type' => 'required_without:is_admin_action|string', // check_in, check_out, break_start, break_end
            'status' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $user = User::findOrFail($validated['user_id']);
        $workFrom = $request->input('work_from', 'office');
        
        // IP Restriction logic
        if ($workFrom === 'office' && $user->ip_restriction) {
            $config = \App\Models\PayrollConfig::all()->pluck('value', 'key')->all();
            $allowedIps = $config['user_attendace_allowed_ips'] ?? [];
            if (!is_array($allowedIps)) {
                $allowedIps = json_decode($allowedIps, true) ?: [];
            }
            $currentIp = $this->getClientIp($request);
            if (!in_array($currentIp, $allowedIps)) {
                return response()->json(['message' => "Access Denied: Your IP ($currentIp) is not authorized for office attendance."], 403);
            }
        }

        $clock = $attendance->clock ?? [];
        
        if ($request->is_admin_action) {
            $clock = $request->input('clock', []);
        } else {
            $type = $validated['type'];
            $currentTime = now()->format('H:i:s');

            if ($type === 'check_in') {
                $clock[] = [
                    'work_from' => $workFrom,
                    'check_in' => $currentTime,
                    'break' => [
                        'break_start' => null,
                        'break_end' => null,
                    ],
                    'check_out' => null,
                    'status' => ($workFrom === 'home' ? 'pending' : 'approved')
                ];
            } else if (!empty($clock)) {
                $lastIndex = count($clock) - 1;
                if ($type === 'check_out') {
                    $clock[$lastIndex]['check_out'] = $currentTime;
                } else if ($type === 'break_start') {
                    if (!isset($clock[$lastIndex]['break'])) {
                        $clock[$lastIndex]['break'] = ['break_start' => $currentTime, 'break_end' => null];
                    } else {
                        $brk = $clock[$lastIndex]['break'];
                        if (empty($brk['break_start'])) {
                            $brk['break_start'] = $currentTime;
                        } else {
                            // Find next available slot
                            $i = 2;
                            while(isset($brk["break_start_$i"]) && !empty($brk["break_start_$i"])) {
                                $i++;
                            }
                            $brk["break_start_$i"] = $currentTime;
                            $brk["break_end_$i"] = null;
                        }
                        $clock[$lastIndex]['break'] = $brk;
                    }
                } else if ($type === 'break_end') {
                    if (isset($clock[$lastIndex]['break'])) {
                        $brk = $clock[$lastIndex]['break'];
                        // Find the open break
                        if (!empty($brk['break_start']) && empty($brk['break_end'])) {
                            $brk['break_end'] = $currentTime;
                        } else {
                            $i = 2;
                            while(isset($brk["break_start_$i"])) {
                                if (!empty($brk["break_start_$i"]) && empty($brk["break_end_$i"])) {
                                    $brk["break_end_$i"] = $currentTime;
                                    break;
                                }
                                $i++;
                            }
                        }
                        $clock[$lastIndex]['break'] = $brk;
                    }
                }
            }
        }

        if ($request->is_admin_action && empty($clock)) {
            $attendance->delete();
            return response()->json(['message' => 'Attendance record deleted because no segments were left.']);
        }

        $attendance->clock = $clock;
        if (isset($validated['status'])) $attendance->status = $validated['status'];
        if (isset($validated['notes'])) $attendance->notes = $validated['notes'];
        
        $attendance->save();

        return response()->json(['message' => 'Attendance record updated successfully.', 'attendance' => $attendance]);
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
            try {
                $clientDate = \Carbon\Carbon::parse($request->input('client_date'));
                $now->setDateFrom($clientDate);
            } catch (\Exception $e) {}
        }

        $todayDate = $now->toDateString();
        $yesterdayDate = $now->copy()->subDay()->toDateString();

        // 1. Fetch relevant config
        $config = \App\Models\PayrollConfig::all()->pluck('value', 'key')->all();

        // 2. Load shift schedules
        $user->load(['userShiftSchedules.shift']);
        $schedules = $user->userShiftSchedules;

        // 3. Priority 1: Check for any active session (last entry in clock is missing checkout)
        // Restricted to Today or Yesterday only. Older sessions are ignored.
        $activeAttendance = UserAttendance::where('user_id', $user->id)
            ->whereIn('date', [$todayDate, $yesterdayDate])
            ->whereNotNull('clock')
            ->orderBy('date', 'desc')
            ->get()
            ->first(function($a) use ($config) {
                $clock = $a->clock;
                if (!is_array($clock) || empty($clock)) return false;
                $last = end($clock);
                
                if (!empty($last['check_out'])) return false;

                // User requested: 8.5h + buffer (default 30m)
                // Get buffer from config (attendance_late_checkout_max_hours)
                $bufferHours = isset($config['attendance_late_checkout_max_hours']) 
                    ? (float)$config['attendance_late_checkout_max_hours'] 
                    : 0.5; // default 30 mins

                $maxMinutes = (8.5 + $bufferHours) * 60;

                if (!empty($last['check_in'])) {
                    try {
                        // date of attendance + check_in time
                        $checkInDateTime = \Carbon\Carbon::parse($a->date . ' ' . $last['check_in']);
                        if ($checkInDateTime->diffInMinutes(now()) > $maxMinutes) {
                            return false; // Session expired
                        }
                    } catch (\Exception $e) {}
                }

                return true;
            });

        if ($activeAttendance) {
            return response()->json([
                'attendance' => $activeAttendance,
                'userShiftSchedules' => $schedules,
                'config' => $config,
                'date_context' => $activeAttendance->date
            ]);
        }

        // 4. Priority 2: Today's record
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
