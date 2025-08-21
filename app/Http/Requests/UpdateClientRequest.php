<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
class UpdateClientRequest extends FormRequest
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
        $clientId = $this->route('id');
        return [
            'title' => 'nullable|string|max:255',
            'name'  => 'required|string|max:255',
            'email' => ['nullable', 'email', 'max:255', Rule::unique('clients')->ignore($clientId)],
            'phone' => ['nullable', 'string', 'max:20', Rule::unique('clients')->ignore($clientId)],
            'notes' => 'nullable|string',
        ];
    }
}
