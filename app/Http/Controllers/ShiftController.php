<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ShiftController extends Controller
{
    public function Index()
    {
        $shifts = Shift::orderBy('name')->get();
        return Inertia::render('Pages/WorkSchedule/Shifts', [
            'shifts' => $shifts
        ]);
    }

    public function Store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_time' => 'required',
            'end_time' => 'required',
            'duration' => 'nullable|integer',
            'total_break_minutes' => 'nullable|integer',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        Shift::create($validated);

        return redirect()->back()->with('message', 'Shift created successfully.');
    }

    public function Update(Request $request, $id)
    {
        $shift = Shift::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_time' => 'required',
            'end_time' => 'required',
            'duration' => 'nullable|integer',
            'total_break_minutes' => 'nullable|integer',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $shift->update($validated);

        return redirect()->back()->with('message', 'Shift updated successfully.');
    }

    public function Destroy($id)
    {
        $shift = Shift::findOrFail($id);
        $shift->delete();

        return redirect()->back()->with('message', 'Shift deleted successfully.');
    }
}
