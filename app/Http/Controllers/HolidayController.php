<?php

namespace App\Http\Controllers;

use App\Models\Holiday;
use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Exception;

class HolidayController extends Controller
{
    public function Index()
    {
        return Inertia::render('Pages/LeaveManagement/Holidays', [
            'holidays' => Holiday::all(),
        ]);
    }

    public function Store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'date' => 'required|date',
        ]);

        try {
            Holiday::create($validated);
            return redirect()->back()->with('message', 'Holiday created successfully.');
        } catch (Exception $e) {
            return redirect()->back()->withErrors([
                'error' => 'Failed to create holiday. Please try again.'
            ]);
        }
    }

    public function Update(Request $request, $id)
    {
        try {
            $holiday = Holiday::findOrFail($id);

            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'date' => 'required|date',
            ]);

            $holiday->update($validated);

            return redirect()->back()->with('message', 'Holiday updated successfully.');
        } catch (Exception $e) {
            return redirect()->back()->withErrors([
                'error' => 'Failed to update holiday. Please try again.'
            ]);
        }
    }

    public function Destroy($id)
    {
        try {
            Holiday::findOrFail($id)->delete();
            return redirect()->back()->with('message', 'Holiday deleted successfully.');
        } catch (Exception $e) {
            return redirect()->back()->withErrors([
                'error' => 'Failed to delete holiday. Please try again.'
            ]);
        }
    }

    public function BulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:holidays,id',
        ]);

        try {
            Holiday::whereIn('id', $validated['ids'])->delete();
            return redirect()->back()->with('message', 'Selected holidays deleted successfully.');
        } catch (Exception $e) {
            return redirect()->back()->withErrors([
                'error' => 'Failed to delete selected holidays. Please try again.'
            ]);
        }
    }
}
