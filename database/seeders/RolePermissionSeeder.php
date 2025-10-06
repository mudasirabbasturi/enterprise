<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $roles = DB::table('roles')->get()->keyBy('name');
        $permissions = DB::table('permissions')->get()->keyBy('name');

        $rolePermissions = [
            'Super Admin' => $permissions->keys()->toArray(), // All permissions
        ];

        foreach ($rolePermissions as $roleName => $permissionNames) {
            $roleId = $roles[$roleName]->id;

            foreach ($permissionNames as $permissionName) {
                $permission = $permissions[$permissionName] ?? null;

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
