<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Branch extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'name',
        'is_main',
        'code',
        'type',
        'status',
        'email',
        'phone',
        'fax',
        'country',
        'state',
        'city',
        'address',
        'postal_zip_code',
        'notes',
    ];
    protected $casts = [
        'is_main' => 'boolean',
    ];
    protected static function booted()
    {
        static::creating(function ($branch) {
            $branch->code = $branch->generateBranchCode();
        });
    }

    public function generateBranchCode()
    {
       return 'BR-' . now()->format('Ymd-His');
    }

    public function departments(): HasMany {
        return $this->hasMany(Department::class);
    }

    public function users(): HasMany {
        return $this->hasMany(User::class);
    }

}