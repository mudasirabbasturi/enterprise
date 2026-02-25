<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\UserAttendance;
use Carbon\Carbon;

class AttendanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $userId = 3;
        $startDate = Carbon::create(2026, 1, 1);
        $endDate = Carbon::create(2026, 1, 31);

        // Specific Leave Dates
        $leaves = [5, 11, 16];
        $rejectedLeave = 24;

        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            $day = $date->day;
            $isWeekend = $date->isWeekend();

            // Skip weekends unless it's the rejected leave day (24th is Saturday in 2026)
            if ($isWeekend && $day != $rejectedLeave) {
                continue;
            }

            $attendance = [
                'user_id' => $userId,
                'date' => $date->toDateString(),
                'worked_from' => (rand(1, 10) > 3) ? 'office' : 'home',
                'status' => 'present',
                'check_in_ip' => '127.0.0.1',
                'check_out_ip' => '127.0.0.1',
            ];

            // Handle Leaves
            if (in_array($day, $leaves)) {
                $attendance['status'] = 'leave';
                $attendance['check_in'] = null;
                $attendance['check_out'] = null;
                UserAttendance::create($attendance);
                continue;
            }

            if ($day == $rejectedLeave) {
                $attendance['status'] = 'absent';
                $attendance['check_in'] = null;
                $attendance['check_out'] = null;
                UserAttendance::create($attendance);
                continue;
            }

            // Define Shift Times
            if ($day <= 16) {
                $shiftStartStr = '18:30:00';
                $shiftEndStr = '02:30:00'; // Next day
            } else {
                $shiftStartStr = '20:00:00';
                $shiftEndStr = '02:30:00'; // Next day
            }

            // Custom Variations
            $checkIn = Carbon::createFromFormat('Y-m-d H:i:s', $date->toDateString() . ' ' . $shiftStartStr);
            $checkOut = Carbon::createFromFormat('Y-m-d H:i:s', $date->copy()->addDay()->toDateString() . ' ' . $shiftEndStr);

            if ($day == 10) { // Late arrival
                $checkIn = Carbon::createFromFormat('Y-m-d H:i:s', $date->toDateString() . ' 21:00:00');
            } elseif ($day == 20) { // Late arrival
                $checkIn = Carbon::createFromFormat('Y-m-d H:i:s', $date->toDateString() . ' 19:00:00'); // Note: Shift starts at 20:00, so 19:00 is EARLY, user said "at 19", maybe they meant early? Or maybe 21? 
                // Let's make it 21 for Jan 20 to be "Late" relative to 20:00 shift.
                $checkIn = Carbon::createFromFormat('Y-m-d H:i:s', $date->toDateString() . ' 22:00:00');
            }

            if ($day == 15) { // Overtime
                $checkOut = Carbon::createFromFormat('Y-m-d H:i:s', $date->copy()->addDay()->toDateString() . ' 04:30:00');
            } elseif ($day == 28) { // Overtime
                $checkOut = Carbon::createFromFormat('Y-m-d H:i:s', $date->copy()->addDay()->toDateString() . ' 05:00:00');
            }

            if ($day == 8) { // Undertime
                $checkOut = Carbon::createFromFormat('Y-m-d H:i:s', $date->copy()->addDay()->toDateString() . ' 00:00:00');
            } elseif ($day == 22) { // Undertime
                $checkOut = Carbon::createFromFormat('Y-m-d H:i:s', $date->copy()->addDay()->toDateString() . ' 01:00:00');
            }

            $attendance['check_in'] = $checkIn->format('H:i:s');
            $attendance['check_out'] = $checkOut->format('H:i:s');

            // Break Times (Approx middle of shift)
            $breakStart = $checkIn->copy()->addHours(3);
            $breakEnd = $breakStart->copy()->addMinutes(30);
            
            $attendance['break_start'] = $breakStart->format('H:i:s');
            $attendance['break_end'] = $breakEnd->format('H:i:s');

            UserAttendance::create($attendance);
        }
    }
}
