<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\UserAttendance;
use Carbon\Carbon;

class UserAttendanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $userId = 3;
        $year = 2026;
        $month = 2; // February

        // February 2026 has 28 days
        for ($day = 1; $day <= 28; $day++) {
            $date = Carbon::create($year, $month, $day);

            // Saturday (6) and Sunday (0) are off
            if ($date->isWeekend()) {
                continue;
            }

            $dateStr = $date->toDateString();
            
            // Default values
            $checkIn = '16:00:00';
            $checkOut = '00:30:00';
            $workFrom = 'office';
            $notes = 'Regular office day';
            $break = ['break_start' => '20:00:00', 'break_end' => '20:30:00']; // Default 30 min break

            // 1. Late arrivals (Feb 2, 3, 4)
            if ($day >= 2 && $day <= 4) {
                $checkIn = '16:20:00';
                $notes = 'Late arrival (20 mins)';
            }
            // 2. Home work with overtime (Feb 5, 6, 9)
            else if ($day >= 5 && $day <= 9 && !$date->isWeekend()) {
                $workFrom = 'home';
                $checkOut = '01:30:00'; // 9.5 hours total
                $notes = 'Work from home with overtime';
            }
            // 3. Extra break - more than 30 mins (Feb 10, 11)
            else if ($day == 10 || $day == 11) {
                $break = ['break_start' => '20:00:00', 'break_end' => '21:15:00']; // 1h 15m break
                $notes = 'Extended break session';
            }
            // 4. No break + early checkout (Feb 12, 13)
            else if ($day == 12 || $day == 13) {
                $checkOut = '00:00:00'; // Early checkout (before 30 mins of shift end)
                $break = ['break_start' => null, 'break_end' => null];
                $notes = 'No break taken - finished early';
            }

            UserAttendance::updateOrCreate(
                ['user_id' => $userId, 'date' => $dateStr],
                [
                    'status' => 'Marked',
                    'notes' => $notes,
                    'clock' => [
                        [
                            'work_from' => $workFrom,
                            'check_in' => $checkIn,
                            'break' => $break,
                            'check_out' => $checkOut,
                            'status' => 'approved',
                        ]
                    ]
                ]
            );
        }

        $this->command->info('Attendance dummy data for User 3 in Feb 2026 seeded successfully!');
    }
}
