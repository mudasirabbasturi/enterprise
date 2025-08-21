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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            // Identity
            $table->string('employee_id')->unique();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('phone')->nullable();
            
            // Verification & Tokens
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            // Address Information
            $table->string('country')->nullable();
            $table->string('state')->nullable();
            $table->string('city')->nullable();
            $table->string('postal_or_zip_code')->nullable();
            $table->string('permanent_address')->nullable();
            $table->string('current_address')->nullable();
            // Profile
            $table->string('picture_path')->nullable();
            $table->date('dob')->nullable();
            // dates of joining, hiring, and leaving
            $table->date('joining_date')->nullable();
            $table->date('hiring_date')->nullable();
            $table->date('leaving_date')->nullable();
            // Notes 
            $table->text('notes')->nullable();
            $table->text('notes_private')->nullable();
            // Status
            $table->string('status')->default('active'); // 'active', 'inactive', 'suspended'
            // Timestamps
            $table->timestamps();
            $table->softDeletesTz('deleted_at', precision: 0);
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
