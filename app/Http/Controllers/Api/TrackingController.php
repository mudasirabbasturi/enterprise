<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TrackingController extends Controller
{
    public function index()
    {
        $recentCutoff = \Carbon\Carbon::now()->subMinutes(15);
        $users = \App\Models\User::all()->map(function($user) use ($recentCutoff) {
            $user->is_online = \App\Models\UserScreenshot::where('user_id', $user->id)
                ->where('screenshot_time', '>=', $recentCutoff)
                ->exists();
            return $user;
        });

        return inertia('Pages/UserTracking', [
            'users' => $users,
            'trackingData' => []
        ]);
    }

    public function storeScreenshot(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'screenshot' => 'required|image',
            'timestamp' => 'required'
        ]);

        if ($request->hasFile('screenshot')) {
            $file = $request->file('screenshot');
            $filename = time() . '_' . $file->getClientOriginalName();
            
            // Move to public/uploads/screenshots
            $destPath = public_path('uploads/screenshots/' . $request->user_id);
            if (!file_exists($destPath)) {
                mkdir($destPath, 0755, true);
            }
            $file->move($destPath, $filename);
            $path = 'uploads/screenshots/' . $request->user_id . '/' . $filename;

            \App\Models\UserScreenshot::create([
                'user_id' => $request->user_id,
                'file_path' => $path,
                'screenshot_time' => \Carbon\Carbon::parse($request->timestamp),
            ]);

            // Mark any pending screenshot requests as completed
            \App\Models\PendingScreenshot::where('user_id', $request->user_id)
                ->where('is_completed', false)
                ->update(['is_completed' => true]);

            // Update user online status
            \App\Models\User::where('id', $request->user_id)->update([
                'is_online' => true,
                'last_active_at' => now(),
            ]);

            return response()->json(['status' => 'success', 'message' => 'Screenshot saved']);
        }

        return response()->json(['status' => 'error', 'message' => 'No file uploaded'], 400);
    }

    public function getScreenshots(Request $request)
    {
        $userId = $request->query('user_id');
        $day = $request->query('day');
        $month = $request->query('month');
        $year = $request->query('year');

        $query = \App\Models\UserScreenshot::where('user_id', $userId);

        if ($day) {
            $query->whereDay('screenshot_time', $day);
        }
        if ($month) {
            $query->whereMonth('screenshot_time', $month);
        }
        if ($year) {
            $query->whereYear('screenshot_time', $year);
        }

        $screenshots = $query->latest('screenshot_time')->get()->map(function($s) {
            return [
                'id' => $s->id,
                'url' => asset($s->file_path),
                'time' => $s->screenshot_time->format('H:i:s'),
                'date' => $s->screenshot_time->format('Y-m-d')
            ];
        });

        return response()->json($screenshots);
    }

    public function checkIn(Request $request)
    {
        $userId = $request->input('user_id');
        $now = \Carbon\Carbon::now();
        $date = $now->toDateString();

        $attendance = \App\Models\UserAttendance::where('user_id', $userId)
            ->where('date', $date)
            ->first();

        if (!$attendance) {
            \App\Models\UserAttendance::create([
                'user_id' => $userId,
                'date' => $date,
                'check_in' => $now->toTimeString(),
                'check_in_ip' => $request->ip(),
                'status' => 'present'
            ]);
        }

        return response()->json(['status' => 'success', 'message' => 'Checked in successfully']);
    }

    public function checkOut(Request $request)
    {
        $userId = $request->input('user_id');
        $now = \Carbon\Carbon::now();
        $date = $now->toDateString();

        $attendance = \App\Models\UserAttendance::where('user_id', $userId)
            ->where('date', $date)
            ->first();

        if ($attendance) {
            $attendance->update([
                'check_out' => $now->toTimeString(),
                'check_out_ip' => $request->ip()
            ]);
        }

        return response()->json(['status' => 'success', 'message' => 'Checked out successfully']);
    }

    public function destroyScreenshots(Request $request)
    {
        $ids = $request->input('ids', []);
        
        if (empty($ids)) {
            return response()->json(['status' => 'error', 'message' => 'No screenshots selected'], 400);
        }

        $screenshots = \App\Models\UserScreenshot::whereIn('id', $ids)->get();

        foreach ($screenshots as $screenshot) {
            $fullPath = public_path($screenshot->file_path);
            if (file_exists($fullPath)) {
                unlink($fullPath);
            }
            $screenshot->delete();
        }

        return response()->json(['status' => 'success', 'message' => 'Screenshots deleted successfully']);
    }

    public function triggerScreenshot(Request $request)
    {
        $userId = $request->input('user_id');
        
        \App\Models\PendingScreenshot::create([
            'user_id' => $userId,
            'is_completed' => false
        ]);

        return response()->json(['status' => 'success', 'message' => 'Screenshot triggered']);
    }

    public function checkPendingScreenshot($userId)
    {
        $pending = \App\Models\PendingScreenshot::where('user_id', $userId)
            ->where('is_completed', false)
            ->first();

        return response()->json(['pending' => !!$pending]);
    }

    public function getAttendanceStatus($userId)
    {
        $date = \Carbon\Carbon::now()->toDateString();
        $attendance = \App\Models\UserAttendance::where('user_id', $userId)
            ->where('date', $date)
            ->first();

        return response()->json([
            'checked_in' => !!$attendance,
            'checked_out' => $attendance ? !!$attendance->check_out : false
        ]);
    }

    public function getActiveStatus($userId)
    {
        $user = \App\Models\User::find($userId);
        return response()->json(['active' => $user ? $user->is_online : false]);
    }

    public function updateStatus(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'status' => 'required|in:online,offline'
        ]);

        $isOnline = $request->status === 'online';

        \App\Models\User::where('id', $request->user_id)->update([
            'is_online' => $isOnline,
            'last_active_at' => $isOnline ? now() : null
        ]);

        return response()->json(['status' => 'success', 'message' => 'Status updated']);
    }

    public function getTrackerSettings()
    {
        $interval = \App\Models\PayrollConfig::where('key', 'tracker_screenshot_interval')->first();
        $password = \App\Models\PayrollConfig::where('key', 'tracker_admin_password')->first();
        $apiUrl = \App\Models\PayrollConfig::where('key', 'tracker_api_url')->first();
        
        return response()->json([
            'screenshot_interval' => $interval ? (int)$interval->value : 300,
            'tracker_admin_password' => $password ? $password->value : 'bidenterprise#12',
            'tracker_api_url' => $apiUrl ? $apiUrl->value : 'http://localhost:8000'
        ]);
    }

    public function updateTrackerSettings(Request $request)
    {
        $request->validate([
            'screenshot_interval' => 'required|integer|min:60',
            'tracker_admin_password' => 'required|string|min:4',
            'tracker_api_url' => 'required|url'
        ]);

        \App\Models\PayrollConfig::updateOrCreate(
            ['key' => 'tracker_screenshot_interval'],
            ['value' => $request->screenshot_interval]
        );

        \App\Models\PayrollConfig::updateOrCreate(
            ['key' => 'tracker_admin_password'],
            ['value' => $request->tracker_admin_password]
        );

        \App\Models\PayrollConfig::updateOrCreate(
            ['key' => 'tracker_api_url'],
            ['value' => rtrim($request->tracker_api_url, '/')]
        );

        return response()->json(['status' => 'success', 'message' => 'Settings updated successfully']);
    }

    public function getAllUsers()
    {
        $users = \App\Models\User::all();
        return response()->json($users);
    }
}
