<?php

namespace App\Http\Controllers;

use App\Models\UserAttendance;
use App\Models\User;
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

        return Inertia::render('Pages/WorkSchedule/MyAttendance', [
            'attendances' => $attendances,
            'selectedYear' => (int)$year,
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

        // Fetch users with branch and allowed IPs for the master grid
        $users = User::with(['branch', 'userAllowedIp' => function($query) {
            $query->select('user_id', 'ip_address', 'notes');
        }])->select('id', 'name', 'email', 'branch_id')->get();

        return Inertia::render('Pages/WorkSchedule/UserAttendance', [
            'attendances' => $attendances,
            'users' => $users,
            'selectedMonth' => (int)$month,
            'selectedYear' => (int)$year,
        ]);
    }

    public function Store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'check_in' => 'nullable',
            'check_out' => 'nullable',
            'overtime_hours' => 'nullable|numeric',
            'check_in_ip' => 'nullable|ip',
            'check_out_ip' => 'nullable|ip',
            'status' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        // IP Restriction Logic
        $user = User::with('userAllowedIp')->findOrFail($validated['user_id']);
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

        UserAttendance::create($validated);

        return redirect()->back()->with('message', 'Attendance record created successfully.');
    }

    public function Update(Request $request, $id)
    {
        $attendance = UserAttendance::findOrFail($id);
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'check_in' => 'nullable',
            'check_out' => 'nullable',
            'overtime_hours' => 'nullable|numeric',
            'check_in_ip' => 'nullable|ip',
            'check_out_ip' => 'nullable|ip',
            'status' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        // IP Restriction Logic
        $user = User::with('userAllowedIp')->findOrFail($validated['user_id']);
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

        return redirect()->back()->with('message', 'Attendance record updated successfully.');
    }

    public function Destroy($id)
    {
        $attendance = UserAttendance::findOrFail($id);
        $attendance->delete();

        return redirect()->back()->with('message', 'Attendance record deleted successfully.');
    }
}
