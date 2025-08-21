<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all roles with names
        $roles = DB::table('roles')->get()->keyBy('name');

        // Get all permissions
        $permissions = DB::table('permissions')->get()->keyBy('route');

        // Define permission sets per role
        $rolePermissions = [
            'super_admin' => $permissions->keys()->toArray(), // all permissions
            'admin' => [
                'project.index', 'project.store', 'project.update', 'project.destroy', 'project.status',
                'client.index', 'client.store', 'client.update', 'client.destroy',
                'user.index', 'user.store', 'user.update', 'user.destroy',
                'role.index', 'role.store', 'role.update',
                'permission.index',
            ],
            'supervisor' => [
                'project.index', 'project.update', 'project.status',
            ],
            'estimator' => [
                'project.index',
            ],
            'hr_manager' => [
                'department.index', 'department.store', 'department.update', 'department.destroy',
                'designation.index', 'designation.store', 'designation.update', 'designation.destroy',
                'user.index', 'user.store', 'user.update',
            ],
            'employee' => [
                'project.index',
            ],
        ];

        // Insert role-permission mappings
        foreach ($rolePermissions as $roleName => $routes) {
            $roleId = $roles[$roleName]->id;

            foreach ($routes as $route) {
                $permission = $permissions[$route] ?? null;

                if ($permission) {
                    DB::table('role_permission')->updateOrInsert([
                        'role_id' => $roleId,
                        'permission_id' => $permission->id,
                    ]);
                }
            }
        }
    }
}
