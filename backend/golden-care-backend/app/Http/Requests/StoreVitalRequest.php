<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVitalRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Allowed for both caregivers and admins
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'resident_id' => ['required', 'exists:residents,id'],
            'bp_systolic' => ['required', 'integer', 'between:70,240'],
            'bp_diastolic' => ['required', 'integer', 'between:40,150'],
            'heart_rate' => ['required', 'integer', 'between:40,200'],
            'temperature' => ['required', 'numeric', 'between:34.0,43.0'],
            'oxygen_level' => ['required', 'integer', 'between:70,100'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'bp_systolic.between' => 'Systolic Blood Pressure must be a physiological value between 70 and 240 mmHg.',
            'temperature.between' => 'Body temperature must be recorded between 34.0°C and 43.0°C.',
            'oxygen_level.between' => 'SpO2 level must be between 70% and 100%.',
        ];
    }
}