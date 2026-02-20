<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollTaxRule extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'type', 'value', 'description'];

    public function packages()
    {
        return $this->belongsToMany(SalaryPackage::class, 'package_tax_rules', 'tax_rule_id', 'package_id');
    }
}
