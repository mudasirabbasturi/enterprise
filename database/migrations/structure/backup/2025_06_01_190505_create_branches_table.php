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
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->boolean('is_main')->default(false); // Indicates if this branch is the main branch
            $table->string('code')->nullable(); // Unique code for the branch
            $table->string('type')->nullable(); // Type of branch (e.g., retail, warehouse, office)
            $table->string('status')->default('active'); // Status of the branch (active, inactive, closed)
            // Contact Detail
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('fax')->nullable();
            // Location info 
            $table->string('country')->nullable();
            $table->string('state')->nullable();
            $table->string('city')->nullable();
            $table->text('address')->nullable();
            $table->string('postal_zip_code')->nullable();
            $table->text('notes')->nullable(); // Any notes or extra info
            $table->timestamps();
            $table->softDeletesTz('deleted_at', precision: 0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('branches');
    }
};
