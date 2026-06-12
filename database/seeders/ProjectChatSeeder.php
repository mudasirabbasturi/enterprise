<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProjectChatSeeder extends Seeder
{
    public function run(): void
    {
        $projects = DB::table('projects')
            ->select('id')
            ->latest('id')
            ->limit(300)
            ->get();

        foreach ($projects as $project) {

            $members = DB::table('project_team_members')
                ->where('project_id', $project->id)
                ->pluck('user_id')
                ->toArray();

            if (count($members) < 2) {
                continue;
            }

            $messageCount = rand(300, 1500);

            $messages = [];

            $currentTime = now()->subDays(rand(10, 60));

            for ($i = 0; $i < $messageCount; $i++) {

                $currentTime = (clone $currentTime)
                    ->addMinutes(rand(1, 120));

                $messages[] = [
                    'project_id' => $project->id,
                    'user_id' => $members[array_rand($members)],
                    'message' => $this->randomMessage(),
                    'created_at' => $currentTime,
                    'updated_at' => $currentTime,
                ];
            }

            DB::table('project_chats')->insert($messages);
        }
    }

    private function randomMessage(): string
    {
        static $messages = null;

        if ($messages === null) {
            $messages = array_merge(
                $this->takeoffMessages(),
                $this->pricingMessages(),
                $this->clientMessages(),
                $this->internalMessages(),
                $this->casualMessages()
            );
        }

        return fake()->randomElement($messages);
    }

    private function takeoffMessages(): array
    {
        return [
            'Finished concrete takeoff for Level 1.',
            'Working on drywall quantities.',
            'Checking ceiling quantities now.',
            'Please verify wall measurements.',
            'Uploaded the quantity sheet.',
            'Updated takeoff spreadsheet is available.',
            'Need clarification on drawing A102.',
            'Completed roofing quantities.',
            'Reviewing revision 3 plans.',
            'Floor area calculations updated.',
            'Door schedule quantities completed.',
            'Checking structural dimensions.',
            'MEP quantities are still pending.',
            'Concrete quantities have been revised.',
            'Please confirm room finish counts.',
            'Wall finish takeoff completed.',
            'Reviewing latest architectural drawings.',
            'Updated material quantities uploaded.',
            'Found a discrepancy in dimensions.',
            'Need confirmation on slab thickness.',
        ];
    }

    private function pricingMessages(): array
    {
        return [
            'Supplier quote received.',
            'Steel prices increased this week.',
            'Updated estimate uploaded.',
            'Waiting for subcontractor pricing.',
            'Electrical pricing still pending.',
            'Mechanical vendor quote received.',
            'Budget exceeds target by 5%.',
            'Material pricing updated.',
            'Need labor cost verification.',
            'Received revised supplier quotation.',
            'Concrete pricing updated.',
            'Can someone review unit rates?',
            'Markup adjustments completed.',
            'Final estimate ready for review.',
            'Pricing spreadsheet uploaded.',
            'Need approval before submission.',
            'Budget variance report attached.',
            'Vendor confirmed delivery costs.',
            'Updated cost breakdown uploaded.',
            'Awaiting final supplier response.',
        ];
    }

    private function clientMessages(): array
    {
        return [
            'Client approved the revision.',
            'Client requested additional changes.',
            'Meeting scheduled for tomorrow.',
            'Awaiting client feedback.',
            'Client sent updated drawings.',
            'Please review client comments.',
            'Proposal has been submitted.',
            'Submission deadline moved.',
            'Client requested alternate pricing.',
            'Received RFI response.',
            'Client approved pricing package.',
            'Need response before EOD.',
            'Updated bid documents uploaded.',
            'Client meeting notes shared.',
            'Client requested clarification.',
            'Revision request received.',
            'Awaiting project approval.',
            'Scope changes received from client.',
            'Client confirmed requirements.',
            'Submission package completed.',
        ];
    }

    private function internalMessages(): array
    {
        return [
            'Looks good from my side.',
            'Please review before submission.',
            'Working on it now.',
            'I will handle this today.',
            'Review completed.',
            'Ready for QA review.',
            'Can someone verify this?',
            'Everything looks correct.',
            'Need one final check.',
            'Please upload the latest version.',
            'I have addressed all comments.',
            'Ready for client delivery.',
            'Let\'s finalize this today.',
            'Will update shortly.',
            'Can we close this item?',
            'Task completed.',
            'Issue resolved.',
            'Reviewing now.',
            'Please confirm.',
            'Thanks for the update.',
        ];
    }

    private function casualMessages(): array
    {
        return [
            'Good morning team.',
            'Morning everyone.',
            'Thanks.',
            'Perfect.',
            'Great work.',
            'Received.',
            'Understood.',
            'Uploading now.',
            'Done.',
            'Noted.',
            'Looks good.',
            'Checking now.',
            'Will update soon.',
            'Got it.',
            'Okay.',
            'Agreed.',
            'Sounds good.',
            'Thank you.',
            'Appreciate it.',
            'Let me verify.',
        ];
    }
}