<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class DesignationSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        $departments = DB::table('departments')->get();

        foreach ($departments as $department) {
            $designations = match ($department->name) {
                'Finance Department' => ['Accountant', 'Financial Analyst', 'Auditor'],
                'Human Resources' => ['HR Manager', 'Recruiter'],
                'Legal & Compliance' => ['Legal Advisor', 'Compliance Officer'],
                'IT Services' => ['Software Engineer', 'System Admin'],
                default => ['Staff'],
            };

            foreach ($designations as $title) {
                DB::table('designations')->insert([
                    'name' => $title,
                    'department_id' => $department->id,
                    'notes' => "$title under {$department->name}",
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }
}
