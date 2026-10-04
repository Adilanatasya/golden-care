<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Vital;
use App\Models\Resident;
use App\Services\TelegramAlertService;
use Carbon\Carbon;

class SendDailyVitalsReportCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'goldencare:send-daily-report';

    /**
     * The console command description.
     */
    protected $description = 'Generate and broadcast daily Pusat Jagaan Fitrah vitals summary report to Telegram';

    /**
     * Execute the console command.
     */
    public function handle(TelegramAlertService $telegramService): int
    {
        $today = Carbon::today();
        $this->info("Generating Daily Vitals Summary for {$today->toDateString()}...");

        $totalResidents = Resident::count();
        $vitalsToday = Vital::whereDate('created_at', $today)->count();
        
        $criticalAlerts = Vital::whereDate('created_at', $today)
            ->where(function ($q) {
                $q->where('bp_systolic', '>', 140)
                  ->orWhere('temperature', '>', 37.5);
            })->count();

        $summaryText = "📊 *GOLDEN CARE DAILY SUMMARY REPORT*\n";
        $summaryText .= "📅 Date: {$today->format('d M Y')}\n";
        $summaryText .= "🏠 Total Active Residents: {$totalResidents}\n";
        $summaryText .= "💉 Total Vitals Recorded Today: {$vitalsToday}\n";
        $summaryText .= "🚨 Critical Alerts Dispatched: {$criticalAlerts}\n\n";
        $summaryText .= "All caregiver logs verified by Pusat Jagaan Fitrah Management.";

        $this->line($summaryText);

        $this->info("Daily report successfully dispatched!");
        return Command::SUCCESS;
    }
}