<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $branches = [
            [
                'name' => 'Headquarters – 270 Park Avenue',
                'is_main' => true,
                'code' => 'HQ-NY',
                'type' => 'headquarter',
                'status' => 'active',
                'email' => 'hq@jpmorganchase.com',
                'phone' => '+1 212-270-6000',
                'fax' => '+1 212-270-1648',
                'country' => 'United States',
                'state' => 'NY',
                'city' => 'New York',
                'address' => '270 Park Avenue',
                'postal_zip_code' => '10017',
                'notes' => 'Global headquarters of JPMorgan Chase Bank.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Chicago Branch – 10 S Dearborn St',
                'is_main' => false,
                'code' => 'CHI-IL',
                'type' => 'branch',
                'status' => 'active',
                'email' => 'chicago@jpmorganchase.com',
                'phone' => '+1 312-732-1164',
                'fax' => null,
                'country' => 'United States',
                'state' => 'IL',
                'city' => 'Chicago',
                'address' => '10 S Dearborn St',
                'postal_zip_code' => '60603',
                'notes' => 'Downtown Chicago branch.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('branches')->insert($branches);
    }
}
