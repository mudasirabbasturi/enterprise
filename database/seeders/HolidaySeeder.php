<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class HolidaySeeder extends Seeder
{
    public function run(): void
    {
        // Check if holidays already exist
        if (DB::table('holidays')->count() > 0) {
            $this->command->info('Holidays already exist. Skipping...');
            return;
        }

        $now = Carbon::now();
        $currentYear = Carbon::now()->year;

        // Get branches
        $branches = DB::table('branches')->get();
        $mainBranch = $branches->where('is_main', true)->first();

        $holidays = [
            // National Holidays (applicable to all branches - null branch_id)
            [
                'title' => 'New Year\'s Day',
                'date' => Carbon::create($currentYear, 1, 1)->format('Y-m-d'),
                'branch_id' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Martin Luther King Jr. Day',
                'date' => Carbon::create($currentYear, 1, 20)->format('Y-m-d'),
                'branch_id' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Presidents\' Day',
                'date' => Carbon::create($currentYear, 2, 17)->format('Y-m-d'),
                'branch_id' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Memorial Day',
                'date' => Carbon::create($currentYear, 5, 26)->format('Y-m-d'),
                'branch_id' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Independence Day',
                'date' => Carbon::create($currentYear, 7, 4)->format('Y-m-d'),
                'branch_id' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Labor Day',
                'date' => Carbon::create($currentYear, 9, 1)->format('Y-m-d'),
                'branch_id' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Columbus Day',
                'date' => Carbon::create($currentYear, 10, 13)->format('Y-m-d'),
                'branch_id' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Veterans Day',
                'date' => Carbon::create($currentYear, 11, 11)->format('Y-m-d'),
                'branch_id' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Thanksgiving Day',
                'date' => Carbon::create($currentYear, 11, 27)->format('Y-m-d'),
                'branch_id' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Day After Thanksgiving',
                'date' => Carbon::create($currentYear, 11, 28)->format('Y-m-d'),
                'branch_id' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Christmas Eve',
                'date' => Carbon::create($currentYear, 12, 24)->format('Y-m-d'),
                'branch_id' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Christmas Day',
                'date' => Carbon::create($currentYear, 12, 25)->format('Y-m-d'),
                'branch_id' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        // Add some branch-specific holidays if branches exist
        if ($mainBranch) {
            $holidays[] = [
                'title' => 'Company Foundation Day',
                'date' => Carbon::create($currentYear, 3, 15)->format('Y-m-d'),
                'branch_id' => $mainBranch->id,
                'created_at' => $now,
                'updated_at' => $now,
            ];
            
            $holidays[] = [
                'title' => 'Annual Company Retreat',
                'date' => Carbon::create($currentYear, 8, 10)->format('Y-m-d'),
                'branch_id' => $mainBranch->id,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('holidays')->insert($holidays);
        $this->command->info('Holidays seeded successfully!');
    }
}
