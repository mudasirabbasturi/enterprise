<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Http\Requests\StoreDepartmentRequest;
use App\Http\Requests\UpdateDepartmentRequest;
use App\Models\Department;
use App\Models\Branch;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DepartmentController extends Controller
{

    public function Index()
    {
        // if (!Gate::allows('viewAny', Department::class)) {
        //     abort(403, 'Unauthorized access to departments.');
        // }
        $departments = Department::with(['branch','designations'])->latest()->get();
        $branches = Branch::cursor();
        return Inertia('Pages/Department/Index',[
            'departments' => $departments, 
            'branches' => $branches,
            // 'permissions' => Auth::user()->getPermissionsFor('Department'),
        ]);
    }

    public function Store(StoreDepartmentRequest $request)
    {
        // if (!Gate::allows('create', Department::class)) {
        //     abort(403, 'Unauthorized to create departments.');
        // }
        $validated = $request->validated();
        Department::create($validated);
        return redirect()->back()->with('message', 'Department created successfully.');
    }

    public function Update(UpdateDepartmentRequest $request, $id)
    {
        $department = Department::findOrFail($id);    
        // if (!Gate::allows('update', $department)) {
        //     abort(403, 'Unauthorized to update this department.');
        // }
        $validated = $request->validated();
        $department->update($validated);
        return redirect()->back()->with('message', 'Department updated successfully.');
    }

    public function Destroy($id)
    {
        $department = Department::findOrFail($id);
    
        // if (!Gate::allows('delete', $department)) {
        //     abort(403, 'Unauthorized to delete this department.');
        // }

        $department->delete();
        return back()->with('message', 'Department deleted successfully!');
    }
}
