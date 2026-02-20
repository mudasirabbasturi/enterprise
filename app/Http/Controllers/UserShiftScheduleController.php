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
        $shifts = Shift::where('is_active', true)->orderBy('name')->get();

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
            'shift_id' => 'required|exists:shifts,id',
            'day' => 'required|in:Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
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
            'shift_id' => 'required|exists:shifts,id',
            'day' => 'required|in:Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
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
            'shift_id' => 'required|exists:shifts,id',
            'days' => 'required|array',
            'days.*' => 'in:Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
            'notes' => 'nullable|string',
        ]);

        $userIds = $validated['user_ids'];
        $days = $validated['days'];
        unset($validated['user_ids'], $validated['days']);

        foreach ($userIds as $userId) {
            foreach ($days as $day) {
                $data = $validated;
                $data['user_id'] = $userId;
                $data['day'] = $day;
                UserShiftSchedule::create($data);
            }
        }

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Bulk schedules created successfully.']);
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
