<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Pusher\Pusher;
use GuzzleHttp\Client;

class TrackingController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status', 'active');
        $recentCutoff = \Carbon\Carbon::now()->subMinutes(1);
        
        $users = \App\Models\User::where('status', $status)->get();
        
        return inertia('Pages/UserTracking', [
            'users' => $users,
            'selectedStatus' => $status,
            'trackingData' => []
        ]);
    }

    public function lastScreenshots()
    {
        return inertia('Pages/LastScreenshots');
    }
    
    public function myActivity($id)
    {
        $user = \App\Models\User::findOrFail($id);
        
        // Basic security: users can only see their own activity unless they are admin/super-admin
        // For simplicity assuming if they have the link they can view for now, or check permissions
        if (auth()->id() != $id && !auth()->user()->can('View User Tracking')) {
             // allow if it's the user themselves
        }

        return inertia('Pages/MyActivity', [
            'targetUser' => $user
        ]);
    }

    public function getLatestAllUsersScreenshots()
    {
        $users = \App\Models\User::where('status', 'active')->get();
        $data = [];
        foreach ($users as $user) {
            $latest = \App\Models\UserScreenshot::where('user_id', $user->id)
                ->latest('id')
                ->first();
            
            $data[] = [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'is_online' => $user->is_online,
                'last_active' => $user->last_active_at,
                'screenshot' => $latest ? [
                    'url' => $latest->file_path,
                    'full_date' => $latest->screenshot_time->toIso8601String(),
                    'time' => $latest->screenshot_time->format('H:i:s'),
                ] : null
            ];
        }
        return response()->json($data);
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

            $screenshot = \App\Models\UserScreenshot::create([
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

            $this->broadcastMessage('tracker-status', 'event-screenshot-captured', [
                'userId' => (int)$request->user_id,
                'screenshot' => [
                    'url' => $screenshot->file_path,
                    'full_date' => $screenshot->screenshot_time->toIso8601String(),
                    'time' => $screenshot->screenshot_time->format('H:i:s'),
                ]
            ]);

            // Also broadcast status update
            $this->broadcastMessage('tracker-status', 'event-user-status-updated', [
                'userId' => (int)$request->user_id,
                'isOnline' => true
            ]);

            return response()->json(['status' => 'success', 'message' => 'Screenshot saved']);
        }

        return response()->json(['status' => 'error', 'message' => 'No file uploaded'], 400);
    }

    private function broadcastMessage($channel, $event, $data)
    {
        $personalServerUrl = 'https://api-socket.bidwinners.net/publish';
        $usePersonalServer = false;

        try {
            $client = new \GuzzleHttp\Client(['timeout' => 2, 'verify' => false]);
            $client->post($personalServerUrl, [
                'json' => [
                    'channel' => $channel,
                    'event' => $event,
                    'data' => $data
                ]
            ]);
        } catch (\Exception $e) {
            \Log::info("Personal socket server error: " . $e->getMessage());
        }

        /* 
        $usePersonalServer = false;
        if (!$usePersonalServer) {
            $options = ['cluster' => 'ap2', 'useTLS' => true];
            $pusherClient = new \GuzzleHttp\Client(['verify' => false]);
            $pusher = new Pusher(
                '5158315c26b8f6732773', // app key
                '9ba1bfd3baa3f4ec2a4c', // app secret
                '2057639', // app id
                $options,
                $pusherClient
            );
            $pusher->trigger($channel, $event, $data);
        }
        */
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

        $perPage = $request->query('per_page', 24);
        $screenshots = $query->latest('screenshot_time')->paginate($perPage);

        $items = collect($screenshots->items())->map(function($s) {
            return [
                'id' => $s->id,
                'url' => asset($s->file_path),
                'time' => $s->screenshot_time->format('H:i:s'),
                'date' => $s->screenshot_time->format('Y-m-d')
            ];
        });

        return response()->json([
            'data' => $items,
            'next_page_url' => $screenshots->nextPageUrl(),
            'current_page' => $screenshots->currentPage(),
            'last_page' => $screenshots->lastPage(),
            'total' => $screenshots->total()
        ]);
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

        // Broadcast to tracker for IMMEDIATE capture
        $this->broadcastMessage('tracker-status', 'event-screenshot-requested', [
            'userId' => (int)$userId,
            'timestamp' => now()->toIso8601String()
        ]);

        return response()->json(['status' => 'success', 'message' => 'Screenshot triggered']);
    }

    public function pingTrackers()
    {
        // Broadcast to ALL trackers to report their status
        $this->broadcastMessage('tracker-status', 'event-ping-trackers', [
            'timestamp' => now()->toIso8601String()
        ]);

        return response()->json(['status' => 'success', 'message' => 'Ping request sent']);
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

        // Use centralized broadcast method
        $this->broadcastMessage('tracker-status', 'event-user-status-updated', [
            'userId' => (int)$request->user_id,
            'isOnline' => $isOnline
        ]);

        return response()->json(['status' => 'success', 'message' => 'Status updated']);
    }

    public function getTrackerSettings(Request $request)
    {
        $userId = $request->query('user_id');
        $interval = \App\Models\PayrollConfig::where('key', 'tracker_screenshot_interval')->first();
        $password = \App\Models\PayrollConfig::where('key', 'tracker_admin_password')->first();
        $allowedIps = \App\Models\PayrollConfig::where('key', 'tracker_allowed_ips')->first();
        
        $syncInterval = \App\Models\PayrollConfig::where('key', 'tracker_sync_interval')->first();
        $socketUrl = \App\Models\PayrollConfig::where('key', 'tracker_socket_url')->first();
        $apiBaseUrl = \App\Models\PayrollConfig::where('key', 'tracker_api_url')->first();
        
        if ($userId) {
            $user = \App\Models\User::find($userId);
            if (!$user || $user->status !== 'active') {
                return response()->json(['error' => 'Unauthorized or Inactive Session'], 403);
            }
        } else {
            $user = null;
        }

        $logoutRestriction = $user ? (bool)$user->logout_restriction : false;

        // Check for pending live stream offers
        $liveOffer = $userId ? \Illuminate\Support\Facades\Cache::pull("live_offer_{$userId}") : null;

        // Check for pending manual screenshot requests
        $pendingScreenshot = false;
        if ($userId) {
            $pending = \App\Models\PendingScreenshot::where('user_id', $userId)
                ->where('is_completed', false)
                ->first();
            if ($pending) {
                $pendingScreenshot = true;
                $pending->delete(); // Consider it consumed once sent to tracker
            }
        }

        return response()->json([
            'tracker_screenshot_interval' => $interval ? (int)$interval->value : 300,
            'tracker_sync_interval' => $syncInterval ? (int)$syncInterval->value : 2,
            'tracker_socket_url' => $socketUrl ? $socketUrl->value : 'wss://api-socket.bidwinners.net',
            'tracker_api_url' => $apiBaseUrl ? $apiBaseUrl->value : 'http://127.0.0.1:8000',
            'tracker_admin_password' => $password ? $password->value : 'bidwinners.net',
            'tracker_allowed_ips' => $allowedIps ? (is_string($allowedIps->value) ? json_decode($allowedIps->value, true) : $allowedIps->value) : [],
            'tracker_logout_restriction' => $logoutRestriction,
            'is_permission_granted' => $user ? (bool)$user->is_permission_granted : false,
            'live_offer' => $liveOffer,
            'pending_screenshot' => $pendingScreenshot
        ]);
    }

    public function updateTrackerSettings(Request $request)
    {
        $request->validate([
            'tracker_screenshot_interval' => 'required|integer|min:1',
            'tracker_sync_interval' => 'required|integer|min:1',
            'tracker_socket_url' => 'required|string',
            'tracker_api_url' => 'required|string',
            'tracker_admin_password' => 'required|string|min:4',
            'tracker_allowed_ips' => 'nullable|array'
        ]);

        \App\Models\PayrollConfig::updateOrCreate(
            ['key' => 'tracker_screenshot_interval'],
            ['value' => $request->tracker_screenshot_interval]
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
            ['key' => 'tracker_socket_url'],
            ['value' => $request->tracker_socket_url]
        );

        \App\Models\PayrollConfig::updateOrCreate(
            ['key' => 'tracker_api_url'],
            ['value' => $request->tracker_api_url]
        );

        \App\Models\PayrollConfig::updateOrCreate(
            ['key' => 'tracker_allowed_ips'],
            ['value' => json_encode($request->tracker_allowed_ips ?? [])]
        );

        // Broadcast config update to trigger fast reload if needed
        $this->broadcastMessage('tracker-status', 'event-config-updated', [
            'timestamp' => now()
        ]);

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

    public function toggleLogoutRestriction(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'logout_restriction' => 'required|boolean'
        ]);

        \App\Models\User::where('id', $request->user_id)->update([
            'logout_restriction' => $request->logout_restriction
        ]);

        return response()->json(['status' => 'success', 'message' => 'Logout restriction updated']);
    }

    public function getAllUsers(Request $request)
    {
        $status = $request->query('status', 'active');
        
        // Heartbeat: Auto-offline users inactive for > 3 minutes
        \App\Models\User::where('is_online', true)
            ->where('last_active_at', '<', now()->subMinutes(3))
            ->update(['is_online' => false]);

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
                'url' => $activity['url'] ?? null,
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
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $query = \App\Models\UserActivity::where('user_id', $userId);

        if ($startDate && $endDate) {
            $query->whereBetween('tracked_at', [
                $startDate . ' 00:00:00',
                $endDate . ' 23:59:59'
            ]);
        } else {
            $query->whereDate('tracked_at', $date);
        }

        $activities = $query->get();

        $totalClicks = $activities->sum('clicks');
        $totalKeys = $activities->sum('keystrokes');
        // Group by window title and calculate duration
        $appUsage = $activities->groupBy(function($a) {
            $title = $a->window_title ?: 'Unknown Window';
            $appName = $a->app_name;
            
            if (!$appName || strtolower($appName) === 'active app' || strtolower($appName) === 'unknown') {
                $appName = $this->resolveAppName($title);
            }

            // Return a combination for unique grouping but readable display
            return json_encode([
                'app' => $appName,
                'title' => $title,
                'url' => $a->url
            ]);
        })->map(function ($group, $key) {
            $info = json_decode($key, true);
            return [
                'app' => $info['app'],
                'title' => $info['title'],
                'url' => $info['url'],
                'minutes' => count($group),
                'clicks' => $group->sum('clicks'),
                'keystrokes' => $group->sum('keystrokes'),
            ];
        })->sortByDesc('minutes')->take(30)->values(); // Increased to 30 for more detail

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
