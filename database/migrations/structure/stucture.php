<?php 

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

Schema::create('shifts', function (Blueprint $table) {
    $table->id();
    $table->string('name'); // e.g., "Morning", "Night"
    $table->text('notes')->nullable(); // Any notes or extra info
    $table->boolean('is_active')->default(true); // Toggle active/inactive
    $table->timestamps();
    $table->softDeletesTz('deleted_at', precision: 0);
});

Schema::create('user_statuses', function (Blueprint $table) {
    $table->id();
    $table->string('label'); // e.g., 'pending', 'active', 'inactive'
    $table->text('notes')->nullable();
    $table->timestamps();
});



Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email')->unique();
    $table->timestamp('email_verified_at')->nullable();

    $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete()->cascadeOnUpdate();
    $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete()->cascadeOnUpdate();
    $table->foreignId('designation_id')->nullable()->constrained('designations')->nullOnDelete()->cascadeOnUpdate();

    $table->foreignId('status_id')->nullable()->constrained('user_statuses')->nullOnDelete()->cascadeOnUpdate();

    $table->date('dob')->nullable();
    $table->date('joining_date')->nullable();
    $table->date('hiring_date')->nullable();
    $table->date('leaving_date')->nullable();

    $table->timestamps();
    $table->softDeletesTz('deleted_at', 0);
});

Schema::create('user_roles', function (Blueprint $table) {
    $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
    $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
    $table->primary(['user_id', 'role_id']); // composite primary key
    $table->timestamps();
});

Schema::create('user_contacts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
    // what type of contact this is
    $table->string('type', 50); 
    // examples: phone, email, whatsapp, instagram, facebook
    // actual value
    $table->text('value')->nullable();
    // can store phone, email, URL, anything
    $table->timestamps();
});

Schema::create('user_addresses', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
    $table->enum('type', ['permanent', 'current']);
    $table->string('country')->nullable();
    $table->string('state')->nullable();
    $table->string('city')->nullable();
    $table->string('postal_zip_code')->nullable();
    $table->text('address')->nullable();
    $table->timestamps();
});


Schema::create('user_references', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
    $table->string('name')->nullable();
    $table->string('phone')->nullable();
    $table->string('relation')->nullable(); // e.g., father, friend
    $table->timestamps();
});

Schema::create('user_banks', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('users')->cascadeOnDelete(); // linked to user
    $table->enum('type', ['bank', 'mobile_wallet'])->default('bank'); // account type: bank or mobile wallet
    $table->string('bank_name')->nullable(); // bank name (if type = bank)
    $table->string('account_number')->nullable(); // account number or mobile number
    $table->string('iban')->nullable(); // optional, mainly for banks

    $table->timestamps();
});


Schema::create('media', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('users')->cascadeOnDelete()->cascadeOnUpdate();
    $table->string('file_path');
    $table->string('category')->nullable(); // e.g., 'profile', 'resume'
    $table->timestamps();
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

// leave management 

Schema::create('leave_types', function (Blueprint $table) {
    $table->id();

    $table->string('name');
    $table->string('code')->unique();
    $table->string('color')->nullable();

    $table->boolean('is_paid')->default(true);
    $table->boolean('is_carry_forward')->default(false);

    $table->integer('max_per_year')->nullable();
    $table->boolean('allow_half_day')->default(true);

    $table->timestamps();
    $table->softDeletes();
});

Schema::create('leave_policies', function (Blueprint $table) {
    $table->id();

    $table->foreignId('leave_type_id')->constrained()->cascadeOnDelete();

    $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('designation_id')->nullable()->constrained()->nullOnDelete();

    $table->integer('days_per_year');
    $table->integer('max_per_month')->nullable();

    $table->boolean('requires_approval')->default(true);
    $table->boolean('allow_half_day')->default(true);

    $table->timestamps();
});

Schema::create('leave_balances', function (Blueprint $table) {
    $table->id();

    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('leave_type_id')->constrained()->cascadeOnDelete();

    $table->year('year');

    $table->decimal('allocated', 5, 2)->default(0);
    $table->decimal('used', 5, 2)->default(0);
    $table->decimal('pending', 5, 2)->default(0);
    $table->decimal('remaining', 5, 2)->default(0);

    $table->timestamps();

    $table->unique(['user_id', 'leave_type_id', 'year']);
});

Schema::create('leave_requests', function (Blueprint $table) {
    $table->id();

    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('leave_type_id')->constrained()->cascadeOnDelete();

    $table->date('start_date');
    $table->date('end_date');

    $table->decimal('total_days', 5, 2);

    $table->boolean('is_half_day')->default(false);
    $table->enum('half_day_type', ['first_half', 'second_half'])->nullable();

    $table->text('reason')->nullable();

    $table->foreignId('attachment_media_id')->nullable()->constrained('media')->nullOnDelete();

    $table->enum('status', [
        'pending',
        'approved',
        'rejected',
        'cancelled'
    ])->default('pending');

    $table->timestamp('approved_at')->nullable();
    $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();

    $table->text('rejection_reason')->nullable();

    $table->timestamps();
    $table->softDeletes();
});

Schema::create('leave_approvals', function (Blueprint $table) {
    $table->id();

    $table->foreignId('leave_request_id')->constrained()->cascadeOnDelete();
    $table->foreignId('approver_user_id')->constrained('users')->cascadeOnDelete();

    $table->integer('level'); // 1,2,3 approval chain

    $table->enum('status', [
        'pending',
        'approved',
        'rejected'
    ])->default('pending');

    $table->timestamp('action_at')->nullable();
    $table->text('notes')->nullable();

    $table->timestamps();
});

Schema::create('holidays', function (Blueprint $table) {
    $table->id();

    $table->string('title');
    $table->date('date');

    $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();

    $table->timestamps();
});

