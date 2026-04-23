<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TrackingController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status', 'active');
        $recentCutoff = \Carbon\Carbon::now()->subMinutes(15);
        
        $users = \App\Models\User::where('status', $status)->get()->map(function($user) use ($recentCutoff) {
            $user->is_online = \App\Models\UserScreenshot::where('user_id', $user->id)
                ->where('screenshot_time', '>=', $recentCutoff)
                ->exists();
            return $user;
        });
        
        return inertia('Pages/UserTracking', [
            'users' => $users,
            'selectedStatus' => $status,
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

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('screenshot_time', [
                $request->start_date . ' 00:00:00',
                $request->end_date . ' 23:59:59'
            ]);
        } else {
            if ($day) {
                $query->whereDay('screenshot_time', $day);
            }
            if ($month) {
                $query->whereMonth('screenshot_time', $month);
            }
            if ($year) {
                $query->whereYear('screenshot_time', $year);
            }
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
        $syncInterval = \App\Models\PayrollConfig::where('key', 'tracker_sync_interval')->first();
        $password = \App\Models\PayrollConfig::where('key', 'tracker_admin_password')->first();
        $allowedIps = \App\Models\PayrollConfig::where('key', 'tracker_allowed_ips')->first();
        
        return response()->json([
            'screenshot_interval' => $interval ? (int)$interval->value : 300,
            'tracker_sync_interval' => $syncInterval ? (int)$syncInterval->value : 30,
            'tracker_admin_password' => $password ? $password->value : 'bidwinners#12',
            'tracker_allowed_ips' => $allowedIps ? $allowedIps->value : []
        ]);
    }

    public function updateTrackerSettings(Request $request)
    {
        $request->validate([
            'screenshot_interval' => 'required|integer|min:60',
            'tracker_sync_interval' => 'required|integer|min:10',
            'tracker_admin_password' => 'required|string|min:4',
            'tracker_allowed_ips' => 'nullable|array'
        ]);

        \App\Models\PayrollConfig::updateOrCreate(
            ['key' => 'tracker_screenshot_interval'],
            ['value' => $request->screenshot_interval]
        );

        \App\Models\PayrollConfig::updateOrCreate(
            ['key' => 'tracker_sync_interval'],
            ['value' => $request->tracker_sync_interval]
        );

        \App\Models\PayrollConfig::updateOrCreate(
            ['key' => 'tracker_admin_password'],
            ['value' => $request->tracker_admin_password]
        );

        \App\Models\PayrollConfig::updateOrCreate(
            ['key' => 'tracker_allowed_ips'],
            ['value' => $request->tracker_allowed_ips ?? []]
        );

        return response()->json(['status' => 'success', 'message' => 'Settings updated successfully']);
    }

    public function toggleUserPermission(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'is_permission_granted' => 'required|boolean'
        ]);

        \App\Models\User::where('id', $request->user_id)->update([
            'is_permission_granted' => $request->is_permission_granted
        ]);

        return response()->json(['status' => 'success', 'message' => 'User permission updated']);
    }

    public function getAllUsers(Request $request)
    {
        $status = $request->query('status', 'active');
        $users = \App\Models\User::where('status', $status)->get();
        $allowedIps = \App\Models\PayrollConfig::where('key', 'tracker_allowed_ips')->first();
        $allowedIps = $allowedIps ? $allowedIps->value : [];
        $clientIp = request()->ip();

        return response()->json($users->map(function($user) use ($allowedIps, $clientIp) {
            // Note: In real scenarios, we'd need to know the *user's* IP if they are reporting it.
            // For now, let's assume if their record is viewed, we show their status.
            return $user;
        }));
    }
    public function storeActivity(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'activities' => 'required|array',
        ]);

        foreach ($request->activities as $activity) {
            \App\Models\UserActivity::create([
                'user_id' => $request->user_id,
                'app_name' => $activity['app_name'] ?? 'Unknown',
                'window_title' => $activity['window_title'] ?? 'Unknown',
                'clicks' => $activity['clicks'] ?? 0,
                'keystrokes' => $activity['keystrokes'] ?? 0,
                'is_idle' => $activity['is_idle'] ?? false,
                'tracked_at' => \Carbon\Carbon::parse($activity['timestamp']),
            ]);
        }

        return response()->json(['status' => 'success', 'message' => 'Activities saved']);
    }

    public function getActivityStats(Request $request)
    {
        $userId = $request->query('user_id');
        $date = $request->query('date', now()->toDateString());

        $activities = \App\Models\UserActivity::where('user_id', $userId)
            ->whereDate('tracked_at', $date)
            ->get();

        $totalClicks = $activities->sum('clicks');
        $totalKeys = $activities->sum('keystrokes');
        // Group by resolved app name and calculate duration
        $appUsage = $activities->groupBy(function($a) {
            $name = $a->app_name;
            if (!$name || strtolower($name) === 'active app' || strtolower($name) === 'unknown') {
                $name = $this->resolveAppName($a->window_title);
            }
            return $name;
        })->map(function ($group) {
            return [
                'minutes' => count($group),
                'clicks' => $group->sum('clicks'),
                'keystrokes' => $group->sum('keystrokes'),
            ];
        })->sortByDesc('minutes')->take(10);

        // Timeline (Hourly activity level)
        $timeline = $activities->groupBy(function($a) {
            return $a->tracked_at ? $a->tracked_at->format('H') : '00';
        })->map(function($group) {
            return [
                'clicks' => $group->sum('clicks'),
                'keys' => $group->sum('keystrokes')
            ];
        });

        return response()->json([
            'total_clicks' => $totalClicks,
            'total_keystrokes' => $totalKeys,
            'app_usage' => $appUsage,
            'timeline' => $timeline,
            'total_minutes' => $activities->count()
        ]);
    }

    /**
     * Helper to extract a meaningful app name from a window title.
     * Often window titles are formatted like "Project Name - SoftwareName"
     * or "Untitled - ProjectName - FileName.ext"
     */
    private function resolveAppName($title)
    {
        if (empty($title)) return 'Unknown';

        // Common extensions to skip (filenames)
        $fileExtensions = ['.php', '.js', '.jsx', '.json', '.py', '.html', '.css', '.log', '.txt', '.md', '.sql', '.env'];
        
        // Common separators used in window titles
        $separators = [' - ', ' | ', ' : '];
        
        foreach ($separators as $sep) {
            if (str_contains($title, $sep)) {
                $parts = array_map('trim', explode($sep, $title));
                $count = count($parts);
                
                // Start from the last part and check if it's a filename
                for ($i = $count - 1; $i >= 0; $i--) {
                    $segment = $parts[$i];
                    
                    // Skip if segment is empty or too short (e.g. single letter)
                    if (strlen($segment) <= 2) continue;
                    
                    // Check if segment is a filename by looking at extensions
                    $isFileName = false;
                    foreach ($fileExtensions as $ext) {
                        if (str_ends_with(strtolower($segment), $ext)) {
                            $isFileName = true;
                            break;
                        }
                    }
                    
                    // If it's not a filename, this is our best bet for an app name
                    if (!$isFileName) {
                        return $segment;
                    }
                }
            }
        }

        // Fallback checks
        if (stripos($title, 'Google Chrome') !== false) return 'Google Chrome';
        if (stripos($title, 'Visual Studio Code') !== false) return 'VS Code';
        if (stripos($title, 'Antigravity') !== false) return 'Antigravity';

        return $title;
    }
}
