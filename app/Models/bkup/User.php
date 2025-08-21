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
        'branch_id',
        'department_id',
        'designation_id',
        'role_id',
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
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (User $user) {
            $nextNumber = (static::max('id') ?? 0) + 1;
            $padTo = $nextNumber > 9_999 ? 5 : 4;
            $user->employee_id = 'report#' . str_pad($nextNumber, $padTo, '0', STR_PAD_LEFT);
        });
    }

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


    // public function hasPermission(string $model, string $permissionName): bool
    // {
    //     if (!$this->role) {
    //         return false;
    //     }

    //     return $this->role->permissions()
    //         ->where('model', $model)
    //         ->where('name', $permissionName)
    //         ->exists();
    // }

    // public function hasPermissionFor(string $model, string $type = 'route'): bool
    // {
    //     if (!$this->role) {
    //         return false;
    //     }

    //     return $this->role->permissions()
    //         ->where('model', $model)
    //         ->where('type', $type)
    //         ->exists();
    // }

    // public function getPermissionsFor(string $model, string $type = null): \Illuminate\Support\Collection
    // {
    //     if (!$this->role) {
    //         return collect();
    //     }

    //     $query = $this->role->permissions()->where('model', $model);
        
    //     if ($type) {
    //         $query->where('type', $type);
    //     }

    //     return $query->pluck('name');
    // }

      public function userAttendance(): HasMany {
        return $this->hasMany(UserAttendance::class);
    }
}
