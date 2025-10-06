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
                'name' => 'Super Admin',
                'notes' => 'Has full system access, including managing roles, users, and permissions, can. Super admin can not be edit or delete',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Admin',
                'notes' => 'Can manage core modules like projects, users, and reports but limited role control.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Estimator',
                'notes' => 'Responsible for estimating project costs and timelines, can only view related financials.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }
}
