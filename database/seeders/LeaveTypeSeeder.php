<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class LeaveTypeSeeder extends Seeder
{
    public function run(): void
    {
        // Check if leave types already exist
        if (DB::table('leave_types')->count() > 0) {
            $this->command->info('Leave types already exist. Skipping...');
            return;
        }

        $now = Carbon::now();

        $leaveTypes = [
            [
                'name' => 'Annual Leave',
                'code' => 'AL',
                'color' => '#2ECC71',
                'is_paid' => true,
                'is_carry_forward' => true,
                'max_per_year' => 20,
                'allow_half_day' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Sick Leave',
                'code' => 'SL',
                'color' => '#E74C3C',
                'is_paid' => true,
                'is_carry_forward' => true,
                'max_per_year' => 12,
                'allow_half_day' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Casual Leave',
                'code' => 'CL',
                'color' => '#3498DB',
                'is_paid' => true,
                'is_carry_forward' => false,
                'max_per_year' => 10,
                'allow_half_day' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Maternity Leave',
                'code' => 'ML',
                'color' => '#9B59B6',
                'is_paid' => true,
                'is_carry_forward' => false,
                'max_per_year' => 90,
                'allow_half_day' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Paternity Leave',
                'code' => 'PL',
                'color' => '#1ABC9C',
                'is_paid' => true,
                'is_carry_forward' => false,
                'max_per_year' => 14,
                'allow_half_day' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Unpaid Leave',
                'code' => 'UL',
                'color' => '#95A5A6',
                'is_paid' => false,
                'is_carry_forward' => false,
                'max_per_year' => null,
                'allow_half_day' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Bereavement Leave',
                'code' => 'BL',
                'color' => '#34495E',
                'is_paid' => true,
                'is_carry_forward' => false,
                'max_per_year' => 5,
                'allow_half_day' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Compensatory Off',
                'code' => 'CO',
                'color' => '#F39C12',
                'is_paid' => true,
                'is_carry_forward' => false,
                'max_per_year' => 12,
                'allow_half_day' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('leave_types')->insert($leaveTypes);
        $this->command->info('Leave types seeded successfully!');
    }
}
