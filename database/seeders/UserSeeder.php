<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Arr;
use Carbon\Carbon;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //////////////////////////////////////////
        // 1)  Fixed list of real‑sounding names
        //////////////////////////////////////////
        $names = [
            'Ali Raza', 'Fatima Zahra', 'Ahmed Khan', 'Zainab Bukhari', 'Hassan Javed',
            'Sara Yousuf', 'Hamza Qureshi', 'Ayesha Tariq', 'Usman Aslam', 'Mariam Nadeem',
            'Bilal Saeed', 'Rabia Imran', 'Noman Ijaz', 'Hira Soomro', 'Faizan Latif',
            'Mehwish Hayat', 'Shahzaib Shah', 'Iqra Aziz', 'Kashif Mehmood', 'Komal Rizvi',
            'Sajjad Haider', 'Anum Malik', 'Rehan Siddiqui', 'Nashit Ahmed', 'Tania Zaidi',
            'Asad Shafiq', 'Nida Yasir', 'Waqar Zaka', 'Kinza Hashmi', 'Tariq Jameel',
        ];

        //////////////////////////////////////////////////////////////
        // 2)  State → City + Postal‑Code lookup table (fast & simple)
        //////////////////////////////////////////////////////////////
        $stateData = [
            // KP
            'kp' => [
                ['city' => 'Peshawar',     'zip' => '25000'],
                ['city' => 'Abbottabad',   'zip' => '22010'],
                ['city' => 'Mardan',       'zip' => '23200'],
            ],
            // Punjab
            'punjab' => [
                ['city' => 'Lahore',       'zip' => '54000'],
                ['city' => 'Rawalpindi',   'zip' => '46000'],
                ['city' => 'Faisalabad',   'zip' => '38000'],
                ['city' => 'Multan',       'zip' => '60000'],
            ],
            // Sindh
            'sindh' => [
                ['city' => 'Karachi',      'zip' => '74200'],
                ['city' => 'Hyderabad',    'zip' => '71000'],
                ['city' => 'Sukkur',       'zip' => '65200'],
            ],
            // Balochistan
            'balochistan' => [
                ['city' => 'Quetta',       'zip' => '87300'],
                ['city' => 'Gwadar',       'zip' => '91200'],
            ],
        ];

        ////////////////////////////////////////
        // 3)  A handful of note snippets
        ////////////////////////////////////////
        $notePool = [
            'Hired after extensive technical interview.',
            'Transferred from sister company.',
            'On track for team‑lead promotion.',
            'Referred by existing employee.',
            'Contract converted to full‑time.',
        ];

        ////////////////////////////////////////
        // 4)  Create each user
        ////////////////////////////////////////
        foreach ($names as $name) {
            // ── Email & username
            $username = strtolower(str_replace([' ', '.'], ['_', ''], $name));
            $email    = $username . rand(100, 999) . '@example.com';

            // ── Random state + city + zip
            $stateKey   = array_rand($stateData);          // kp, punjab, …
            $cityRecord = Arr::random($stateData[$stateKey]);

            // ── Dates
            $hiring  = Carbon::create(rand(2023, 2024), rand(1, 12), rand(1, 28));
            $joining = (clone $hiring)->addDays(rand(7, 90));   // always after hiring

            // ── Phone number   e.g. 03011234567
            $phone = '03' . str_pad(rand(0, 999999999), 9, '0', STR_PAD_LEFT);

            // ── Finally create (triggers booted() for employee_id)
            User::create([
                'name'                 => $name,
                'email'                => $email,
                'password'             => Hash::make('password123'),
                'phone'                => $phone,
                'country'              => 'Pakistan',
                'state'                => $stateKey,                 // kp | punjab | sindh | balochistan
                'city'                 => $cityRecord['city'],
                'postal_or_zip_code'   => $cityRecord['zip'],
                'permanent_address'    => $cityRecord['city'] . ', ' . ucfirst($stateKey),
                'current_address'      => $cityRecord['city'] . ', ' . ucfirst($stateKey),
                'hiring_date'          => $hiring->toDateString(),
                'joining_date'         => $joining->toDateString(),
                'leaving_date'         => null,
                'notes'                => Arr::random($notePool),
                'picture_path'         => null,
                'dob'         => null,
                'status'               => 'active',
            ]);
        }
    }
}
