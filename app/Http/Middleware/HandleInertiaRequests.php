<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\Role;
use App\Models\Permission;
use App\Models\Project;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */

    // public function share(Request $request): array
    // {
    //     return array_merge(parent::share($request), [
    //         'auth' => [
    //             'user' => fn () => $request->user()
    //                 ? $request->user()->load([
    //                     'media',
    //                     'role:id,name',
    //                     'role.permissions:id,name'
    //                 ])
    //                 : null,
    //         ],
    //         'permissions' => fn () => Permission::all(['id', 'model', 'type', 'name', 'notes']),
    //         'flash' => [
    //             'success' => fn () => $request->session()->get('success'),
    //             'error' => fn () => $request->session()->get('error'),
    //             'message' => fn () => $request->session()->get('message'),
    //         ],

    //         'projectCounts' => fn () => [
    //             'Total'   => Project::count(),
    //             'All' => Project::where('project_status', '!=', 'Deliver')->count(),
    //             'Planned' => Project::where('project_status', 'Planned')->count(),
    //             'Pending' => Project::where('project_status', 'Pending')->count(),
    //             'TakeoffOnProgress' => Project::where('project_status', 'Takeoff On Progress')->count(),
    //             'PricingOnProgress' => Project::where('project_status', 'Pricing On Progress')->count(),
    //             'Completed' => Project::where('project_status', 'Completed')->count(),
    //             'Hold' => Project::where('project_status', 'Hold')->count(),
    //             'Revision' => Project::where('project_status', 'Revision')->count(),
    //             'Cancelled' => Project::where('project_status', 'Cancelled')->count(),
    //             'Deliver' => Project::where('project_status', 'Deliver')->count(),
    //         ],
    //     ]);
    // }

    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => fn () => $request->user()
                    ? $request->user()->load([
                        'media',
                        'role:id,name',
                        'role.permissions:id,name'
                    ])
                    : null,
            ],

            'permissions' => fn () => Permission::all(['id', 'model', 'type', 'name', 'notes']),

            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'message' => fn () => $request->session()->get('message'),
            ],

            // ✅ Global project counts (all projects)
            'projectCounts' => fn () => [
                'Total'   => Project::count(),
                'All' => Project::where('project_status', '!=', 'Deliver')->count(),
                'Planned' => Project::where('project_status', 'Planned')->count(),
                'Pending' => Project::where('project_status', 'Pending')->count(),
                'TakeoffOnProgress' => Project::where('project_status', 'Takeoff On Progress')->count(),
                'PricingOnProgress' => Project::where('project_status', 'Pricing On Progress')->count(),
                'Completed' => Project::where('project_status', 'Completed')->count(),
                'Hold' => Project::where('project_status', 'Hold')->count(),
                'Revision' => Project::where('project_status', 'Revision')->count(),
                'Cancelled' => Project::where('project_status', 'Cancelled')->count(),
                'Deliver' => Project::where('project_status', 'Deliver')->count(),
            ],

            // ✅ Self project counts (for logged-in user)
            'selfProjectCounts' => function () use ($request) {
                $user = $request->user();
                if (!$user) {
                    return [];
                }

                $userId = $user->id;

                return [
                    'Total' => Project::whereHas('projectTeamMembers', fn($q) => $q->where('user_id', $userId))->count(),
                    'All' => Project::where('project_status', '!=', 'Deliver')
                        ->whereHas('projectTeamMembers', fn($q) => $q->where('user_id', $userId))
                        ->count(),
                    'Planned' => Project::where('project_status', 'Planned')
                        ->whereHas('projectTeamMembers', fn($q) => $q->where('user_id', $userId))
                        ->count(),
                    'Pending' => Project::where('project_status', 'Pending')
                        ->whereHas('projectTeamMembers', fn($q) => $q->where('user_id', $userId))
                        ->count(),
                    'TakeoffOnProgress' => Project::where('project_status', 'Takeoff On Progress')
                        ->whereHas('projectTeamMembers', fn($q) => $q->where('user_id', $userId))
                        ->count(),
                    'PricingOnProgress' => Project::where('project_status', 'Pricing On Progress')
                        ->whereHas('projectTeamMembers', fn($q) => $q->where('user_id', $userId))
                        ->count(),
                    'Completed' => Project::where('project_status', 'Completed')
                        ->whereHas('projectTeamMembers', fn($q) => $q->where('user_id', $userId))
                        ->count(),
                    'Hold' => Project::where('project_status', 'Hold')
                        ->whereHas('projectTeamMembers', fn($q) => $q->where('user_id', $userId))
                        ->count(),
                    'Revision' => Project::where('project_status', 'Revision')
                        ->whereHas('projectTeamMembers', fn($q) => $q->where('user_id', $userId))
                        ->count(),
                    'Cancelled' => Project::where('project_status', 'Cancelled')
                        ->whereHas('projectTeamMembers', fn($q) => $q->where('user_id', $userId))
                        ->count(),
                    'Deliver' => Project::where('project_status', 'Deliver')
                        ->whereHas('projectTeamMembers', fn($q) => $q->where('user_id', $userId))
                        ->count(),
                ];
            },

            // ✅ Detailed unread chat count
            'unreadChatCount' => function () use ($request) {
                $user = $request->user();
                if (!$user) return ['total' => 0, 'direct' => 0, 'group' => 0];
                
                $unreadMessages = \App\Models\ChatMessage::whereHas('chat.participants', function($q) use ($user) {
                        $q->where('user_id', $user->id);
                    })
                    ->where('sender_id', '!=', $user->id)
                    ->where(function($query) use ($user) {
                        $query->whereExists(function ($q) use ($user) {
                            $q->select(\DB::raw(1))
                              ->from('chat_participants')
                              ->whereColumn('chat_participants.chat_id', 'chat_messages.chat_id')
                              ->where('chat_participants.user_id', $user->id)
                              ->where(function($sq) {
                                  $sq->whereNull('chat_participants.last_read_at')
                                     ->orWhereColumn('chat_messages.created_at', '>', 'chat_participants.last_read_at');
                              });
                        });
                    })
                    ->join('chats', 'chat_messages.chat_id', '=', 'chats.id')
                    ->select('chats.type', \DB::raw('count(*) as count'))
                    ->groupBy('chats.type')
                    ->get();

                $direct = $unreadMessages->where('type', 'direct')->first()?->count ?? 0;
                $group = $unreadMessages->where('type', 'group')->first()?->count ?? 0;

                return [
                    'total' => $direct + $group,
                    'direct' => (int)$direct,
                    'group' => (int)$group
                ];
            },
        ]);
    }


}