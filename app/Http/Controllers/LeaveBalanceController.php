<?php

namespace App\Http\Controllers;

use App\Models\LeaveBalance;
use App\Models\LeaveType;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Database\UniqueConstraintViolationException;
use Exception;

class LeaveBalanceController extends Controller
{
    public function Index()
    {
        return Inertia::render('Pages/LeaveManagement/LeaveBalances', [
            'balances' => LeaveBalance::with(['user', 'leaveType'])->get(),
            'leaveTypes' => LeaveType::all(),
            'users' => User::all(),
        ]);
    }

    public function MyBalances()
    {
        return Inertia::render('Pages/LeaveManagement/LeaveBalances', [
            'balances' => LeaveBalance::with(['user', 'leaveType'])
                ->where('user_id', auth()->id())
                ->get(),
            'leaveTypes' => LeaveType::all(),
            'users' => [auth()->user()],
            'isPersonal' => true,
        ]);
    }

    public function Store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'year' => 'required|integer|min:2024',
            'allocated' => 'required|numeric|min:0',
            'used' => 'numeric|min:0',
            'pending' => 'numeric|min:0',
            'remaining' => 'required|numeric',
        ]);
 
        try {
            LeaveBalance::create($validated);
            return redirect()->back()->with('message', 'Leave balance record created successfully.');
        } catch (UniqueConstraintViolationException $e) {
            return redirect()->back()->withErrors([
                'error' => 'A leave balance record for this user, leave type, and year already exists.'
            ]);
        } catch (Exception $e) {
            return redirect()->back()->withErrors([
                'error' => 'Failed to create leave balance record. Please try again.'
            ]);
        }
    }

    public function BulkStore(Request $request)
    {
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'year' => 'required|integer|min:2024',
            'allocated' => 'required|numeric|min:0',
        ]);

        try {
            $leaveType = LeaveType::findOrFail($validated['leave_type_id']);
            
            if ($validated['allocated'] > $leaveType->max_per_year) {
                return redirect()->back()->withErrors([
                    'allocated' => "The maximum allowed allocation for {$leaveType->name} is {$leaveType->max_per_year} days per year."
                ]);
            }

            foreach ($validated['user_ids'] as $userId) {
                // We use updateOrCreate to ensure we don't create duplicates and can update existing records if needed
                $balance = LeaveBalance::updateOrCreate(
                    [
                        'user_id' => $userId,
                        'leave_type_id' => $validated['leave_type_id'],
                        'year' => $validated['year'],
                    ],
                    [
                        'allocated' => $validated['allocated'],
                    ]
                );
                
                // Recalculate balances to ensure everything is in sync
                LeaveBalance::updateBalances($userId, $validated['leave_type_id'], $validated['year']);
            }

            return redirect()->back()->with('message', 'Bulk leave balance records created/updated successfully.');
        } catch (Exception $e) {
            return redirect()->back()->withErrors([
                'error' => 'Failed to process bulk leave balance. Please try again.'
            ]);
        }
    }

    public function Update(Request $request, $id)
    {
        try {
            $balance = LeaveBalance::findOrFail($id);

            $validated = $request->validate([
                'allocated' => 'required|numeric|min:0',
                'used' => 'required|numeric|min:0',
                'pending' => 'required|numeric|min:0',
                'remaining' => 'required|numeric',
            ]);

            $balance->update($validated);

            return redirect()->back()->with('message', 'Leave balance updated successfully.');
        } catch (Exception $e) {
            return redirect()->back()->withErrors([
                'error' => 'Failed to update leave balance. Please try again.'
            ]);
        }
    }

    public function Destroy($id)
    {
        try {
            LeaveBalance::findOrFail($id)->delete();
            return redirect()->back()->with('message', 'Leave balance record removed successfully.');
        } catch (Exception $e) {
            return redirect()->back()->withErrors([
                'error' => 'Failed to delete leave balance. Please try again.'
            ]);
        }
    }

    public function BulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:leave_balances,id',
        ]);

        try {
            LeaveBalance::whereIn('id', $validated['ids'])->delete();
            return redirect()->back()->with('message', 'Selected leave balance records removed successfully.');
        } catch (Exception $e) {
            return redirect()->back()->withErrors([
                'error' => 'Failed to delete selected leave balance records. Please try again.'
            ]);
        }
    }
}
