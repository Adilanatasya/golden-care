<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VitalResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $isCriticalBP = $this->bp_systolic > 140;
        $isCriticalTemp = $this->temperature > 37.5;
        $isAlertTriggered = $isCriticalBP || $isCriticalTemp;

        return [
            'id' => $this->id,
            'resident_id' => $this->resident_id,
            'resident' => new ResidentResource($this->whenLoaded('resident')),
            'measurements' => [
                'blood_pressure' => [
                    'systolic' => $this->bp_systolic,
                    'diastolic' => $this->bp_diastolic,
                    'formatted' => "{$this->bp_systolic}/{$this->bp_diastolic} mmHg",
                    'is_high' => $isCriticalBP,
                ],
                'temperature' => [
                    'value' => (float) $this->temperature,
                    'formatted' => "{$this->temperature}°C",
                    'is_fever' => $isCriticalTemp,
                ],
                'heart_rate' => [
                    'bpm' => $this->heart_rate,
                    'formatted' => "{$this->heart_rate} bpm",
                ],
                'oxygen_level' => [
                    'spo2' => $this->oxygen_level,
                    'formatted' => "{$this->oxygen_level}%",
                ],
            ],
            'alert_triggered' => $isAlertTriggered,
            'recorded_by' => [
                'id' => $this->recordedBy->id ?? null,
                'name' => $this->recordedBy->name ?? 'System',
                'role' => $this->recordedBy->role ?? 'caregiver',
            ],
            'created_at' => $this->created_at->toIso8601String(),
            'created_at_human' => $this->created_at->diffForHumans(),
        ];
    }
}