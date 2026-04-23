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
        Schema::dropIfExists('user_activities');
        Schema::create('user_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('app_name')->nullable();
            $table->string('window_title')->nullable();
            $table->integer('clicks')->default(0);
            $table->integer('keystrokes')->default(0);
            $table->boolean('is_idle')->default(false);
            $table->timestamp('tracked_at');
            $table->timestamps();
            
            $table->index(['user_id', 'tracked_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_activities');
    }
};
