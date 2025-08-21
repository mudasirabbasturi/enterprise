<?php

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
    Schema::create('departments', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->foreignId('branch_id')->nullable()->constrained('branches')->cascadeOnUpdate()->nullOnDelete();
        $table->string('email')->nullable();
        $table->string('phone')->nullable();
        $table->string('fax')->nullable();
        $table->text('notes')->nullable();
        $table->timestamps();
        $table->softDeletesTz('deleted_at', precision: 0);
    });
    Schema::create('designations', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->foreignId('department_id')->nullable()->constrained('departments')->cascadeOnUpdate()->nullOnDelete();
        $table->text('notes')->nullable(); // Any notes or extra info
        $table->timestamps();
        $table->softDeletesTz('deleted_at', precision: 0);
    });
    Schema::create('shifts', function (Blueprint $table) {
        $table->id();
        $table->string('name'); // e.g., "Morning", "Night"
        $table->time('start_time'); // Shift start time
        $table->time('end_time'); // Shift end time
        $table->integer('grace_period')->nullable(); // Minutes allowed for late arrival
        $table->integer('break_duration')->nullable(); // Break in minutes (e.g., 60)
        $table->time('break_duration_start_at')->nullable();
        $table->text('notes')->nullable(); // Any notes or extra info
        $table->boolean('is_active')->default(true); // Toggle active/inactive
        $table->timestamps();
        $table->softDeletesTz('deleted_at', precision: 0);
    });
    Schema::create('user_shift_shedules', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained('users')->cascadeOnUpdate()->cascadeOnDelete();
        $table->foreignId('shift_id')->nullable()->constrained('shifts')->cascadeOnUpdate()->nullOnDelete();
        $table->enum('day', ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
        $table->time('start_time');
        $table->time('end_time');
        $table->integer('duration')->default(30);
        $table->boolean('is_available')->default(true);
        $table->text('notes')->nullable(); // Any notes or extra info
        $table->timestamps();
        $table->softDeletesTz('deleted_at', precision: 0);
    });
    Schema::create('user_allowed_ips', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained('users')->cascadeOnUpdate()->cascadeOnDelete();
        $table->ipAddress('ip_address');
        $table->text('notes')->nullable(); // Any notes or extra info
        $table->timestamps();
        $table->softDeletesTz('deleted_at', precision: 0);
    });
    Schema::create('user_attendances', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained('users')->cascadeOnUpdate()->cascadeOnDelete();
        $table->date('date');
        $table->time('check_in')->nullable();
        $table->time('check_out')->nullable();
        $table->decimal('overtime_hours', 3, 2)->nullable();
        $table->ipAddress('check_in_ip')->nullable();
        $table->ipAddress('check_out_ip')->nullable();
        $table->string('status')->default('no action'); // present, late, absent, no action
        $table->text('notes')->nullable(); // Any notes or extra info
        $table->timestamps();
        $table->softDeletesTz('deleted_at', precision: 0);
    });
    Schema::create('candidates', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->string('email')->unique();
        $table->string('phone')->nullable();
        $table->string('position_applied')->nullable();
        $table->text('cover_letters')->nullable();
        $table->enum('status', [
            'pending',        // Just applied
            'under_review',   // Being reviewed
            'on_hold',        // Waiting, might consider later
            'active',         // CV is active in system, not rejected
            'accepted',       // Hired
            'declined',       // Rejected
            'draft',          // Application not submitted fully
            'future_consideration', // Not now, but maybe later
        ])->default('pending');
        $table->enum('job_letter', [
                'draft',      // Created but not finalized or sent yet
                'sent',       // Sent to the candidate
                'accepted',   // Candidate accepted the job offer
                'declined',   // Candidate declined the job offer
                'pending',   //  when application is pending just applied
            ])->default('pending');
        $table->date('job_letter_issue_date')->nullable();
        $table->timestamps();
        $table->softDeletesTz('deleted_at', precision: 0);
    });

    Schema::create('clients', function (Blueprint $table) {
        $table->id();
        $table->string('title')->nullable();
        $table->string('name')->nullable();
        $table->string('email')->unique();
        $table->string('phone')->nullable()->unique();
        $table->text('notes')->nullable();
        $table->timestamps();
        $table->softDeletesTz('deleted_at', precision: 0);
    });

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

    Schema::create('project_team_members', function (Blueprint $table) {
        $table->id();
        $table->foreignId('project_id')->constrained('projects')->cascadeOnUpdate()->cascadeOnDelete();
        $table->foreignId('user_id')->constrained('users')->cascadeOnUpdate()->cascadeOnDelete();
        $table->json('steps')->nullable();
        $table->date('started_at')->nullable();
        $table->date('completed_at')->nullable();
        $table->enum('status',['in_progress','completed','on_hold','needs_review'])->default('in_progress');
        $table->string('points_gain')->nullable();
        $table->text('notes')->nullable();
        $table->timestamps();
        $table->softDeletesTz('deleted_at', precision: 0);
    });
    Schema::create('media', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnUpdate()->nullOnDelete();
        $table->string('file_path');
        $table->string('category')->nullable(); // 'resume', 'profile_picture', 'id_card_front', 'id_card_back', 'cv' etc.
        // Add polymorphic columns
        $table->string('model_type')->nullable(); // e.g., 'App\Models\Project'
        $table->unsignedBigInteger('model_id')->nullable(); // ID of related model
        $table->timestamps();
        // Index for polymorphic relationship efficiency
        $table->index(['model_type', 'model_id']);
        $table->timestamps();
    });
    Schema::create('roles', function (Blueprint $table) {
        $table->id();
        $table->string('name')->unique(); // e.g. 'estimator', 'admin'
        $table->text('notes')->nullable();
        $table->timestamps();
    });
    Schema::create('permissions', function (Blueprint $table) {
        $table->id();
        $table->string('model'); // e.g. 'Project or User or Client'
        $table->string('type'); // e.g. route or colunm name => project_title
        $table->string('name')->unique(); // e.g. 'Add Project'
        $table->text('notes')->nullable();
        $table->timestamps();
    });
    Schema::create('role_permission', function (Blueprint $table) {
        $table->foreignId('role_id')->constrained()->onDelete('cascade');
        $table->foreignId('permission_id')->constrained()->onDelete('cascade');
        $table->primary(['role_id', 'permission_id']);
        $table->timestamps();
    });