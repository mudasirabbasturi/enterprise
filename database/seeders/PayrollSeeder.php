<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PayrollTaxRule;
use App\Models\SalaryPackage;
use App\Models\SalaryAllowance;
use App\Models\EmployeeSalary;
use App\Models\PayrollConfig;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PayrollSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Seed Tax Rules
        $taxRules = [
            [
                'name' => 'Income Tax (Standard)',
                'type' => 'percentage',
                'value' => 10,
                'description' => 'Standard monthly income tax deduction'
            ],
            [
                'name' => 'Provident Fund',
                'type' => 'percentage',
                'value' => 2,
                'description' => 'Contributory provident fund'
            ],
            [
                'name' => 'Professional Tax',
                'type' => 'fixed',
                'value' => 500,
                'description' => 'Professional tax for urban areas'
            ],
            [
                'name' => 'Social Security',
                'type' => 'percentage',
                'value' => 1.5,
                'description' => 'Health and social security contribution'
            ]
        ];

        foreach ($taxRules as $rule) {
            PayrollTaxRule::updateOrCreate(['name' => $rule['name']], $rule);
        }

        $allTaxRuleIds = PayrollTaxRule::pluck('id')->toArray();

        // 2. Seed Salary Packages
        $packages = [
            [
                'name' => 'Standard Frontend Developer',
                'base_salary' => 85000,
                'currency' => 'PKR',
                'allowances' => [
                    ['label' => 'House Rent', 'amount' => 15000],
                    ['label' => 'Medical', 'amount' => 5000],
                    ['label' => 'Conveyance', 'amount' => 5000]
                ],
                'taxes' => [1, 2, 3] // Indices of $taxRules (1-based for IDs usually)
            ],
            [
                'name' => 'Senior Backend Engineer',
                'base_salary' => 160000,
                'currency' => 'PKR',
                'allowances' => [
                    ['label' => 'House Rent', 'amount' => 30000],
                    ['label' => 'Medical', 'amount' => 10000],
                    ['label' => 'Utility', 'amount' => 10000]
                ],
                'taxes' => [1, 2, 3, 4]
            ],
            [
                'name' => 'Management / Executive',
                'base_salary' => 250000,
                'currency' => 'PKR',
                'allowances' => [
                    ['label' => 'Executive Allowance', 'amount' => 50000],
                    ['label' => 'Fuel Allowance', 'amount' => 20000]
                ],
                'taxes' => [1, 2]
            ]
        ];

        foreach ($packages as $pkgData) {
            $allowances = $pkgData['allowances'];
            $taxes = $pkgData['taxes'];
            unset($pkgData['allowances'], $pkgData['taxes']);

            $package = SalaryPackage::updateOrCreate(['name' => $pkgData['name']], $pkgData);

            // Seed Allowances
            $package->allowances()->delete();
            foreach ($allowances as $allowance) {
                $package->allowances()->create($allowance);
            }

            // Link Taxes
            $package->taxRules()->sync($taxes);
        }

        // 3. Seed Payroll Configuration
        $configs = [
            ['key' => 'late_deduction_rate', 'value' => '500'],
            ['key' => 'absent_deduction_policy', 'value' => 'pro_rata'],
            ['key' => 'working_days_per_month', 'value' => '22'],
            ['key' => 'currency_symbol', 'value' => 'Rs.']
        ];

        foreach ($configs as $config) {
            PayrollConfig::updateOrCreate(['key' => $config['key']], $config);
        }

        // 4. Assign Packages to Users
        $users = User::all();
        $packageIds = SalaryPackage::pluck('id')->toArray();

        if (count($packageIds) > 0) {
            foreach ($users as $user) {
                // Randomly skip some users (e.g., 20% of users don't have a package yet)
                if (rand(1, 100) > 80) continue;

                EmployeeSalary::updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'package_id' => $packageIds[array_rand($packageIds)],
                        'custom_salary' => rand(0, 10) > 8 ? rand(70000, 300000) : null // 20% users have override
                    ]
                );
            }
        }
    }
}
