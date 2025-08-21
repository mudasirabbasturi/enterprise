<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class RolePermission extends Model
{
    protected $fillable = [
    'role_id',
    'permission_id',
    ];

}
