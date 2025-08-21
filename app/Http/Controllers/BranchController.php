<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Http\Requests\StoreBranchRequest;
use App\Http\Requests\UpdateBranchRequest;
use App\Models\Branch;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BranchController extends Controller
{

    public function Index()
    {
        // if (!Gate::allows('viewAny', Branch::class)) {
        //     abort(403, 'Unauthorized access to branches.');
        // }
        $branches = Branch::with('departments.designations')
                    ->latest()->get();
        return Inertia('Pages/Branch/Index',[
            'branches' => $branches,
            // 'permissions' => Auth::user()->getPermissionsFor('Branch'),
        ]);
    }

    public function Store(StoreBranchRequest $request)
    {
        // if (!Gate::allows('create', Branch::class)) {
        //     abort(403, 'Unauthorized to create branches.');
        // }
        $validated = $request->validated();
        Branch::create($validated);
        return redirect()->back()->with('message', 'Branch created successfully.');
    }

    public function Update(UpdateBranchRequest $request, $id)
    {
        $branch = Branch::findOrFail($id);
        
        // if (!Gate::allows('update', $branch)) {
        //     abort(403, 'Unauthorized to update this branch.');
        // }

        $validated = $request->validated();
        $branch->update($validated);
        return redirect()->back()->with('message', 'Branch updated successfully.');
    }

    public function Destroy($id)
    {
        $branch = Branch::findOrFail($id);
        
        // if (!Gate::allows('delete', $branch)) {
        //     abort(403, 'Unauthorized to delete this branch.');
        // }

        $branch->delete();
        return back()->with('message', 'Branch deleted successfully!');
    }
            
}
