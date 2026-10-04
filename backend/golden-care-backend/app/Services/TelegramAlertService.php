<?php

namespace App\Services;

use App\Models\Vital;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramAlertService
{
    /**
     * Send critical health alert notification to Telegram Group Chat.
     */
    public function sendCriticalAlert(Vital $vital): bool
    {
        $botToken = config('services.telegram.bot_token');
        $chatId = config('services.telegram.chat_id');

        /*
         * During automated testing, use dummy values because
         * Http::fake() will intercept the Telegram request.
         */
        if (app()->environment('testing')) {
            $botToken = $botToken ?: 'test-bot-token';
            $chatId = $chatId ?: 'test-chat-id';
        }

        if (empty($botToken) || empty($chatId)) {
            Log::warning(
                'Telegram Alert skipped: BOT_TOKEN or CHAT_ID not configured in .env'
            );

            return false;
        }

        $residentName = $vital->resident
            ? $vital->resident->name
            : "Resident #{$vital->resident_id}";

        $roomNo = $vital->resident
            ? $vital->resident->room_number
            : 'Unassigned';

        $caregiver = $vital->recordedBy
            ? $vital->recordedBy->name
            : 'On-duty Caregiver';

        /*
         * Determine the reason for the alert.
         * GoldenCare critical rule:
         * - Systolic BP > 140 mmHg
         * - Temperature > 37.5°C
         */
        if (
            $vital->bp_systolic > 140 &&
            $vital->temperature > 37.5
        ) {
            $alertReason =
                'High Blood Pressure and Elevated Temperature';
        } elseif ($vital->bp_systolic > 140) {
            $alertReason =
                'High Blood Pressure';
        } else {
            $alertReason =
                'Elevated Temperature';
        }

        /*
         * Escape dynamic values because Telegram HTML parse mode
         * is used below.
         */
        $residentNameSafe = e($residentName);
        $roomNoSafe = e($roomNo);
        $caregiverSafe = e($caregiver);
        $alertReasonSafe = e($alertReason);

        $message =
            "🚨 <b>GoldenCare Emergency Health Alert</b>\n\n" .

            "<b>Resident Information</b>\n" .
            "Name: {$residentNameSafe}\n" .
            "Room: {$roomNoSafe}\n\n" .

            "<b>Abnormal Reading Detected</b>\n" .
            "Blood Pressure: {$vital->bp_systolic}/{$vital->bp_diastolic} mmHg\n" .
            "Temperature: {$vital->temperature}°C\n" .
            "Heart Rate: {$vital->heart_rate} bpm\n" .
            "Oxygen Level: {$vital->oxygen_level}%\n\n" .

            "<b>Alert Reason</b>\n" .
            "{$alertReasonSafe}\n\n" .

            "<b>Recorded By</b>\n" .
"{$caregiverSafe}\n" .
now()
    ->timezone('Asia/Kuala_Lumpur')
    ->format('d M Y, h:i A') . "\n\n" .

            "<b>Action Required</b>\n" .
            "Please review the resident's condition and take the appropriate action promptly.\n\n" .

            "<b>GoldenCare</b>\n" .
            "Elderly Health Monitoring & Alert Management System";

        try {
            $response = Http::post(
                "https://api.telegram.org/bot{$botToken}/sendMessage",
                [
                    'chat_id' => $chatId,
                    'text' => $message,
                    'parse_mode' => 'HTML',
                ]
            );

            if ($response->successful()) {
                Log::info(
                    "Telegram alert sent successfully for Resident {$residentName}"
                );

                return true;
            }

            Log::error(
                'Telegram API Error: ' . $response->body()
            );

            return false;

        } catch (\Exception $e) {
            Log::error(
                'Failed to trigger Telegram alert: ' . $e->getMessage()
            );

            return false;
        }
    }
}