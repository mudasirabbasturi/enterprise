<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('roles')->insert([
            [
                'name' => 'super_admin',
                'notes' => 'Has full system access, including managing roles, users, and permissions, can. Super admin can not be edit or delete',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'admin',
                'notes' => 'Can manage core modules like projects, users, and reports but limited role control.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'supervisor',
                'notes' => 'Oversees project execution and can view, assign, and update task progress.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'estimator',
                'notes' => 'Responsible for estimating project costs and timelines, can only view related financials.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'hr_manager',
                'notes' => 'Manages departments, designations, and employee records.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'employee',
                'notes' => 'Basic access to view assigned projects and submit reports or updates.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }
}
