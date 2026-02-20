<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\EmployeeSalary;
use App\Models\PayrollPayment;
use App\Models\UserAttendance;
use App\Models\PayrollConfig;
use App\Models\PayrollPenalty;
use App\Models\PayrollAdjustment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class SalarySheetController extends Controller
{
    public function index(Request $request)
    {
        $month = $request->input('month', Carbon::now()->month);
        $year = $request->input('year', Carbon::now()->year);

        $users = User::with(['salary.package.allowances', 'salary.package.taxRules'])->get();
        
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
            ->select('user_id', \Illuminate\Support\Facades\DB::raw('SUM(points_gain) as total_points'))
            ->groupBy('user_id')
            ->pluck('total_points', 'user_id');

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

        return Inertia::render('Pages/Payroll/SalarySheet', [
            'users' => $users,
            'attendances' => $attendances,
            'penalties' => $penalties,
            'payments' => $payments,
            'adjustments' => $adjustments,
            'config' => $config,
            'leaveRequests' => $leaveRequests,
            'projectPoints' => $projectPoints,
            'selectedMonth' => (int)$month,
            'selectedYear' => (int)$year
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
}
