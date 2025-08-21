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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('project_title')->nullable();
            $table->text('project_address')->nullable();
            $table->foreignId('client_id')->nullable()->constrained('clients')->cascadeOnUpdate()->nullOnDelete();
            $table->string('project_pricing')->nullable();
            $table->string('project_area')->nullable();
            $table->enum('project_construction_type', ['commercial', 'residential'])->nullable();
            $table->string('project_line_items_pricing')->nullable();
            $table->string('project_floor_number')->nullable();
            // Scope
            $table->text('project_main_scope')->nullable();
            $table->text('project_scope_details')->nullable();
            $table->string('project_template')->nullable();
            // Links  
            $table->text('project_init_link')->nullable(); // Initial link for the project, by supervisor or  ( or authorized users)
            $table->text('project_final_link')->nullable(); // final link for the project, by estimator or owner after completion ( or authorized users)

            // Notes
            $table->text('project_admin_notes')->nullable(); // Notes from project owner or supervisor ( or authorized users)
            $table->text('project_notes_estimator')->nullable(); // Notes from estimator ( or authorized users)
            $table->text('notes_private')->nullable(); // Private notes visible only to the project owner ( or authorized users)

            // Financials & Budgeting
            $table->decimal('budget_total', 10, 2)->nullable();        // Total budget set for the project by client or owner
            $table->decimal('deduction_amount', 10, 2)->nullable();    // Any manual deduction by client or owner

            // Project Due Dates
            $table->date('project_due_date')->nullable();      // When the project is expected to be completed (due date)
            // Points 
            $table->string('project_points')->nullable();     // project points, can be used for rating or feedback
            
            // Status and Visibility
            $table->enum('project_status',['Planned','Pending','Takeoff On Progress','Pricing On Progress','Completed','Hold','Revision', 'Cancelled','Deliver'])->default('Pending');
            $table->enum('project_source',['InSource','OutSource'])->default('InSource');
            $table->enum('preview_status',['active','draft'])->default('active');

            $table->timestamps();
            $table->softDeletesTz('deleted_at', precision: 0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};