<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProjectRating;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Str;

class ProjectRatingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $projects = Project::pluck('id')->all();
        $users = User::pluck('id')->all();

        if (empty($projects) || empty($users)) {
            $this->command->warn('No projects or users found. Skipping ProjectRatingSeeder.');
            return;
        }

        foreach ($projects as $projectId) {
            $userId = fake()->randomElement($users);

            ProjectRating::create([
                'project_id' => $projectId,
                'user_id' => $userId,
                'project_rating' => fake()->randomElement(['Excellent', 'Good', 'Average', 'Poor', 'Bad']),
                'project_feedback' => fake()->sentence(),
                'notes' => fake()->optional()->paragraph(),
            ]);
        }
    }
}
