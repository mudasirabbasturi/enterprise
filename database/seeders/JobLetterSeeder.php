<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Candidate;
use App\Models\JobLetter;
use Illuminate\Support\Str;
use Illuminate\Support\Arr;
use Carbon\Carbon;

class JobLetterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $statuses = ['draft', 'sent', 'accepted', 'declined'];
        $bodySamples = [
            "We are pleased to offer you the position at our company. Please find the terms and conditions attached.",
            "Congratulations! This letter confirms our offer for the role you applied for.",
            "Attached is your job offer letter. Kindly review and respond within the next 5 business days.",
            "Welcome to the team! We look forward to working with you.",
        ];

        // Pick 10 to 20 candidates to generate job letters for
        $candidates = Candidate::inRandomOrder()->take(rand(10, 20))->get();

        foreach ($candidates as $candidate) {
            $position = $candidate->position_applied ?? Arr::random([
                'Software Engineer', 'Project Manager', 'HR Assistant',
            ]);

            $issueDate = Carbon::now()->subDays(rand(1, 30));

            JobLetter::create([
                'candidate_id' => $candidate->id,
                'title'        => 'Job Offer Letter',
                'issue_date'   => $issueDate->toDateString(),
                'position'     => $position,
                'body'         => Arr::random($bodySamples),
                'pdf_path'     => 'job_letters/' . Str::slug($candidate->name) . '.pdf',
                'status'       => Arr::random($statuses),
                'notes'        => 'Auto-generated for testing purposes.',
            ]);
        }
    }
}
