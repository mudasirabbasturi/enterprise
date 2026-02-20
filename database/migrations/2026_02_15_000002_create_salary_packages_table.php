<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('salary_packages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('base_salary', 15, 2);
            $table->string('currency', 5)->default('PKR');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('salary_packages');
    }
};
