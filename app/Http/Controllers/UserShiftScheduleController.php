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
        $users = User::select('id', 'name', 'status')->get();
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

    public function BulkStore(Request $request)
    {
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
            'shift_id' => 'nullable|exists:shifts,id',
            'day' => 'required|in:Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
            'start_time' => 'required',
            'end_time' => 'required',
            'duration' => 'integer',
            'is_available' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $userIds = $validated['user_ids'];
        unset($validated['user_ids']);

        foreach ($userIds as $userId) {
            $data = $validated;
            $data['user_id'] = $userId;
            UserShiftSchedule::create($data);
        }

        return redirect()->back()->with('message', 'Bulk schedules created successfully.');
    }

    public function BulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:user_shift_shedules,id',
        ]);

        UserShiftSchedule::whereIn('id', $request->ids)->delete();

        return redirect()->back()->with('message', 'Selected schedules deleted successfully.');
    }
}
