<?php

namespace App\Http\Controllers;

use App\Models\PayrollPenalty;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class PenaltyController extends Controller
{
    public function index()
    {
        $penalties = PayrollPenalty::with('user', 'recorder')->latest()->get();
        $users = User::select('id', 'name')->get();
        
        return Inertia::render('Pages/Payroll/PenaltyManagement', [
            'penalties' => $penalties,
            'users' => $users
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'type' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'date' => 'required|date',
            'reason' => 'required|string'
        ]);

        $validated['recorded_by_id'] = Auth::id();

        PayrollPenalty::create($validated);
        return redirect()->back()->with('message', 'Penalty recorded successfully.');
    }

    public function update(Request $request, $id)
    {
        $penalty = PayrollPenalty::findOrFail($id);
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'type' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'date' => 'required|date',
            'reason' => 'required|string'
        ]);

        $penalty->update($validated);
        return redirect()->back()->with('message', 'Penalty updated successfully.');
    }

    public function destroy($id)
    {
        $penalty = PayrollPenalty::findOrFail($id);
        $penalty->delete();
        return redirect()->back()->with('message', 'Penalty removed successfully.');
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:payroll_penalties,id',
        ]);

        PayrollPenalty::whereIn('id', $validated['ids'])->delete();
        return redirect()->back()->with('message', 'Selected penalties removed successfully.');
    }
}
