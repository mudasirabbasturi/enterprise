<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalaryAllowance extends Model
{
    use HasFactory;

    protected $fillable = ['package_id', 'label', 'amount'];

    public function package()
    {
        return $this->belongsTo(SalaryPackage::class, 'package_id');
    }
}
