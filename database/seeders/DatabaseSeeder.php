<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // \App\Models\User::factory(10)->create();
        $this->call([
            // UserSeeder::class,
            // CandidateSeeder::class,
            // JobLetterSeeder::class,
            // ClientSeeder::class,
            // ProjectSeeder::class,
            // ProjectRatingSeeder::class,
            // ProjectTeamMemberSeeder::class,
            // BranchSeeder::class,
            // DepartmentSeeder::class,
            // DesignationSeeder::class,
            // RoleSeeder::class,
            // PermissionSeeder,
            // RolePermissionSeeder,
            // RoleUser::class,
            // MediaSeeder::class,
        ]);
    }
}
