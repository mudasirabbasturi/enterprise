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
use Kreait\Firebase\Factory;

class BranchController extends Controller
{

    private function pushFirebaseEvent($type, $branchId)
    {
        $factory = (new Factory)
            ->withServiceAccount(base_path('firebase.json'))
            ->withDatabaseUri('https://enterprise-event-trigger-default-rtdb.firebaseio.com'); // ✅ copy from Firebase console

        $database = $factory->createDatabase();

        $database->getReference('events/branches/'.$branchId)->set([
            'type' => $type,
            'branch_id' => $branchId,
            'timestamp' => now()->toISOString(),
        ]);
    }


    public function Index()
    {
        $branches = Branch::with('departments.designations')
                    ->latest()->get();
        return Inertia('Pages/Branch/Index',[
            'branches' => $branches,
        ]);
    }

    public function Store(StoreBranchRequest $request)
    {
        $validated = $request->validated();
        $branch = Branch::create($validated); // 👈 yahan variable me store karo

        $this->pushFirebaseEvent('created', $branch->id);

        return redirect()->back()->with('message', 'Branch created successfully.');
    }

    public function Update(UpdateBranchRequest $request, $id)
    {
        $branch = Branch::findOrFail($id);
        $validated = $request->validated();
        $branch->update($validated);
        $this->pushFirebaseEvent('updated', $branch->id);
        return redirect()->back()->with('message', 'Branch updated successfully.');
    }

    public function Destroy($id)
    {
        $branch = Branch::findOrFail($id);
        $branch->delete();
        $this->pushFirebaseEvent('deleted', $id);
        return back()->with('message', 'Branch deleted successfully!');
    }
            
}
