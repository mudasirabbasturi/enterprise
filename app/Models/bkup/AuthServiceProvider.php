<?php 
namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\Permission;

class AuthServiceProvider extends ServiceProvider
{
    public function boot()
    {
        $this->registerPolicies();
        Gate::before(function ($user, $ability) {
            if ($user->hasPermissionTo('Permission', 'super_admin')) {
                return true;
            }
        });
        Permission::all()->each(function ($permission) {
            Gate::define($permission->key, function ($user) use ($permission) {
                return $user->hasPermissionTo($permission->model, $permission->name, $permission->type);
            });
        });
    }
}