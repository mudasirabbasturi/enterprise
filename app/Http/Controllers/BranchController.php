<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Requests\StoreBranchRequest;
use App\Http\Requests\UpdateBranchRequest;
use App\Models\Branch;
use Inertia\Inertia;

use Pusher\Pusher;


class BranchController extends Controller
{
    public function Index()
    {
        $branches = Branch::with('departments.designations')->latest()->get();
        return Inertia('Pages/Branch/Index', [
            'branches' => $branches,
        ]);
    }

    public function Store(StoreBranchRequest $request)
    {
        $branch = Branch::with('departments.designations')
            ->find(Branch::create($request->validated())->id);
        return response()->json([
            'message' => 'Branch created successfully.',
            'branch'  => $branch,
        ]);
    }

    public function Update(UpdateBranchRequest $request, $id)
    {
        $branch = Branch::findOrFail($id);
        $branch->update($request->validated());
        return redirect()->back()->with('message', 'Branch updated successfully.');
    }

public function destroy($id)
{
    $branch = Branch::findOrFail($id);
    $branch->delete();
    
    return response()->json([
        'message' => 'Branch deleted successfully.',
        'branch'  => $branch, // Return the full branch object instead of just ID
    ]);
}

}
