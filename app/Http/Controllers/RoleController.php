<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Models\Role;
use App\Models\Permission;
use App\Models\RolePermission;

class RoleController extends Controller
{

    public function Index()
    {
        $roles = Role::with('permissions:id,model,type,name,notes')->select('id', 'name', 'notes')->latest()->get();
        $permissions = Permission::select('id','model','type','name', 'notes')->get();
        return Inertia('Pages/Role/Index', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function Store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'notes' => 'nullable|string',
            'permissions' => 'nullable|array',
            'permissions.*' => 'integer|exists:permissions,id',
        ]);
        $role = Role::create([
            'name' => $validated['name'],
            'notes' => $validated['notes'] ?? null,
        ]);

        if (!empty($validated['permissions'])) {
            $role->permissions()->sync($validated['permissions']);
        }
        return redirect()->back()->with('message', 'Role created successfully.');
    }

    public function Update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,' . $id,
            'notes' => 'nullable|string',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ]);
        $role = Role::findOrFail($id);
        $role->update([
            'name' => $validated['name'],
            'notes' => $validated['notes'] ?? null,
        ]);
        $role->permissions()->sync($validated['permissions'] ?? []);
        return redirect()->back()->with('message', 'Role updated successfully.');
    }

    public function Destroy($id)
    {
        $role = Role::findOrFail($id);
        $role->delete();
        return back()->with('message', 'Role deleted successfully!');
    }
}