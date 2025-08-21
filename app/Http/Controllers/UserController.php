<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use App\Models\Role;
use App\Models\branch;
use App\Models\Department;
use App\Models\Designation;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UserController extends Controller
{

    public function Index()
    {
        $users = User::with([
            'branch',
            'department',
            'designation',
            'role.permissions'
        ])->orderBy('created_at', 'desc')->get();
        $roles = Role::select('id','name')->get();
        $branches = Branch::select('id', 'name')->get();
        $departments = Department::select('id', 'name', 'branch_id')->cursor();
        $designations = Designation::select('id', 'name', 'department_id')->cursor();
        
        return Inertia('Pages/User/Index',[
            'users' => $users,
            'roles' => $roles,
            'branches' => $branches,
            'departments' => $departments,
            'designations' => $designations,
            // 'userPermissions' => Auth::user()->getPermissionsFor('User'),
        ]);
    }

    public function Store(StoreUserRequest $request)
    {
        $validated = $request->validated();
        $validated['password'] = Hash::make($validated['password']);
        User::create($validated);
        return redirect()->back()->with('message', 'User created successfully.');
    }

    public function Update(UpdateUserRequest $request, $id)
    {
        $user = User::findOrFail($id);
        $validated = $request->validated();
        if (isset($validated['password']) && $validated['password']) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }
        $user->update($validated);
        return redirect()->back()->with('message', 'User updated successfully.');
    }

    public function Destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return back()->with('message', 'User deleted successfully!');
    }

    protected $allowedFields = [
        'name',
        'email',
        'password',
        'phone',
        'designation',
        'email_verified_at',
        'country',
        'state',
        'city',
        'postal_or_zip_code',
        'permanent_address',
        'current_address',
        'picture_path',
        'dob',
        'joining_date',
        'hiring_date',
        'leaving_date',
        'notes',
        'notes_private',
        'status',
        'branch_id',
        'department_id',
        'designation_id',
        'role_id',
    ];

    protected $validationRules = [
        'name' => 'required|string|max:255',
        'password' => 'nullable|string|min:8',
        'phone' => 'nullable|string',
        'designation' => 'nullable|string',
        'country' => 'nullable|string',
        'state' => 'nullable|string',
        'city' => 'nullable|string',
        'postal_or_zip_code' => 'nullable|string',
        'permanent_address' => 'nullable|string',
        'current_address' => 'nullable|string',
        'picture_path' => 'nullable|file|image',
        'dob' => 'nullable|date',
        'joining_date' => 'nullable|date',
        'hiring_date' => 'nullable|date',
        'leaving_date' => 'nullable|date',
        'notes' => 'nullable|string',
        'notes_private' => 'nullable|string',
        'status' => 'required|string|in:active,inactive,suspended',
        'branch_id' => 'nullable|exists:branches,id',
        'department_id' => 'nullable|exists:departments,id',
        'designation_id' => 'nullable|exists:designations,id',
        'role_id' => 'nullable|exists:roles,id',
    ];

    public function UserColumnUpdate(Request $request, $id) 
    {
        $user = User::findOrFail($id);
        $validatedField = $request->validate([
            'field' => ['required', 'string', Rule::in($this->allowedFields)]
        ])['field'];
        $validationRules = $this->validationRules;
        if ($validatedField === 'email') {
            $validationRules['email'] = ['required', 'email', Rule::unique('users')->ignore($user->id)];
        }
        if ($validatedField === 'password') {
            $validationRules['password'] = ['required', 'string', 'min:8'];
        }
        $validatedValue = $request->validate([
            $validatedField => $validationRules[$validatedField] ?? 'nullable'
        ])[$validatedField];
        if ($validatedField === 'password') {
            $validatedValue = Hash::make($validatedValue);
        }
        $user->update([$validatedField => $validatedValue]);
        return back()->with(
            'message', 
            ucfirst(str_replace('_', ' ', $validatedField)) . ' updated successfully.'
        );
    }

    public function Profile(Request $request, $id ){
        $user = User::with('media')->findOrFail($id);
        $roles = Role::select('id','name')->get();
        $branches = Branch::select('id', 'name')->get();
        $departments = Department::select('id', 'name', 'branch_id')->cursor();
        $designations = Designation::select('id', 'name', 'department_id')->cursor();
        return Inertia('Pages/User/Profile',[
            'user' => $user,
            'roles' => $roles,
            'branches' => $branches,
            'departments' => $departments,
            'designations' => $designations,
        ]);
    }
}
