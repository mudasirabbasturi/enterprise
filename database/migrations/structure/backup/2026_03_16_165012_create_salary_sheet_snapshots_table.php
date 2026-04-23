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
        Schema::create('salary_sheet_snapshots', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('month');
            $table->unsignedInteger('year');
            $table->string('batch_id'); // Group identifier for a specific sheet generation
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->json('snapshot_data');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salary_sheet_snapshots');
    }
};
