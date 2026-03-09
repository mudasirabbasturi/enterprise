<?php

namespace App\Http\Controllers;

use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\LeaveBalance;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Exception;

class LeaveRequestController extends Controller
{
    public function Index(Request $request)
    {
        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);

        $requests = LeaveRequest::with(['user', 'leaveType', 'approvedBy'])
            ->where(function($query) use ($year, $month) {
                $query->whereYear('start_date', $year)
                      ->whereMonth('start_date', $month)
                      ->orWhere(function($q) use ($year, $month) {
                          $q->whereYear('end_date', $year)
                            ->whereMonth('end_date', $month);
                      });
            })
            ->get();

        return Inertia::render('Pages/LeaveManagement/LeaveRequests', [
            'requests' => $requests,
            'leaveTypes' => LeaveType::all(),
            'users' => User::all(),
            'selectedMonth' => (int)$month,
            'selectedYear' => (int)$year,
        ]);
    }

    public function MyRequests(Request $request)
    {
        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);

        $requests = LeaveRequest::with(['user', 'leaveType', 'approvedBy'])
            ->where('user_id', auth()->id())
            ->where(function($query) use ($year, $month) {
                $query->whereYear('start_date', $year)
                      ->whereMonth('start_date', $month)
                      ->orWhere(function($q) use ($year, $month) {
                          $q->whereYear('end_date', $year)
                            ->whereMonth('end_date', $month);
                      });
            })
            ->get();

        return Inertia::render('Pages/LeaveManagement/LeaveRequests', [
            'requests' => $requests,
            'leaveTypes' => LeaveType::all(),
            'users' => [auth()->user()],
            'isPersonal' => true,
            'selectedMonth' => (int)$month,
            'selectedYear' => (int)$year,
        ]);
    }

    public function Store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'total_days' => 'required|numeric|min:0.5',
            'is_half_day' => 'boolean',
            'half_day_type' => 'nullable|string|in:first_half,second_half',
            'reason' => 'required|string',
        ]);

        try {
            $leaveType = LeaveType::findOrFail($validated['leave_type_id']);
            
            if (!$leaveType->requires_approval) {
                $validated['status'] = 'approved';
                $validated['approved_at'] = now();
                $validated['approved_by'] = auth()->id();
            }

            $leaveRequest = LeaveRequest::create($validated);
            LeaveBalance::updateBalances($leaveRequest->user_id, $leaveRequest->leave_type_id, $leaveRequest->start_date->year);
            return redirect()->back()->with('message', 'Leave request submitted successfully.');
        } catch (Exception $e) {
            return redirect()->back()->withErrors([
                'error' => 'Failed to submit leave request. Please try again.'
            ]);
        }
    }

    public function Update(Request $request, $id)
    {
        try {
            $leaveRequest = LeaveRequest::findOrFail($id);

            $validated = $request->validate([
                'user_id' => 'required|exists:users,id',
                'leave_type_id' => 'required|exists:leave_types,id',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
                'total_days' => 'required|numeric|min:0.5',
                'is_half_day' => 'boolean',
                'half_day_type' => 'nullable|string|in:first_half,second_half',
                'reason' => 'required|string',
            ]);

            $leaveRequest->update($validated);
            LeaveBalance::updateBalances($leaveRequest->user_id, $leaveRequest->leave_type_id, $leaveRequest->start_date->year);

            return redirect()->back()->with('message', 'Leave request updated successfully.');
        } catch (Exception $e) {
            return redirect()->back()->withErrors([
                'error' => 'Failed to update leave request. Please try again.'
            ]);
        }
    }

    public function UpdateStatus(Request $request, $id)
    {
        try {
            $leaveRequest = LeaveRequest::findOrFail($id);

            $validated = $request->validate([
                'status' => 'required|in:approved,rejected,cancelled,pending',
                'rejection_reason' => 'nullable|string',
            ]);

            $leaveRequest->update([
                'status' => $validated['status'],
                'rejection_reason' => $validated['status'] === 'pending' ? null : ($validated['rejection_reason'] ?? $leaveRequest->rejection_reason),
                'approved_at' => in_array($validated['status'], ['approved', 'rejected']) ? now() : null,
                'approved_by' => in_array($validated['status'], ['approved', 'rejected']) ? auth()->id() : null,
            ]);

            LeaveBalance::updateBalances($leaveRequest->user_id, $leaveRequest->leave_type_id, $leaveRequest->start_date->year);

            return redirect()->back()->with('message', 'Leave request status updated successfully.');
        } catch (Exception $e) {
            return redirect()->back()->withErrors([
                'error' => 'Failed to update leave request status. Please try again.'
            ]);
        }
    }

    public function Destroy($id)
    {
        try {
            $leaveRequest = LeaveRequest::findOrFail($id);
            $userId = $leaveRequest->user_id;
            $leaveTypeId = $leaveRequest->leave_type_id;
            $year = $leaveRequest->start_date->year;

            $leaveRequest->delete();

            LeaveBalance::updateBalances($userId, $leaveTypeId, $year);

            return redirect()->back()->with('message', 'Leave request deleted successfully.');
        } catch (Exception $e) {
            return redirect()->back()->withErrors([
                'error' => 'Failed to delete leave request. Please try again.'
            ]);
        }
    }

    public function BulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:leave_requests,id',
        ]);

        try {
            $requests = LeaveRequest::whereIn('id', $validated['ids'])->get();
            $tasks = [];
            foreach ($requests as $r) {
                $tasks[] = ['u' => $r->user_id, 't' => $r->leave_type_id, 'y' => $r->start_date->year];
                $r->delete();
            }

            foreach (array_unique($tasks, SORT_REGULAR) as $task) {
                LeaveBalance::updateBalances($task['u'], $task['t'], $task['y']);
            }

            return redirect()->back()->with('message', 'Selected leave requests deleted successfully.');
        } catch (Exception $e) {
            return redirect()->back()->withErrors([
                'error' => 'Failed to delete selected leave requests. Please try again.'
            ]);
        }
    }
}
