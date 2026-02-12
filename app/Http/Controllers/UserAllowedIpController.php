<?php

namespace App\Http\Controllers;

use App\Models\UserAllowedIp;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserAllowedIpController extends Controller
{
    public function Index()
    {
        $allowedIps = UserAllowedIp::with('user')->get();
        $users = User::select('id', 'name')->get();

        return Inertia::render('Pages/WorkSchedule/AllowedIps', [
            'allowedIps' => $allowedIps,
            'users' => $users
        ]);
    }

    public function Store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'ip_address' => 'required|ip',
            'notes' => 'nullable|string',
        ]);

        UserAllowedIp::create($validated);

        return redirect()->back()->with('message', 'Allowed IP created successfully.');
    }

    public function Update(Request $request, $id)
    {
        $allowedIp = UserAllowedIp::findOrFail($id);
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'ip_address' => 'required|ip',
            'notes' => 'nullable|string',
        ]);

        $allowedIp->update($validated);

        return redirect()->back()->with('message', 'Allowed IP updated successfully.');
    }

    public function Destroy($id)
    {
        $allowedIp = UserAllowedIp::findOrFail($id);
        $allowedIp->delete();

        return redirect()->back()->with('message', 'Allowed IP deleted successfully.');
    }
}
