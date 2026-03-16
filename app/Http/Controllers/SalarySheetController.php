<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\EmployeeSalary;
use App\Models\PayrollPayment;
use App\Models\UserAttendance;
use App\Models\PayrollConfig;
use App\Models\PayrollPenalty;
use App\Models\MonthlyShiftAssignment;
use App\Models\PayrollAdjustment;
use App\Models\Shift;
use App\Models\Holiday;
use App\Models\SalarySheetSnapshot;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SalarySheetController extends Controller
{


    public function saveMonthlyShifts(Request $request)
    {
        $validated = $request->validate([
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer',
            'groups' => 'nullable|array',
            'groups.*.user_ids' => 'nullable|array',
            'groups.*.user_ids.*' => 'exists:users,id',
            'groups.*.ranges' => 'required|array|min:1',
            'groups.*.ranges.*.shift_id' => 'required|exists:shifts,id',
            'groups.*.ranges.*.start_day' => 'required|integer|min:1|max:31',
            'groups.*.ranges.*.end_day' => 'required|integer|min:1|max:31',
        ]);

        try {
            DB::beginTransaction();

            // Delete all existing assignments for this month/year
            MonthlyShiftAssignment::where('month', $validated['month'])
                ->where('year', $validated['year'])
                ->delete();

            // Track assigned users to prevent duplicates
            $assignedUsers = [];

            if (isset($validated['groups']) && !empty($validated['groups'])) {
                foreach ($validated['groups'] as $group) {
                    $userIds = $group['user_ids'] ?? [];
                    $ranges = $group['ranges'] ?? [];

                    // Sort ranges by start_day to check for overlaps
                    usort($ranges, function ($a, $b) {
                        return $a['start_day'] <=> $b['start_day'];
                    });

                    // Check for overlapping ranges within the same group
                    for ($i = 0; $i < count($ranges) - 1; $i++) {
                        if ($ranges[$i]['end_day'] >= $ranges[$i + 1]['start_day']) {
                            throw ValidationException::withMessages([
                                'error' => "Shift ranges in a group cannot overlap. (Range {$ranges[$i]['start_day']}-{$ranges[$i]['end_day']} overlaps with {$ranges[$i + 1]['start_day']}-{$ranges[$i + 1]['end_day']})"
                            ]);
                        }
                    }

                    // Skip if no ranges defined
                    if (empty($ranges)) {
                        continue;
                    }

                    // If no users selected, this becomes a global assignment
                    if (empty($userIds)) {
                        foreach ($ranges as $range) {
                            MonthlyShiftAssignment::create([
                                'month' => $validated['month'],
                                'year' => $validated['year'],
                                'user_id' => null,
                                'shift_id' => $range['shift_id'],
                                'start_day' => $range['start_day'],
                                'end_day' => $range['end_day'],
                            ]);
                        }
                    } else {
                        // Create assignments for each user in this group
                        foreach ($userIds as $userId) {
                            // Check for duplicate assignments
                            if (in_array($userId, $assignedUsers)) {
                                $user = User::find($userId);
                                throw ValidationException::withMessages([
                                    'error' => "User {$user->name} is assigned to multiple groups. Each user can only be in one group."
                                ]);
                            }

                            $assignedUsers[] = $userId;

                            foreach ($ranges as $range) {
                                MonthlyShiftAssignment::create([
                                    'month' => $validated['month'],
                                    'year' => $validated['year'],
                                    'user_id' => $userId,
                                    'shift_id' => $range['shift_id'],
                                    'start_day' => $range['start_day'],
                                    'end_day' => $range['end_day'],
                                ]);
                            }
                        }
                    }
                }
            }

            DB::commit();

            return redirect()->back()->with('success', 'Monthly shift assignments updated successfully.');

        } catch (ValidationException $e) {
            DB::rollBack();
            throw $e;
        } catch (\Exception $e) {
            DB::rollBack();
            throw ValidationException::withMessages(['error' => $e->getMessage()]);
        }
    }
    public function index(Request $request)
    {
        $month = $request->input('month', Carbon::now()->month);
        $year = $request->input('year', Carbon::now()->year);

        $users = User::with(['salary.package.allowances', 'salary.package.taxRules', 'userShiftSchedules.shift'])
            ->get();

        $attendances = UserAttendance::whereMonth('date', $month)
            ->whereYear('date', $year)
            ->get();

        $penalties = PayrollPenalty::whereMonth('date', $month)
            ->whereYear('date', $year)
            ->get();

        $payments = PayrollPayment::with('adjustments')->where('month', $month)
            ->where('year', $year)
            ->get();

        $adjustments = PayrollAdjustment::where('month', $month)
            ->where('year', $year)
            ->get();

        $config = PayrollConfig::pluck('value', 'key')->all();

        // Fetch project points for the month
        $projectPoints = \App\Models\ProjectTeamMember::whereMonth('created_at', $month)
            ->whereYear('created_at', $year)
            ->select('user_id', DB::raw('SUM(points_gain) as total_points'))
            ->groupBy('user_id')
            ->pluck('total_points', 'user_id');

        // Fetch approved leave requests for the month
        $leaveRequests = \App\Models\LeaveRequest::with('leaveType')
            ->where('status', 'approved')
            ->where(function ($query) use ($year, $month) {
                $query->whereYear('start_date', $year)
                    ->whereMonth('start_date', $month)
                    ->orWhere(
                        function ($q) use ($year, $month) {
                            $q->whereYear('end_date', $year)
                                ->whereMonth('end_date', $month);
                        }
                    );
            })
            ->get();
        $shifts = Shift::where('is_active', true)->get();
        $monthlyShiftAssignments = MonthlyShiftAssignment::where('month', $month)
            ->where('year', $year)
            ->get();
        $holidays = Holiday::whereMonth('date', $month)
            ->whereYear('date', $year)
            ->get();
        return Inertia::render('Pages/Payroll/SalarySheet', [
            'users' => $users,
            'attendances' => $attendances,
            'penalties' => $penalties,
            'payments' => $payments,
            'adjustments' => $adjustments,
            'config' => $config,
            'leaveRequests' => $leaveRequests,
            'projectPoints' => $projectPoints,
            'selectedMonth' => (int) $month,
            'selectedYear' => (int) $year,
            'selectedBatchId' => $request->input('batch'),
            'shifts' => $shifts,
            'monthlyShiftAssignments' => $monthlyShiftAssignments,
            'holidays' => $holidays
        ]);
    }

    public function processPayment(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer',
            'gross_salary' => 'required|numeric',
            'total_deductions' => 'required|numeric',
            'net_pay' => 'required|numeric',
            'payment_method' => 'required|string',
            'payment_date' => 'required|date',
            'reference' => 'nullable|string',
            'notes' => 'nullable|string',
            'status' => 'required|string|in:pending,processed,failed,paid',
            'adjustments' => 'nullable|array'
        ]);

        $payment = PayrollPayment::updateOrCreate(
            ['user_id' => $validated['user_id'], 'month' => $validated['month'], 'year' => $validated['year']],
            collect($validated)->except('adjustments')->toArray()
        );

        // Handle adjustments
        if (isset($validated['adjustments'])) {
            // Delete old ones for this specific payment (or month/year if payment is new)
            $payment->adjustments()->delete();

            foreach ($validated['adjustments'] as $adj) {
                $payment->adjustments()->create([
                    'user_id' => $validated['user_id'],
                    'month' => $validated['month'],
                    'year' => $validated['year'],
                    'label' => $adj['label'],
                    'amount' => $adj['amount'],
                    'type' => $adj['type'],
                    'reason' => $adj['reason'] ?? null,
                ]);
            }
        }

        return redirect()->back()->with('message', 'Payment processed successfully.');
    }

    public function unpayPayment(Request $request)
    {
        $validated = $request->validate([
            'id' => 'nullable|exists:payroll_payments,id',
            'user_id' => 'required|exists:users,id',
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer',
        ]);

        if (isset($validated['id'])) {
            PayrollPayment::destroy($validated['id']);
        } else {
            PayrollPayment::where('user_id', $validated['user_id'])
                ->where('month', $validated['month'])
                ->where('year', $validated['year'])
                ->delete();
        }

        return redirect()->back()->with('message', 'Payment cancelled successfully.');
    }

    public function myPayroll(Request $request)
    {
        $year = $request->input('year', now()->year);
        $month = $request->input('month', now()->month);
        $user = auth()->user();

        $query = SalarySheetSnapshot::where('user_id', $user->id)
            ->where('year', $year);

        if ($month) {
            $query->where('month', $month);
        }

        $snapshots = $query->orderBy('month', 'desc')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($snapshot) use ($user) {
                $data = $snapshot->snapshot_data;
                return [
                    'id' => $snapshot->id,
                    'user_id' => $snapshot->user_id,
                    'name' => $data['name'] ?? $user->name,
                    'net_pay' => $data['net_pay'] ?? 0,
                    'status' => $data['payment_status'] ?? 'Pending',
                    'month' => $snapshot->month,
                    'year' => $snapshot->year,
                    'created_at' => $snapshot->created_at,
                    'snapshot_data' => $data,
                ];
            });

        return inertia('Pages/Payroll/MyPayroll', [
            'snapshots' => $snapshots,
            'selectedMonth' => (int) $month,
            'selectedYear' => (int) $year
        ]);
    }

    public function storeSnapshot(Request $request)
    {
        $validated = $request->validate([
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer',
            'data' => 'required|array',
        ]);

        $batchId = (string) \Illuminate\Support\Str::uuid();

        foreach ($validated['data'] as $userData) {
            SalarySheetSnapshot::create([
                'month' => $validated['month'],
                'year' => $validated['year'],
                'batch_id' => $batchId,
                'user_id' => $userData['id'] ?? null,
                'snapshot_data' => $userData,
            ]);
        }

        return redirect()->back()->with('message', 'Salary sheet snapshot generated successfully.');
    }

    public function getSnapshots(Request $request)
    {
        $validated = $request->validate([
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer',
        ]);

        $snapshots = SalarySheetSnapshot::where('month', $validated['month'])
            ->where('year', $validated['year'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('batch_id');

        return response()->json($snapshots);
    }

    public function snapshotArchive(Request $request)
    {
        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);

        $snapshots = SalarySheetSnapshot::where('month', $month)
            ->where('year', $year)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($snapshot) {
                $data = $snapshot->snapshot_data;
                return [
                    'id' => $snapshot->id,
                    'batch_id' => $snapshot->batch_id,
                    'user_id' => $snapshot->user_id,
                    'name' => $data['name'] ?? 'Unknown',
                    'net_pay' => $data['net_pay'] ?? 0,
                    'status' => $data['payment_status'] ?? 'Pending',
                    'month' => $snapshot->month,
                    'year' => $snapshot->year,
                    'created_at' => $snapshot->created_at,
                    'snapshot_data' => $data,
                ];
            });

        return inertia('Pages/Payroll/FinalSheets', [
            'snapshots' => $snapshots,
            'selectedMonth' => (int) $month,
            'selectedYear' => (int) $year
        ]);
    }

    public function destroySnapshot($id)
    {
        SalarySheetSnapshot::findOrFail($id)->delete();
        return redirect()->back()->with('success', 'Snapshot deleted successfully.');
    }

    public function bulkDestroySnapshots(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:salary_sheet_snapshots,id'
        ]);

        SalarySheetSnapshot::whereIn('id', $validated['ids'])->delete();
        return redirect()->back()->with('success', 'Selected snapshots deleted successfully.');
    }
}
