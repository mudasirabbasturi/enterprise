<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Media extends Model
{
    protected $fillable = [
        "user_id",
        "file_path",
        "category", // profile,job_application,other....
        "model_type",
        "model_id",
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

}
