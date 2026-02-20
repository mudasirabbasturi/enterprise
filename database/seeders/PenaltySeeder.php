<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PayrollPenalty;
use App\Models\User;
use Carbon\Carbon;

class PenaltySeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();
        if ($users->isEmpty()) return;

        $admin = User::where('name', 'LIKE', '%Admin%')->first() ?? User::first();

        $funnyReasons = [
            "Caught trying to charge their phone using the office plant's 'positive vibes'.",
            "Fined for using the company printer to print a 100-page manifesto on why pineapple belongs on pizza.",
            "Attempted to train the office goldfish to perform automated QA testing.",
            "Organized an unsanctioned 'Chair Racing Championship' in the main hallway during stand-up.",
            "Reply-all to a company-wide email with a 4K GIF of a dancing hamster.",
            "Fined for 'Aggressive Aggressive' behavior (being too helpful in a terrifying way).",
            "Caught sleeping in the server room because it has 'optimal white noise'.",
            "Brought a emotional support potato to a client meeting and introduced it as the 'Lead Consultant'.",
            "Used the office microwave to reheat fish for the 3rd time this week.",
            "Spent 4 hours arguing with the office Alexa about the meaning of life.",
            "Fined for 'Main Character Energy' that was disrupting the local ecosystem.",
            "Attempted to pay for office snacks using 'Exposure' and 'Good Karma'.",
            "Caught practicing 'Silent Screaming' in the breakout area.",
            "Fined for having a desktop wallpaper so messy it gave the IT manager a panic attack.",
            "Actually tried to 'Download More RAM' on a production server.",
            "Left a half-eaten sandwich in the fridge dated 2024.",
            "Fined for excessive use of the word 'Synergy' in a single Slack thread (over 47 times)."
        ];

        $types = ['Late Arrival', 'Early Departure', 'Misconduct', 'Policy Violation', 'Other'];

        foreach ($users as $user) {
            // Assign 1-2 penalties to about 40% of users
            if (rand(1, 100) > 60) {
                $numPenalties = rand(1, 2);
                for ($i = 0; $i < $numPenalties; $i++) {
                    PayrollPenalty::create([
                        'user_id' => $user->id,
                        'type' => $types[array_rand($types)],
                        'amount' => rand(200, 2500),
                        'date' => Carbon::now()->subDays(rand(1, 60))->format('Y-m-d'),
                        'reason' => $funnyReasons[array_rand($funnyReasons)],
                        'recorded_by_id' => $admin->id
                    ]);
                }
            }
        }
    }
}
