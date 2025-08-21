<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Client;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class ClientSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // ── 1) Possible titles (taken from your list)
        $titles = [
            'TNT',
            'PARABELLUM CONSTRUCTION',
            'Sheet Size 4.5 x 12',
            'Exterior',
            'Paint Division Code',
            'Airport',
            'Carpet LF (Flooring & Wall Tile)',
            'AC Square Feet',
            'Siding',
            'Structure Steel',
            'Sections',
            '$75 Paint',
            'Color Coordinate',
            'Link Summary',
            'Separate Colors – Exterior',
            'Electrical – 7% Tax & Room Wise',
            'Marc – Paint',
            'Paint Carpenter',
            'Paint – Proposal',
            'Div‑9',
            'Duct & Conduits Paint',
            'Brick1',
        ];

        // ── 2) Sample notes
        $publicNotes = [
            'Need carpet flooring in LF.',
            'Include epoxy coating on warehouse floor.',
            'Client prefers low‑VOC paints.',
            'Add contingency line for site logistics.',
            'Verify structural steel tonnage with engineer.',
            'Request updated architectural drawings before bid.',
        ];

        $privateNotes = [
            'High‑value client – respond within 24 h.',
            'Discounted 5 % on last project.',
            'Often pays late; require advance deposit.',
            'Prefers WhatsApp for quick queries.',
            'Met at Karachi Build Expo 2025.',
            'Send festive greeting card in December.',
        ];

        // ── 3) Generate 20–30 clients
        $howMany = rand(20, 30);

        for ($i = 1; $i <= $howMany; $i++) {

            // Fake contact name
            $name = Arr::random([
                'Ali Raza', 'Fatima Zahra', 'Ahmed Khan', 'Zainab Bukhari', 'Hassan Javed',
                'Sara Yousuf', 'Hamza Qureshi', 'Ayesha Tariq', 'Usman Aslam', 'Mariam Nadeem',
                'Bilal Saeed', 'Rabia Imran', 'Noman Ijaz', 'Hira Soomro', 'Faizan Latif',
                'Shahzaib Shah', 'Iqra Aziz', 'Kashif Mehmood', 'Komal Rizvi', 'Rehan Siddiqui',
            ]);

            // Unique email e.g. ali.raza123@client.test
            $email = Str::slug($name, '.')
                    . rand(100, 999)
                    . '@client.test';

            // Unique phone 03XX‑XXXXXXX
            $phone = '03' . str_pad(rand(0, 999999999), 9, '0', STR_PAD_LEFT);

            Client::create([
                'title'          => Arr::random($titles),
                'name'           => $name,
                'email'          => $email,
                'phone'          => $phone,
                'notes'          => Arr::random($publicNotes),
                'notes_private'  => Arr::random($privateNotes),
            ]);
        }
    }
}
