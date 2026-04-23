<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Authenticatable
{
    use HasFactory, Notifiable;
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'designation',
        'email_verified_at',
        'country',
        'state',
        'city',
        'postal_or_zip_code',
        'permanent_address',
        'current_address',
        'picture_path',
        'dob',
        'joining_date',
        'hiring_date',
        'leaving_date',
        'notes',
        'notes_private',
        'status',
        'is_online',
        'last_active_at',
        'reference_name',
        'reference__phone',
        'branch_id',
        'department_id',
        'designation_id',
        'role_id',
        'is_permission_granted',
        'ip_restriction',
    ];

    protected $guarded = ['employee_id'];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_permission_granted' => 'boolean',
            'ip_restriction' => 'boolean',
        ];
    }

    // protected static function booted(): void
    // {
    //     static::creating(function (User $user) {
    //         $nextNumber = (static::max('id') ?? 0) + 1;
    //         $padTo = $nextNumber > 9_999 ? 5 : 4;
    //         $user->employee_id = 'report#' . str_pad($nextNumber, $padTo, '0', STR_PAD_LEFT);
    //     });
    // }

    public function media(): HasMany
    {
        return $this->hasMany(Media::class);
    }

    public function projectTeamMembers(): HasMany
    {
        return $this->hasMany(ProjectTeamMember::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function designation(): BelongsTo
    {
        return $this->belongsTo(Designation::class);
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }
    
    public function userAttendance(): HasMany {
        return $this->hasMany(UserAttendance::class);
    }

    public function userAllowedIp(): HasMany {
        return $this->hasMany(UserAllowedIp::class);
    }

    public function salary(): \Illuminate\Database\Eloquent\Relations\HasOne {
        return $this->hasOne(EmployeeSalary::class);
    }

    public function userShiftSchedules(): HasMany {
        return $this->hasMany(UserShiftSchedule::class);
    }

    public function userScreenshots(): HasMany {
        return $this->hasMany(UserScreenshot::class);
    }

    public function userActivities(): HasMany {
        return $this->hasMany(UserActivity::class);
    }
}
