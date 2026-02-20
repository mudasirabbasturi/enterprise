<?php

namespace App\Http\Controllers;

use App\Models\LeaveRequest;
use App\Models\LeaveType;
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
            LeaveRequest::create($validated);
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
                'status' => 'required|in:approved,rejected,cancelled',
                'rejection_reason' => 'nullable|string',
            ]);

            $leaveRequest->update([
                'status' => $validated['status'],
                'rejection_reason' => $validated['rejection_reason'] ?? null,
                'approved_at' => in_array($validated['status'], ['approved', 'rejected']) ? now() : null,
                'approved_by' => in_array($validated['status'], ['approved', 'rejected']) ? auth()->id() : null,
            ]);

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
            LeaveRequest::findOrFail($id)->delete();
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
            LeaveRequest::whereIn('id', $validated['ids'])->delete();
            return redirect()->back()->with('message', 'Selected leave requests deleted successfully.');
        } catch (Exception $e) {
            return redirect()->back()->withErrors([
                'error' => 'Failed to delete selected leave requests. Please try again.'
            ]);
        }
    }
}
