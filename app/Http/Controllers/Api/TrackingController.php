<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TrackingController extends Controller
{
    public function index()
    {
        $users = \App\Models\User::all();

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
        // Check recent upload (30 min window = 6 screenshot cycles of buffer)
        $recentCutoff = \Carbon\Carbon::now()->subMinutes(30);
        $hasRecent = \App\Models\UserScreenshot::where('user_id', $userId)
            ->where('screenshot_time', '>=', $recentCutoff)
            ->exists();

        // Fallback: any screenshot today means they were active today
        $todayCutoff = \Carbon\Carbon::now()->startOfDay();
        $hasToday = \App\Models\UserScreenshot::where('user_id', $userId)
            ->where('screenshot_time', '>=', $todayCutoff)
            ->exists();

        return response()->json(['active' => $hasRecent || $hasToday]);
    }

    public function getAllUsers()
    {
        $users = \App\Models\User::all();
        return response()->json($users);
    }
}
