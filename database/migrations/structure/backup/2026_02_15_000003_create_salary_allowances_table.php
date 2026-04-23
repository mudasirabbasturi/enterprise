<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('salary_allowances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('package_id')->constrained('salary_packages')->onDelete('cascade');
            $table->string('label');
            $table->decimal('amount', 15, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('salary_allowances');
    }
};
