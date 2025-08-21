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
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "Morning", "Night"
            $table->time('start_time'); // Shift start time
            $table->time('end_time'); // Shift end time
            $table->integer('grace_period')->nullable(); // Minutes allowed for late arrival
            $table->integer('break_duration')->nullable(); // Break in minutes (e.g., 60)
            $table->time('break_duration_start_at')->nullable();
            $table->text('notes')->nullable(); // Any notes or extra info
            $table->boolean('is_active')->default(true); // Toggle active/inactive
            $table->timestamps();
            $table->softDeletesTz('deleted_at', precision: 0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shifts');
    }
};
