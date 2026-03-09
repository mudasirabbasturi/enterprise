<?php

namespace App\Http\Controllers;

use App\Models\LeaveType;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Database\UniqueConstraintViolationException;
use Exception;

class LeaveTypeController extends Controller
{
    public function Index()
    {
        return Inertia::render('Pages/LeaveManagement/LeaveTypes', [
            'leaveTypes' => LeaveType::all()
        ]);
    }

    public function Store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'nullable|string|max:20',
            'max_per_year' => 'nullable|integer|min:0',
            'requires_approval' => 'boolean',
        ]);

        try {
            LeaveType::create($validated);
            return redirect()->back()->with('message', 'Leave type created successfully.');
        } catch (UniqueConstraintViolationException $e) {
            return redirect()->back()->withErrors([
                'code' => 'This leave type code is already in use.'
            ]);
        } catch (Exception $e) {
            return redirect()->back()->withErrors([
                'error' => 'Failed to create leave type. Please try again.'
            ]);
        }
    }

    public function Update(Request $request, $id)
    {
        try {
            $leaveType = LeaveType::findOrFail($id);

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'color' => 'nullable|string|max:20',
                'max_per_year' => 'nullable|integer|min:0',
                'requires_approval' => 'boolean',
            ]);

            $leaveType->update($validated);

            return redirect()->back()->with('message', 'Leave type updated successfully.');
        } catch (UniqueConstraintViolationException $e) {
            return redirect()->back()->withErrors([
                'code' => 'This leave type code is already in use.'
            ]);
        } catch (Exception $e) {
            return redirect()->back()->withErrors([
                'error' => 'Failed to update leave type. Please try again.'
            ]);
        }
    }

    public function Destroy($id)
    {
        try {
            LeaveType::findOrFail($id)->delete();
            return redirect()->back()->with('message', 'Leave type deleted successfully.');
        } catch (Exception $e) {
            return redirect()->back()->withErrors([
                'error' => 'Cannot delete this leave type. It may be in use by leave policies or requests.'
            ]);
        }
    }

    public function BulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:leave_types,id',
        ]);

        try {
            LeaveType::whereIn('id', $validated['ids'])->delete();
            return redirect()->back()->with('message', 'Selected leave types deleted successfully.');
        } catch (Exception $e) {
            return redirect()->back()->withErrors([
                'error' => 'Cannot delete some selected leave types. They may be in use by leave policies or requests.'
            ]);
        }
    }
}
