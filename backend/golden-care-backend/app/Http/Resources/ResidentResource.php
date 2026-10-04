<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ResidentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'ic_number' => $this->ic_number,
            'dob' => $this->dob,
            'age' => \Carbon\Carbon::parse($this->dob)->age,
            'gender' => $this->gender,
            'emergency_contact' => $this->emergency_contact,
            'medical_history' => $this->medical_history ?? 'None specified',
            'room_number' => $this->room_number,
            'latest_vital' => new VitalResource($this->whenLoaded('vitals', function () {
                return $this->vitals->first();
            })),
            'vitals_history' => VitalResource::collection($this->whenLoaded('vitals')),
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
        ];
    }
}