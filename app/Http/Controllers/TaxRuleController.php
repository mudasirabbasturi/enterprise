<?php

namespace App\Http\Controllers;

use App\Models\PayrollTaxRule;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TaxRuleController extends Controller
{
    public function index()
    {
        $taxRules = PayrollTaxRule::latest()->get();
        return Inertia::render('Pages/Payroll/TaxManagement', [
            'taxRules' => $taxRules
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'description' => 'nullable|string'
        ]);

        PayrollTaxRule::create($validated);
        return redirect()->back()->with('message', 'Tax rule created successfully.');
    }

    public function update(Request $request, $id)
    {
        $taxRule = PayrollTaxRule::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'description' => 'nullable|string'
        ]);

        $taxRule->update($validated);
        return redirect()->back()->with('message', 'Tax rule updated successfully.');
    }

    public function destroy($id)
    {
        $taxRule = PayrollTaxRule::findOrFail($id);
        $taxRule->delete();
        return redirect()->back()->with('message', 'Tax rule deleted successfully.');
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:payroll_tax_rules,id',
        ]);

        PayrollTaxRule::whereIn('id', $validated['ids'])->delete();
        return redirect()->back()->with('message', 'Selected tax rules deleted successfully.');
    }
}
