<?php

namespace App\Http\Controllers;

use App\Models\SalaryPackage;
use App\Models\PayrollTaxRule;
use App\Models\SalaryAllowance;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalaryPackageController extends Controller
{
    public function index()
    {
        $packages = SalaryPackage::with(['allowances', 'taxRules'])->latest()->get();
        $taxRules = PayrollTaxRule::all();
        
        return Inertia::render('Pages/Payroll/SalaryPackages', [
            'packages' => $packages,
            'taxRules' => $taxRules
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'base_salary' => 'required|numeric|min:0',
            'currency' => 'required|string|max:5',
            'allowances' => 'array',
            'allowances.*.label' => 'required|string',
            'allowances.*.amount' => 'required|numeric|min:0',
            'tax_ids' => 'array',
            'tax_ids.*' => 'exists:payroll_tax_rules,id'
        ]);

        $package = SalaryPackage::create([
            'name' => $validated['name'],
            'base_salary' => $validated['base_salary'],
            'currency' => $validated['currency'],
        ]);

        if (!empty($validated['allowances'])) {
            foreach ($validated['allowances'] as $allowance) {
                $package->allowances()->create($allowance);
            }
        }

        if (!empty($validated['tax_ids'])) {
            $package->taxRules()->sync($validated['tax_ids']);
        }

        return redirect()->back()->with('message', 'Salary package created successfully.');
    }

    public function update(Request $request, $id)
    {
        $package = SalaryPackage::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'base_salary' => 'required|numeric|min:0',
            'currency' => 'required|string|max:5',
            'allowances' => 'array',
            'allowances.*.label' => 'required|string',
            'allowances.*.amount' => 'required|numeric|min:0',
            'tax_ids' => 'array',
            'tax_ids.*' => 'exists:payroll_tax_rules,id'
        ]);

        $package->update([
            'name' => $validated['name'],
            'base_salary' => $validated['base_salary'],
            'currency' => $validated['currency'],
        ]);

        // Refresh allowances
        $package->allowances()->delete();
        if (!empty($validated['allowances'])) {
            foreach ($validated['allowances'] as $allowance) {
                $package->allowances()->create($allowance);
            }
        }

        if (isset($validated['tax_ids'])) {
            $package->taxRules()->sync($validated['tax_ids']);
        }

        return redirect()->back()->with('message', 'Salary package updated successfully.');
    }

    public function destroy($id)
    {
        $package = SalaryPackage::findOrFail($id);
        $package->delete();
        return redirect()->back()->with('message', 'Salary package deleted successfully.');
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:salary_packages,id',
        ]);

        SalaryPackage::whereIn('id', $validated['ids'])->delete();
        return redirect()->back()->with('message', 'Selected salary packages deleted successfully.');
    }
}
