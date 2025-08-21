<?php

namespace App\Http\Requests;
use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
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
        $userId = $this->route('id');
        return [
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($userId)],
            'password' => 'nullable|string|min:8',
            'phone' => 'nullable|string',
            'designation' => 'nullable|string',
            'country' => 'nullable|string',
            'state' => 'nullable|string',
            'city' => 'nullable|string',
            'postal_or_zip_code' => 'nullable|string',
            'permanent_address' => 'nullable|string',
            'current_address' => 'nullable|string',
            'picture_path' => 'nullable|file|image',
            'dob' => 'nullable|date',
            'joining_date' => 'nullable|date',
            'hiring_date' => 'nullable|date',
            'leaving_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'notes_private' => 'nullable|string',
            'status' => 'required|string|in:active,inactive,suspended',
            'branch_id' => 'nullable|exists:branches,id',
            'department_id' => 'nullable|exists:departments,id',
            'designation_id' => 'nullable|exists:designations,id',
            'role_id' => 'nullable|exists:roles,id',
        ];
    }
}
