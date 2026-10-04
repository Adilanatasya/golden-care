<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vital;
use App\Services\TelegramAlertService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VitalController extends Controller
{
    protected TelegramAlertService $telegramService;

    public function __construct(TelegramAlertService $telegramService)
    {
        $this->telegramService = $telegramService;
    }

    /**
     * List all recorded vitals with optional filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Vital::with([
            'resident',
            'recordedBy',
        ])->latest();

        if ($request->has('resident_id')) {
            $query->where(
                'resident_id',
                $request->input('resident_id')
            );
        }

        if ($request->boolean('critical_only')) {
            $query->where(function ($q) {
                $q->where('bp_systolic', '>', 140)
                  ->orWhere('temperature', '>', 37.5);
            });
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->paginate(20),
        ]);
    }

    /**
     * Record new health vitals for a resident.
     *
     * A critical health alert is triggered when:
     * - Systolic blood pressure is above 140 mmHg, OR
     * - Body temperature is above 37.5°C.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'resident_id' => [
                'required',
                'exists:residents,id',
            ],

            'bp_systolic' => [
                'required',
                'integer',
                'min:70',
                'max:240',
            ],

            'bp_diastolic' => [
                'required',
                'integer',
                'min:40',
                'max:150',
            ],

            'heart_rate' => [
                'required',
                'integer',
                'min:40',
                'max:200',
            ],

            'temperature' => [
                'required',
                'numeric',
                'min:35.0',
                'max:42.0',
            ],

            'oxygen_level' => [
                'required',
                'integer',
                'min:70',
                'max:100',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Recorded By
        |--------------------------------------------------------------------------
        |
        | Use the authenticated user's ID.
        | Fallback to ID 1 only if no authenticated user is available.
        |
        */

        $validated['recorded_by'] =
            $request->user()?->id ?? 1;

        /*
        |--------------------------------------------------------------------------
        | Save Vital Record
        |--------------------------------------------------------------------------
        */

        $vital = Vital::create($validated);

        $vital->load([
            'resident',
            'recordedBy',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Critical Threshold Check
        |--------------------------------------------------------------------------
        */

        $isCritical =
            $vital->bp_systolic > 140 ||
            $vital->temperature > 37.5;

        $telegramDispatched = false;

        /*
        |--------------------------------------------------------------------------
        | Telegram Emergency Alert
        |--------------------------------------------------------------------------
        */

        if ($isCritical) {
            try {
                $telegramDispatched =
                    (bool) $this->telegramService
                        ->sendCriticalAlert($vital);
            } catch (\Throwable $error) {
                /*
                 * The vital reading must still be saved even when
                 * Telegram is temporarily unavailable.
                 */
                report($error);

                $telegramDispatched = false;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Response Message
        |--------------------------------------------------------------------------
        */

        if (!$isCritical) {
            $message =
                'Vital signs recorded successfully.';
        } elseif ($telegramDispatched) {
            $message =
                'Vital signs recorded. A critical health threshold was detected and the Telegram alert was sent successfully.';
        } else {
            $message =
                'Vital signs recorded. A critical health threshold was detected, but the Telegram alert could not be confirmed.';
        }

        return response()->json([
            'status' => 'success',

            'message' => $message,

            'is_critical' => $isCritical,

            'telegram_dispatched' =>
                $telegramDispatched,

            'data' => $vital,
        ], 201);
    }
}