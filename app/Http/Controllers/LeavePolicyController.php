<?php

namespace App\Http\Controllers;

use App\Models\LeavePolicy;
use App\Models\LeaveType;
use App\Models\Branch;
use App\Models\Department;
use App\Models\Designation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Exception;

class LeavePolicyController extends Controller
{
    public function Index()
    {
        return Inertia::render('Pages/LeaveManagement/LeavePolicies', [
            'policies' => LeavePolicy::with(['leaveType', 'branch', 'department', 'designation'])->get(),
            'leaveTypes' => LeaveType::all(),
            'branches' => Branch::all(),
            'departments' => Department::all(),
            'designations' => Designation::all(),
        ]);
    }

    public function Store(Request $request)
    {
        $validated = $request->validate([
            'leave_type_id' => 'required|exists:leave_types,id',
            'branch_id' => 'nullable|exists:branches,id',
            'department_id' => 'nullable|exists:departments,id',
            'designation_id' => 'nullable|exists:designations,id',
            'days_per_year' => 'required|integer|min:0',
            'max_per_month' => 'nullable|integer|min:0',
            'requires_approval' => 'boolean',
            'allow_half_day' => 'boolean',
        ]);

        try {
            LeavePolicy::create($validated);
            return redirect()->back()->with('message', 'Leave policy created successfully.');
        } catch (Exception $e) {
            return redirect()->back()->withErrors([
                'error' => 'Failed to create leave policy. Please try again.'
            ]);
        }
    }

    public function Update(Request $request, $id)
    {
        try {
            $policy = LeavePolicy::findOrFail($id);

            $validated = $request->validate([
                'leave_type_id' => 'required|exists:leave_types,id',
                'branch_id' => 'nullable|exists:branches,id',
                'department_id' => 'nullable|exists:departments,id',
                'designation_id' => 'nullable|exists:designations,id',
                'days_per_year' => 'required|integer|min:0',
                'max_per_month' => 'nullable|integer|min:0',
                'requires_approval' => 'boolean',
                'allow_half_day' => 'boolean',
            ]);

            $policy->update($validated);

            return redirect()->back()->with('message', 'Leave policy updated successfully.');
        } catch (Exception $e) {
            return redirect()->back()->withErrors([
                'error' => 'Failed to update leave policy. Please try again.'
            ]);
        }
    }

    public function Destroy($id)
    {
        try {
            LeavePolicy::findOrFail($id)->delete();
            return redirect()->back()->with('message', 'Leave policy deleted successfully.');
        } catch (Exception $e) {
            return redirect()->back()->withErrors([
                'error' => 'Failed to delete leave policy. Please try again.'
            ]);
        }
    }

    public function BulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:leave_policies,id',
        ]);

        try {
            LeavePolicy::whereIn('id', $validated['ids'])->delete();
            return redirect()->back()->with('message', 'Selected leave policies deleted successfully.');
        } catch (Exception $e) {
            return redirect()->back()->withErrors([
                'error' => 'Failed to delete selected leave policies. Please try again.'
            ]);
        }
    }
}
