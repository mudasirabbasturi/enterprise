<?php

namespace App\Http\Controllers;

use App\Models\PayrollConfig;
use Illuminate\Http\Request;

class PayrollConfigController extends Controller
{
    public function update(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*' => 'required'
        ]);

        foreach ($validated['settings'] as $key => $value) {
            PayrollConfig::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        return redirect()->back()->with('message', 'Payroll settings updated successfully.');
    }
}
