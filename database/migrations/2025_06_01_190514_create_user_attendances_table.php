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
        Schema::create('user_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnUpdate()->cascadeOnDelete();
            $table->date('date');
            $table->time('check_in')->nullable();
            $table->time('check_out')->nullable();
            $table->ipAddress('check_in_ip')->nullable();
            $table->ipAddress('check_out_ip')->nullable();
            $table->enum('worked_from', ['home', 'office'])->default('office');
            $table->json('break')->nullable();
            $table->time('total_regular_hours')->nullable();
            $table->json('total_outside_hours')->nullable();
            $table->string('status')->default('no action'); // present, late, absent, manual, no action
            $table->text('notes')->nullable(); // Any notes or extra info
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_attendances');
    }
};
