<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        // 1. Chat Groups
        Schema::create('chat_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('avatar')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });

        // 2. Chat Group Membership (Pivot)
        Schema::create('chat_group_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_group_id')->constrained('chat_groups')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('role')->default('member'); // member, admin
            $table->timestamps();
        });

        // 3. Global Messages (Handles both 1-to-1 and Groups)
        Schema::create('global_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
            
            // For 1-to-1: receiver_id is set, group_id is null
            $table->foreignId('receiver_id')->nullable()->constrained('users')->onDelete('cascade');
            
            // For Groups: group_id is set, receiver_id is null
            $table->foreignId('group_id')->nullable()->constrained('chat_groups')->onDelete('cascade');
            
            $table->text('message')->nullable();
            $table->string('file_path')->nullable();
            $table->string('file_type')->nullable();
            $table->boolean('is_read')->default(false);
            $table->foreignId('reply_to_id')->nullable()->constrained('global_messages')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('global_messages');
        Schema::dropIfExists('chat_group_user');
        Schema::dropIfExists('chat_groups');
    }
};
