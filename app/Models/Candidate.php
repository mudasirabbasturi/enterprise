<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Candidate extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        "name",
        "email",
        "phone",
        "position_applied",
        "cover_letters",
        "status",
        "job_letter",
        "job_letter_issue_date",
    ];

    protected $casts = [
        'job_letter_issue_date' => 'date',
    ];

    public function jobLetter(): HasOne
    {
        return $this->hasOne(JobLetter::class);
    }

    public function media(): MorphMany
    {
        return $this->morphMany(Media::class, 'model');
    }
}


