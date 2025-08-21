<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Department extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'name',
        'branch_id',
        'email',
        'phone',
        'fax',
        'notes',
    ];


    public function designations(): HasMany
    {
        return $this->hasMany(Designation::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function branch(): BelongsTo {
        return $this->belongsTo(Branch::class);
    }
}
