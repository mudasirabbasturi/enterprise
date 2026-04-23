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
        Schema::create('project_team_members', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->unsignedBigInteger('user_id');
            // longtext json with validation in MySQL → use json column in Laravel
            $table->json('steps')->nullable();
            $table->date('started_at')->nullable();
            $table->date('completed_at')->nullable();
            $table->enum('status', [
                'in_progress',
                'completed',
                'on_hold',
                'needs_review'
            ])->default('in_progress');
            $table->text('notes')->nullable();
            // original was varchar(255) default '0'
            $table->string('points_gain')->default('0');
            $table->timestamps();
            $table->softDeletes();
            // indexes
            $table->index('project_id');
            $table->index('user_id');
            $table->index('status');
            // foreign keys (recommended)
            $table->foreign('project_id')
                ->references('id')
                ->on('projects')
                ->cascadeOnDelete();

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_team_members');
    }
};
