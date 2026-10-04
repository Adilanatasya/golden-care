<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Resident extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'ic_number',
        'dob',
        'gender',
        'emergency_contact',
        'medical_history',
        'room_number',
    ];

    protected $casts = [
        'dob' => 'date:Y-m-d',
    ];

    /**
     * Relationship: Vitals associated with this resident.
     */
    public function vitals(): HasMany
    {
        return $this->hasMany(Vital::class);
    }

    /**
     * Relationship: Visitors associated with this resident.
     */
    public function visitors(): HasMany
    {
        return $this->hasMany(Visitor::class);
    }
}
