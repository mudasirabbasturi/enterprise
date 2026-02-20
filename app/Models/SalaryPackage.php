<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalaryPackage extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'base_salary', 'currency'];

    public function allowances()
    {
        return $this->hasMany(SalaryAllowance::class, 'package_id');
    }

    public function taxRules()
    {
        return $this->belongsToMany(PayrollTaxRule::class, 'package_tax_rules', 'package_id', 'tax_rule_id');
    }

    public function assignments()
    {
        return $this->hasMany(EmployeeSalary::class, 'package_id');
    }
}
