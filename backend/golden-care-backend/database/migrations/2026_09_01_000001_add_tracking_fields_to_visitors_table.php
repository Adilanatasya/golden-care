<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('visitors', function (Blueprint $table) {
            $table->string('contact_phone', 30)->nullable()->after('relationship');
            $table->dateTime('check_in')->nullable()->after('contact_phone');
            $table->dateTime('check_out')->nullable()->after('check_in');
            $table->string('status', 30)->default('Checked In')->after('check_out');
        });

        DB::table('visitors')
            ->whereNull('check_in')
            ->update(['check_in' => DB::raw('visit_date')]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('visitors', function (Blueprint $table) {
            $table->dropColumn([
                'contact_phone',
                'check_in',
                'check_out',
                'status',
            ]);
        });
    }
};
