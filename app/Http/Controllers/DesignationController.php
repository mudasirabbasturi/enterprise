<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Models\Branch;
use App\Models\Department;
use App\Models\Designation;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DesignationController extends Controller
{


    public function Index()
    {
        // if (!Gate::allows('viewAny', Designation::class)) {
        //     abort(403, 'Unauthorized access to designations.');
        // }
        $designations = Designation::with('department.branch')->latest()->get();
        $departments = Department::cursor();
        return Inertia('Pages/Designation/Index', [
            'designations' => $designations,
            'departments' => $departments,
            // 'permissions' => Auth::user()->getPermissionsFor('Designation'),
        ]);
    }

    public function Store(Request $request)
    {
        // if (!Gate::allows('create', Designation::class)) {
        //     abort(403, 'Unauthorized to create designations.');
        // }
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'notes' => 'nullable|string',
        ]);
        Designation::create($validated);
        return redirect()->back()->with('message', 'Designation created successfully.');
    }

    public function Update(Request $request, $id)
    {
        $designation = Designation::findOrFail($id);
        // if (!Gate::allows('update', $designation)) {
        //     abort(403, 'Unauthorized to update this designation.');
        // }
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'notes' => 'nullable|string',
        ]);

        $designation->update($validated);
        return redirect()->back()->with('message', 'Designation updated successfully.');
    }

    public function Destroy($id)
    {
        $designation = Designation::findOrFail($id);
        // if (!Gate::allows('delete', $designation)) {
        //     abort(403, 'Unauthorized to delete this designation.');
        // }
        $designation->delete();
        return back()->with('message', 'Designation deleted successfully!');
    }
}
