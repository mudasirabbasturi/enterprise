<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProjectRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'project_title' => 'required|string|max:255',
            'project_address' => 'nullable|string',
            'client_id' => 'nullable|exists:clients,id',
            'project_pricing' => 'nullable|string|max:255',
            'project_area' => 'nullable|string|max:255',
            'project_construction_type' => 'nullable|in:commercial,residential',
            'project_line_items_pricing' => 'nullable|string|max:255',
            'project_floor_number' => 'nullable|string|max:255',
            'project_main_scope' => 'nullable|string',
            'project_scope_details' => 'nullable|string',
            'project_template' => 'nullable|string|max:255',
            'project_init_link' => 'nullable|url',
            'project_final_link' => 'nullable|url',
            'project_admin_notes' => 'nullable|string',
            'project_notes_estimator' => 'nullable|string',
            'notes_private' => 'nullable|string',
            'budget_total' => 'nullable|numeric|min:0',
            'deduction_amount' => 'nullable|numeric|min:0',
            'project_due_date' => 'nullable|date',
            'project_points' => 'nullable|string|max:255',
            'project_source' => 'nullable|in:InSource,OutSource',
            'project_status' => 'nullable|in:Planned,Pending,Takeoff On Progress,Pricing On Progress,Completed,Hold,Revision,Cancelled,Deliver',
            'preview_status' => 'nullable|in:active,draft',
        ];
    }
}
