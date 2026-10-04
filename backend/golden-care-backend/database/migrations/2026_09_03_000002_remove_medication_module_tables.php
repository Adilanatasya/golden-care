<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('medication_logs');
        Schema::dropIfExists('medications');
    }

    public function down(): void
    {
        // Medication tables were intentionally removed from GoldenCare.
        // Restore them only by reverting to a project backup if needed.
    }
};
