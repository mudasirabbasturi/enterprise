<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Models\Permission;

class PermissionController extends Controller
{

    public function Index()
    {
        $permissions = Permission::with('roles:id,name,notes')
                                   ->select('id','model','type','name','notes')
                                   ->latest()->get();
        return Inertia('Pages/Permission/Index',[
            'permissions' => $permissions, 
        ]);
    }

    public function Store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:permissions,name,' . $id,
            'notes' => 'nullable|string',
        ]);
        Permission::create($validated);
        return redirect()->back()->with('message', 'Permission created successfully.');
    }

    public function Update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('permissions')->ignore($id)],
            'notes' => ['nullable', 'string'],
        ]);
        $permission = Permission::findOrFail($id);
        $permission->update($validated);
        return redirect()->back()->with('message', 'Permission updated successfully.');
    }

    public function Destroy($id)
    {
        $permission = Permission::findOrFail($id);
        $permission->delete();
        return back()->with('message', 'Permission deleted successfully!');
    }
}