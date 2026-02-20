<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('package_tax_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('package_id')->constrained('salary_packages')->onDelete('cascade');
            $table->foreignId('tax_rule_id')->constrained('payroll_tax_rules')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('package_tax_rules');
    }
};
