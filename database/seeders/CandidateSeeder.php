<?php

namespace Database\Seeders;

use App\Models\Candidate;
use App\Models\Media;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;

class CandidateSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::inRandomOrder()->take(15)->get();
        
        $positions = [
            'Software Engineer',
            'Project Manager',
            'UI/UX Designer',
            'QA Analyst',
            'DevOps Engineer',
            'Backend Developer',
            'Frontend Developer',
        ];

        $coverLetterLines = [
            'I am excited to apply for this role.',
            'With my experience, I believe I can contribute significantly.',
            'Please find my resume attached.',
            'Looking forward to the opportunity to work with your team.',
            'I am passionate about delivering high-quality solutions.',
        ];

        $cvFileNames = [
            'john_doe_resume.pdf',
            'software_engineer_cv.pdf',
            'application_document.pdf',
            'professional_profile.pdf',
            'career_portfolio.pdf',
        ];

        foreach ($users as $user) {
            $candidate = Candidate::create([
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone ?? $this->generateRandomPhone(),
                'position_applied' => Arr::random($positions),
                'cover_letters' => Arr::random($coverLetterLines),
                'status' => Arr::random(['pending', 'under_review', 'active', 'accepted', 'declined']),
            ]);

            // Create associated CV/media
            Media::create([
                'user_id' => null,
                'file_path' => 'candidates/cvs/' . Arr::random($cvFileNames),
                'category' => 'cv',
                'model_type' => 'App\Models\Candidate',
                'model_id' => $candidate->id,
            ]);
        }
    }

    private function generateRandomPhone(): string
    {
        return '+1' . rand(200, 999) . rand(100, 999) . rand(1000, 9999);
    }
}