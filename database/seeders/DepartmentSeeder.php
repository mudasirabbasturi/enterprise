<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        $branches = DB::table('branches')->get();

        foreach ($branches as $branch) {
            $departments = [
                'Finance Department',
                'Human Resources',
                'Legal & Compliance',
                'IT Services',
            ];

            foreach ($departments as $name) {
                DB::table('departments')->insert([
                    'name' => $name,
                    'branch_id' => $branch->id,
                    'email' => null,
                    'phone' => null,
                    'fax' => null,
                    'notes' => "Department of $name located in branch: {$branch->name}",
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }
}
