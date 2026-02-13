<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class LeaveRequestSeeder extends Seeder
{
    public function run(): void
    {
        // Check if leave requests already exist
        if (DB::table('leave_requests')->count() > 0) {
            $this->command->info('Leave requests already exist. Skipping...');
            return;
        }

        $now = Carbon::now();

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

        $requests = [];
        $statuses = ['pending', 'approved', 'rejected', 'cancelled'];

        // Create 30 sample leave requests
        for ($i = 0; $i < 30; $i++) {
            $user = $users->random();
            $leaveType = $leaveTypes->random();
            $status = $statuses[array_rand($statuses)];
            
            // Random date in the past 3 months or next 2 months
            $startDate = Carbon::now()->addDays(rand(-90, 60));
            $isHalfDay = rand(0, 5) === 0; // 1 in 6 chance of half day
            
            if ($isHalfDay) {
                $endDate = $startDate->copy();
                $totalDays = 0.5;
                $halfDayType = ['first_half', 'second_half'][rand(0, 1)];
            } else {
                $duration = rand(1, 7); // 1 to 7 days
                $endDate = $startDate->copy()->addDays($duration - 1);
                $totalDays = $duration;
                $halfDayType = null;
            }

            $reasons = [
                'Personal work',
                'Family function',
                'Medical appointment',
                'Vacation trip',
                'Home renovation',
                'Attending wedding',
                'Health checkup',
                'Child\'s school event',
                'Religious festival',
                'Emergency at home',
            ];

            $rejectionReasons = [
                'Insufficient leave balance',
                'Project deadline approaching',
                'Team already understaffed',
                'Peak business period',
                'Prior commitments',
            ];

            $request = [
                'user_id' => $user->id,
                'leave_type_id' => $leaveType->id,
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
                'total_days' => $totalDays,
                'is_half_day' => $isHalfDay,
                'half_day_type' => $halfDayType,
                'reason' => $reasons[array_rand($reasons)],
                'status' => $status,
                'approved_by' => null,
                'approved_at' => null,
                'rejection_reason' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            // Add approval details for approved/rejected requests
            if (in_array($status, ['approved', 'rejected'])) {
                $approver = $users->where('id', '!=', $user->id)->random();
                $request['approved_by'] = $approver->id;
                $request['approved_at'] = $now->copy()->subDays(rand(1, 5));
                
                if ($status === 'rejected') {
                    $request['rejection_reason'] = $rejectionReasons[array_rand($rejectionReasons)];
                }
            }

            $requests[] = $request;
        }

        DB::table('leave_requests')->insert($requests);
        $this->command->info('Leave requests seeded successfully!');
    }
}
