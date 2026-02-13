<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class LeaveBalanceSeeder extends Seeder
{
    public function run(): void
    {
        // Check if leave balances already exist
        if (DB::table('leave_balances')->count() > 0) {
            $this->command->info('Leave balances already exist. Skipping...');
            return;
        }

        $now = Carbon::now();
        $currentYear = Carbon::now()->year;

        // Get all users and leave types
        $users = DB::table('users')->get();
        $leaveTypes = DB::table('leave_types')->get();

        if ($users->count() === 0) {
            $this->command->warn('No users found. Please run UserSeeder first.');
            return;
        }

        if ($leaveTypes->count() === 0) {
            $this->command->warn('No leave types found. Please run LeaveTypeSeeder first.');
            return;
        }

        $balances = [];

        foreach ($users as $user) {
            // Annual Leave Balance
            if ($leaveTypes->where('code', 'AL')->first()) {
                $balances[] = [
                    'user_id' => $user->id,
                    'leave_type_id' => $leaveTypes->where('code', 'AL')->first()->id,
                    'year' => $currentYear,
                    'allocated' => 20,
                    'used' => rand(0, 8),
                    'pending' => rand(0, 2),
                    'remaining' => 0, // Will be calculated
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            // Sick Leave Balance
            if ($leaveTypes->where('code', 'SL')->first()) {
                $balances[] = [
                    'user_id' => $user->id,
                    'leave_type_id' => $leaveTypes->where('code', 'SL')->first()->id,
                    'year' => $currentYear,
                    'allocated' => 12,
                    'used' => rand(0, 5),
                    'pending' => rand(0, 1),
                    'remaining' => 0,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            // Casual Leave Balance
            if ($leaveTypes->where('code', 'CL')->first()) {
                $balances[] = [
                    'user_id' => $user->id,
                    'leave_type_id' => $leaveTypes->where('code', 'CL')->first()->id,
                    'year' => $currentYear,
                    'allocated' => 10,
                    'used' => rand(0, 6),
                    'pending' => rand(0, 1),
                    'remaining' => 0,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            // Compensatory Off Balance
            if ($leaveTypes->where('code', 'CO')->first()) {
                $balances[] = [
                    'user_id' => $user->id,
                    'leave_type_id' => $leaveTypes->where('code', 'CO')->first()->id,
                    'year' => $currentYear,
                    'allocated' => rand(0, 12),
                    'used' => rand(0, 4),
                    'pending' => 0,
                    'remaining' => 0,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        // Calculate remaining for each balance
        foreach ($balances as &$balance) {
            $balance['remaining'] = $balance['allocated'] - $balance['used'] - $balance['pending'];
        }

        if (count($balances) > 0) {
            DB::table('leave_balances')->insert($balances);
            $this->command->info('Leave balances seeded successfully!');
        }
    }
}
