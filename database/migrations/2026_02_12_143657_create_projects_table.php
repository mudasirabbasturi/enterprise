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

            $table->text('project_title')->nullable();
            $table->text('project_address')->nullable();
            $table->string('client_name_for_admin')->nullable();
            $table->unsignedBigInteger('client_id')->nullable();
            $table->string('project_pricing')->nullable();
            $table->string('project_area')->nullable();

            $table->enum('project_construction_type', ['commercial','residential'])->nullable();

            $table->string('project_line_items_pricing')->nullable();
            $table->string('project_floor_number')->nullable();

            $table->text('project_main_scope')->nullable();
            $table->text('project_scope_details')->nullable();

            $table->string('project_template')->nullable();
            $table->text('project_init_link')->nullable();
            $table->text('project_final_link')->nullable();

            $table->text('project_admin_notes')->nullable();
            $table->text('project_notes_estimator')->nullable();
            $table->text('notes_private')->nullable();

            $table->decimal('budget_total', 10, 2)->nullable();
            $table->decimal('deduction_amount', 10, 2)->nullable();

            $table->date('project_due_date')->nullable();
            $table->integer('project_points')->nullable();

            $table->enum('project_status', [
                'Planned',
                'Pending',
                'Takeoff On Progress',
                'Pricing On Progress',
                'Completed',
                'Hold',
                'Revision',
                'Cancelled',
                'Deliver'
            ])->default('Pending');

            $table->enum('project_source', ['InSource','OutSource'])->nullable();

            $table->enum('preview_status', ['active','draft'])->default('active');

            $table->boolean('late')->default(false);

            $table->timestamps();
            $table->softDeletes();
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
