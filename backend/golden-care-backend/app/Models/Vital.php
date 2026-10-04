<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Vital extends Model
{
    use HasFactory;

    protected $fillable = [
        'resident_id',
        'recorded_by',
        'bp_systolic',
        'bp_diastolic',
        'heart_rate',
        'temperature',
        'oxygen_level',
    ];

    protected $casts = [
        'bp_systolic' => 'integer',
        'bp_diastolic' => 'integer',
        'heart_rate' => 'integer',
        'temperature' => 'decimal:2',
        'oxygen_level' => 'integer',
    ];

    /**
     * Relationship: Resident whom this vital belongs to.
     */
    public function resident(): BelongsTo
    {
        return $this->belongsTo(Resident::class);
    }

    /**
     * Relationship: User (Caregiver) who recorded this vital.
     */
    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}