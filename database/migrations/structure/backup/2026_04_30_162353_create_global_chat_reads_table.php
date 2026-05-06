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
        Schema::create('global_chat_reads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('receiver_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->foreignId('group_id')->nullable()->constrained('chat_groups')->onDelete('cascade');
            $table->timestamp('last_read_at');
            $table->timestamps();
            
            $table->index(['user_id', 'receiver_id']);
            $table->index(['user_id', 'group_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('global_chat_reads');
    }
};
