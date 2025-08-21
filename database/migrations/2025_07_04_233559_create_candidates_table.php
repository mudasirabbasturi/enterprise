<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('candidates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('position_applied')->nullable();
            $table->text('cover_letters')->nullable();
            $table->enum('status', [
                'pending',        // Just applied
                'under_review',   // Being reviewed
                'on_hold',        // Waiting, might consider later
                'active',         // CV is active in system, not rejected
                'accepted',       // Hired
                'declined',       // Rejected
                'draft',          // Application not submitted fully
                'future_consideration', // Not now, but maybe later
            ])->default('pending');
            $table->enum('job_letter', [
                    'draft',      // Created but not finalized or sent yet
                    'sent',       // Sent to the candidate
                    'accepted',   // Candidate accepted the job offer
                    'declined',   // Candidate declined the job offer
                    'pending',   //  when application is pending Just applied
                ])->default('pending');
            $table->date('job_letter_issue_date')->nullable();
            $table->timestamps();
            $table->softDeletesTz('deleted_at', precision: 0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('candidates');
    }
};
