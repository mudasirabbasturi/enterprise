<?php

namespace App\Http\Controllers;

use App\Models\UserShiftSchedule;
use App\Models\User;
use App\Models\Shift;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserShiftScheduleController extends Controller
{
    public function Index()
    {
        $schedules = UserShiftSchedule::with(['user', 'shift'])->get();
        $users = User::select('id', 'name')->get();
        $shifts = Shift::select('id', 'name')->get();

        return Inertia::render('Pages/WorkSchedule/UserSchedules', [
            'schedules' => $schedules,
            'users' => $users,
            'shifts' => $shifts
        ]);
    }

    public function Store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'shift_id' => 'nullable|exists:shifts,id',
            'day' => 'required|in:Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
            'start_time' => 'required',
            'end_time' => 'required',
            'duration' => 'integer',
            'is_available' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        UserShiftSchedule::create($validated);

        return redirect()->back()->with('message', 'Schedule created successfully.');
    }

    public function Update(Request $request, $id)
    {
        $schedule = UserShiftSchedule::findOrFail($id);
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'shift_id' => 'nullable|exists:shifts,id',
            'day' => 'required|in:Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
            'start_time' => 'required',
            'end_time' => 'required',
            'duration' => 'integer',
            'is_available' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $schedule->update($validated);

        return redirect()->back()->with('message', 'Schedule updated successfully.');
    }

    public function Destroy($id)
    {
        $schedule = UserShiftSchedule::findOrFail($id);
        $schedule->delete();

        return redirect()->back()->with('message', 'Schedule deleted successfully.');
    }
}
