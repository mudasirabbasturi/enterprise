<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TrackingController extends Controller
{
    public function index()
    {
        $activities = \App\Models\UserActivity::with('user')
            ->where('type', 'app_activity')
            ->latest('event_time')
            ->limit(50)
            ->get()
            ->map(function($activity) {
                return [
                    'id' => $activity->id,
                    'user_name' => $activity->user->name ?? 'Unknown',
                    'application' => $activity->details['process'] ?? 'System',
                    'activity' => $activity->details['title'] ?? $activity->type,
                    'start_time' => \Carbon\Carbon::parse($activity->event_time)->subSeconds($activity->details['duration_seconds'] ?? 0)->toDateTimeString(),
                    'end_time' => $activity->event_time->toDateTimeString(),
                    'duration' => $this->formatDuration($activity->details['duration_seconds'] ?? 0),
                ];
            });

        return inertia('Pages/UserTracking', [
            'trackingData' => $activities
        ]);
    }

    protected function formatDuration($seconds)
    {
        if ($seconds < 60) return round($seconds) . 's';
        if ($seconds < 3600) return round($seconds / 60) . 'm';
        return round($seconds / 3600, 1) . 'h';
    }

    public function data()
    {
        $activities = \App\Models\UserActivity::with('user')
            ->where('type', 'app_activity')
            ->latest('event_time')
            ->limit(50)
            ->get()
            ->map(function($activity) {
                return [
                    'id' => $activity->id,
                    'user_name' => $activity->user->name ?? 'Unknown',
                    'application' => $activity->details['process'] ?? 'System',
                    'activity' => $activity->details['title'] ?? $activity->type,
                    'start_time' => \Carbon\Carbon::parse($activity->event_time)->subSeconds($activity->details['duration_seconds'] ?? 0)->toDateTimeString(),
                    'end_time' => $activity->event_time->toDateTimeString(),
                    'duration' => $this->formatDuration($activity->details['duration_seconds'] ?? 0),
                ];
            });

        return response()->json($activities);
    }

    public function store(Request $request)
    {
        $userId = $request->input('user_id');
        $events = $request->input('events', []);
        
        Log::info('Received tracking data', ['user_id' => $userId, 'count' => count($events)]);

        foreach ($events as $event) {
            \App\Models\UserActivity::create([
                'user_id' => $userId,
                'type' => $event['type'],
                'details' => $event['details'],
                'event_time' => \Carbon\Carbon::parse($event['timestamp']),
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Data received and saved'
        ]);
    }

    public function destroy($id)
    {
        try {
            $activity = \App\Models\UserActivity::findOrFail($id);
            $activity->delete();
            return response()->json(['status' => 'success', 'message' => 'Record deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Failed to delete record'], 500);
        }
    }
}
