<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Project;
use App\Models\User;
use App\Models\ProjectTeamMember;
use Illuminate\Support\Arr;
use Carbon\Carbon;

class ProjectTeamMemberSeeder extends Seeder
{
    public function run(): void
    {
        $stepsList = [
            'Marking,Quality Assurance,Pricing',
            'Excel Sheet,Pricing,Quality Assurance',
            'Pricing,Marking,Quality Assurance',
            'Quality Assurance,Marking,Pricing,Excel Sheet',
            'Quality Assurance,Marking',
            'Marking,Excel Sheet',
            'Pricing,Quality Assurance',
        ];
        $projects = Project::all();
        $users = User::all();
        foreach ($projects as $project) {
            $teamUsers = $users->random(rand(1, 3));
            $remainingPoints = $project->project_points ?? 0;
            $memberCount = $teamUsers->count();
            if ($remainingPoints == 0) continue;
            $weights = [];
            for ($i = 0; $i < $memberCount; $i++) {
                $weights[] = rand(1, 100);
            }
            $weightSum = array_sum($weights);
            $i = 0;
            foreach ($teamUsers as $user) {
                $stepsRaw = Arr::random($stepsList);
                $steps = array_map('trim', explode(',', $stepsRaw));
                $startedAt = Carbon::now()->subDays(rand(10, 60));
                $completed = rand(0, 1) === 1;
                $completedAt = $completed ? (clone $startedAt)->addDays(rand(3, 15)) : null;
                $duration = $completedAt ? $startedAt->diffInDays($completedAt) . ' days' : null;
                $status = $completed ? 'completed' : 'in_progress';
                $points = ($i == $memberCount - 1)
                    ? $remainingPoints 
                    : intval(round(($weights[$i] / $weightSum) * $project->project_points));
                $points = min($points, $remainingPoints);
                $remainingPoints -= $points;
                ProjectTeamMember::create([
                    'project_id' => $project->id,
                    'user_id' => $user->id,
                    'steps' => json_encode($steps),
                    'started_at' => $startedAt->toDateString(),
                    'completed_at' => $completedAt?->toDateString(),
                    'duration' => $duration,
                    'status' => $status,
                    'points_gain' => $points,
                    'notes' => 'Assigned via auto seeder',
                ]);
                $i++;
                if ($remainingPoints <= 0) break;
            }
        }
    }
}
