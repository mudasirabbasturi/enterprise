<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class LeavePolicySeeder extends Seeder
{
    public function run(): void
    {
        // Check if leave policies already exist
        if (DB::table('leave_policies')->count() > 0) {
            $this->command->info('Leave policies already exist. Skipping...');
            return;
        }

        $now = Carbon::now();

        // Get IDs from existing data
        $leaveTypes = DB::table('leave_types')->get();
        $branches = DB::table('branches')->get();
        $departments = DB::table('departments')->get();
        $designations = DB::table('designations')->get();

        if ($leaveTypes->count() === 0) {
            $this->command->warn('No leave types found. Please run LeaveTypeSeeder first.');
            return;
        }

        $policies = [];

        // Annual Leave Policies
        if ($leaveTypes->where('code', 'AL')->first()) {
            $annualLeaveId = $leaveTypes->where('code', 'AL')->first()->id;
            
            // Policy for all employees
            $policies[] = [
                'leave_type_id' => $annualLeaveId,
                'branch_id' => null,
                'department_id' => null,
                'designation_id' => null,
                'days_per_year' => 20,
                'max_per_month' => null,
                'requires_approval' => true,
                'allow_half_day' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // Sick Leave Policies
        if ($leaveTypes->where('code', 'SL')->first()) {
            $sickLeaveId = $leaveTypes->where('code', 'SL')->first()->id;
            
            $policies[] = [
                'leave_type_id' => $sickLeaveId,
                'branch_id' => null,
                'department_id' => null,
                'designation_id' => null,
                'days_per_year' => 12,
                'max_per_month' => 3,
                'requires_approval' => true,
                'allow_half_day' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // Casual Leave Policies
        if ($leaveTypes->where('code', 'CL')->first()) {
            $casualLeaveId = $leaveTypes->where('code', 'CL')->first()->id;
            
            $policies[] = [
                'leave_type_id' => $casualLeaveId,
                'branch_id' => null,
                'department_id' => null,
                'designation_id' => null,
                'days_per_year' => 10,
                'max_per_month' => 2,
                'requires_approval' => true,
                'allow_half_day' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // Maternity Leave Policies
        if ($leaveTypes->where('code', 'ML')->first()) {
            $maternityLeaveId = $leaveTypes->where('code', 'ML')->first()->id;
            
            $policies[] = [
                'leave_type_id' => $maternityLeaveId,
                'branch_id' => null,
                'department_id' => null,
                'designation_id' => null,
                'days_per_year' => 90,
                'max_per_month' => null,
                'requires_approval' => true,
                'allow_half_day' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // Paternity Leave Policies
        if ($leaveTypes->where('code', 'PL')->first()) {
            $paternityLeaveId = $leaveTypes->where('code', 'PL')->first()->id;
            
            $policies[] = [
                'leave_type_id' => $paternityLeaveId,
                'branch_id' => null,
                'department_id' => null,
                'designation_id' => null,
                'days_per_year' => 14,
                'max_per_month' => null,
                'requires_approval' => true,
                'allow_half_day' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // Compensatory Off Policies
        if ($leaveTypes->where('code', 'CO')->first()) {
            $compOffId = $leaveTypes->where('code', 'CO')->first()->id;
            
            $policies[] = [
                'leave_type_id' => $compOffId,
                'branch_id' => null,
                'department_id' => null,
                'designation_id' => null,
                'days_per_year' => 12,
                'max_per_month' => 2,
                'requires_approval' => true,
                'allow_half_day' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if (count($policies) > 0) {
            DB::table('leave_policies')->insert($policies);
            $this->command->info('Leave policies seeded successfully!');
        }
    }
}
