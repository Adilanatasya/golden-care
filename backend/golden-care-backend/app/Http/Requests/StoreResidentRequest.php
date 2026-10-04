<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreResidentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() && $this->user()->role === 'admin';
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'ic_number' => ['required', 'string', 'regex:/^\d{6}-\d{2}-\d{4}$/', 'unique:residents,ic_number'],
            'dob' => ['required', 'date', 'before:today'],
            'gender' => ['required', 'in:Male,Female'],
            'emergency_contact' => ['required', 'string', 'max:255'],
            'medical_history' => ['nullable', 'string', 'max:1000'],
            'room_number' => ['required', 'string', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'ic_number.regex' => 'Malaysian NRIC must follow YYMMDD-PB-###G format (e.g., 480315-10-5231).',
            'ic_number.unique' => 'A resident with this IC number is already registered at Pusat Jagaan Fitrah.',
        ];
    }
}