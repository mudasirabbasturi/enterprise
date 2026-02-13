# Leave Management Seeders

This directory contains seeders for the Leave Management system.

## Available Seeders

### 1. LeaveTypeSeeder
Seeds 8 common leave types:
- Annual Leave (AL) - 20 days/year, paid, carry forward
- Sick Leave (SL) - 12 days/year, paid, carry forward
- Casual Leave (CL) - 10 days/year, paid, no carry forward
- Maternity Leave (ML) - 90 days/year, paid
- Paternity Leave (PL) - 14 days/year, paid
- Unpaid Leave (UL) - unlimited, unpaid
- Bereavement Leave (BL) - 5 days/year, paid
- Compensatory Off (CO) - 12 days/year, paid

### 2. LeavePolicySeeder
Creates policies for each leave type with:
- Days per year allocation
- Monthly limits (where applicable)
- Approval requirements
- Half-day permissions

### 3. LeaveBalanceSeeder
Generates leave balances for all users with:
- Current year allocations
- Random used/pending values
- Calculated remaining balances

### 4. LeaveRequestSeeder
Creates 30 sample leave requests with:
- Various statuses (pending, approved, rejected, cancelled)
- Realistic date ranges (past 3 months to next 2 months)
- Half-day and full-day requests
- Approval details for processed requests

### 5. HolidaySeeder
Seeds US national holidays and company-specific holidays:
- 12 national holidays
- 2 company-specific holidays (if branches exist)

## How to Run

### Run Individual Seeders
```bash
# Run a specific seeder
php artisan db:seed --class=LeaveTypeSeeder
php artisan db:seed --class=LeavePolicySeeder
php artisan db:seed --class=LeaveBalanceSeeder
php artisan db:seed --class=LeaveRequestSeeder
php artisan db:seed --class=HolidaySeeder
```

### Run All Leave Seeders
1. Open `database/seeders/DatabaseSeeder.php`
2. Uncomment the leave management seeders:
```php
$this->call([
    LeaveTypeSeeder::class,
    LeavePolicySeeder::class,
    LeaveBalanceSeeder::class,
    LeaveRequestSeeder::class,
    HolidaySeeder::class,
]);
```
3. Run: `php artisan db:seed`

### Run in Specific Order
For best results, run seeders in this order:
1. LeaveTypeSeeder (creates leave types)
2. LeavePolicySeeder (creates policies based on leave types)
3. HolidaySeeder (creates holidays)
4. LeaveBalanceSeeder (creates balances for users)
5. LeaveRequestSeeder (creates sample requests)

## Prerequisites

Before running leave seeders, ensure you have:
- Users table populated (run UserSeeder first)
- Branches table populated (optional, for branch-specific policies/holidays)
- Departments table populated (optional)
- Designations table populated (optional)

## Notes

- LeaveBalanceSeeder and LeaveRequestSeeder require existing users
- LeavePolicySeeder works with or without branches/departments/designations
- All seeders use Carbon for date handling
- Random data is generated for realistic testing scenarios
