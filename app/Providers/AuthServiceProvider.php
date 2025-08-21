<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\Project;
use App\Models\User;
use App\Models\Client;
use App\Models\Branch;
use App\Models\Department;
use App\Models\Permission;
use App\Models\Role;
use App\Policies\ProjectPolicy;
use App\Policies\UserPolicy;
use App\Policies\ClientPolicy;
use App\Policies\BranchPolicy;
use App\Policies\DepartmentPolicy;
use App\Policies\PermissionPolicy;
use App\Policies\RolePolicy;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Project::class => ProjectPolicy::class,
        User::class => UserPolicy::class,
        Client::class => ClientPolicy::class,
        Branch::class => BranchPolicy::class,
        Department::class => DepartmentPolicy::class,
        Permission::class => PermissionPolicy::class,
        Role::class => RolePolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Super admin gate (optional - gives full access to super admin role)
        Gate::before(function ($user, $ability) {
            // You can implement super admin logic here if needed
            // return $user->hasRole('super_admin') ? true : null;
        });
    }
}