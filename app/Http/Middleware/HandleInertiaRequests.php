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

            'projectCounts' => fn () => [
                'Total'   => Project::count(),
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
        ]);
    }

}