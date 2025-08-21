<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Assign roles to users manually
        $assignments = [
            ['user_id' => 2, 'role_id' => 1], // Super Admin
            ['user_id' => 1, 'role_id' => 2], // Supervisor
        ];

        foreach ($assignments as $assign) {
            DB::table('role_user')->updateOrInsert(
                ['user_id' => $assign['user_id'], 'role_id' => $assign['role_id']],
                ['created_at' => now(), 'updated_at' => now()]
            );
        }
    }
}
