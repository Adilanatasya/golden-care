<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Visitor extends Model
{
    use HasFactory;

    protected $fillable = [
        'resident_id',
        'visitor_name',
        'relationship',
        'contact_phone',
        'check_in',
        'check_out',
        'status',
        'visit_date',
    ];

    protected $casts = [
        'visit_date' => 'datetime',
        'check_in' => 'datetime',
        'check_out' => 'datetime',
    ];

    /**
     * Relationship: Resident being visited.
     */
    public function resident(): BelongsTo
    {
        return $this->belongsTo(Resident::class);
    }
}
