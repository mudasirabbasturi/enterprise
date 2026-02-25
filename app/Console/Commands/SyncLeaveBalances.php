<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SyncLeaveBalances extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'leave:sync-balances';

    protected $description = 'Synchronize all leave balances with existing leave requests';

    public function handle()
    {
        $balances = \App\Models\LeaveBalance::all();
        $this->info("Syncing {$balances->count()} leave balance records...");

        $bar = $this->output->createProgressBar($balances->count());
        $bar->start();

        foreach ($balances as $balance) {
            \App\Models\LeaveBalance::updateBalances(
                $balance->user_id,
                $balance->leave_type_id,
                $balance->year
            );
            $bar->advance();
        }

        $bar->finish();
        $this->info("\nAll leave balances synchronized successfully.");
    }
}
