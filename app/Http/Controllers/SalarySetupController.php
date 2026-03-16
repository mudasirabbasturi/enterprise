<?php

namespace App\Http\Controllers;

use App\Models\EmployeeSalary;
use App\Models\SalaryPackage;
use App\Models\User;
use App\Models\PayrollTaxRule;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalarySetupController extends Controller
{
    public function index()
    {
        $assignments = EmployeeSalary::with(['user', 'package.allowances', 'package.taxRules'])->get();
        $users = User::select('id', 'name', 'email')->get();
        $packages = SalaryPackage::with(['allowances', 'taxRules'])->get();
        $taxRules = PayrollTaxRule::all();

        return Inertia::render('Pages/Payroll/SalarySetup', [
            'assignments' => $assignments,
            'users' => $users,
            'packages' => $packages,
            'taxRules' => $taxRules
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id|unique:employee_salaries,user_id',
            'package_id' => 'required|exists:salary_packages,id',
        ], [
            'user_id.unique' => 'This user already has a salary package assigned. Please edit the existing assignment instead.'
        ]);

        EmployeeSalary::create($validated);
        return redirect()->back()->with('message', 'Salary package assigned successfully.');
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
            'package_id' => 'required|exists:salary_packages,id',
        ]);

        $packageId = $validated['package_id'];
        $userIds = $validated['user_ids'];

        $count = 0;
        foreach ($userIds as $userId) {
            // Only create if not already exists to avoid unique constraint errors in bulk
            if (!EmployeeSalary::where('user_id', $userId)->exists()) {
                EmployeeSalary::create([
                    'user_id' => $userId,
                    'package_id' => $packageId,
                ]);
                $count++;
            }
        }

        return redirect()->back()->with('message', "$count users assigned to the package successfully.");
    }

    public function update(Request $request, $id)
    {
        $assignment = EmployeeSalary::findOrFail($id);
        $validated = $request->validate([
            'package_id' => 'required|exists:salary_packages,id',
        ]);

        $assignment->update($validated);
        return redirect()->back()->with('message', 'Salary assignment updated successfully.');
    }

    public function destroy($id)
    {
        $assignment = EmployeeSalary::findOrFail($id);
        $assignment->delete();
        return redirect()->back()->with('message', 'Salary assignment removed successfully.');
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:employee_salaries,id',
        ]);

        EmployeeSalary::whereIn('id', $validated['ids'])->delete();
        return redirect()->back()->with('message', 'Selected salary assignments removed successfully.');
    }
}
