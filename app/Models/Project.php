<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;


class Project extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'project_title',
        'project_address',
        'client_id',
        'project_pricing',
        'project_area',
        'project_construction_type',
        'project_line_items_pricing',
        'project_floor_number',
        'project_main_scope',
        'project_scope_details',
        'project_template',
        'project_init_link',
        'project_final_link',
        'project_admin_notes',
        'project_notes_estimator',
        'notes_private',
        'budget_total',
        'deduction_amount',
        'project_due_date',
        'project_points',
        'project_status',
        'project_source',
        'preview_status',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
    
    public function projectTeamMembers(): HasMany
    {
        return $this->hasMany(ProjectTeamMember::class);
    }

    public function media()
    {
        return $this->morphMany(Media::class, 'model');
    }
}
