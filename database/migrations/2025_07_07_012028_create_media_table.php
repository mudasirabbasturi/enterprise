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
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnUpdate()->nullOnDelete();
            $table->string('file_path');
            $table->string('category')->nullable(); // 'resume', 'profile_picture', 'id_card_front', 'id_card_back', 'cv'.
            // Add polymorphic columns
            $table->string('model_type')->nullable(); // e.g., 'App\Models\Project'
            $table->unsignedBigInteger('model_id')->nullable(); // ID of related model
            // Index for polymorphic relationship efficiency
            $table->index(['model_type', 'model_id']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media');
    }
};

/**
   $project = Project::find(1);
   $files = Media::where('model_type', 'App\Models\Project')
              ->where('model_id', $project->id)
              ->get();
**/