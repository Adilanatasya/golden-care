import { LaravelCodeFile } from '../types';

export const LARAVEL_PHASE_2_FILES: LaravelCodeFile[] = [
  // --- CONTROLLERS ---
  {
    category: 'Controller',
    filename: 'ResidentController.php',
    path: 'app/Http/Controllers/Api/ResidentController.php',
    description: 'API Controller for managing resident admissions, profile search, and medical histories.',
    code: `<?php

namespace App\\Http\\Controllers\\Api;

use App\\Http\\Controllers\\Controller;
use App\\Models\\Resident;
use Illuminate\\Http\\Request;
use Illuminate\\Http\\JsonResponse;

class ResidentController extends Controller
{
    /**
     * Display a listing of residents with search and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Resident::with(['vitals' => function ($q) {
            $q->latest()->limit(1);
        }]);

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('ic_number', 'like', "%{$search}%")
                  ->orWhere('room_number', 'like', "%{$search}%");
            });
        }

        $residents = $query->orderBy('room_number', 'asc')->paginate(15);

        return response()->json([
            'status' => 'success',
            'data' => $residents
        ]);
    }

    /**
     * Store a newly registered resident (Admin only).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'ic_number' => 'required|string|unique:residents,ic_number',
            'dob' => 'required|date',
            'gender' => 'required|in:Male,Female',
            'emergency_contact' => 'required|string|max:255',
            'medical_history' => 'nullable|string',
            'room_number' => 'required|string|max:50',
        ]);

        $resident = Resident::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Resident successfully registered at Pusat Jagaan Fitrah',
            'data' => $resident
        ], 201);
    }

    /**
     * Display detailed resident profile with full medical history and vitals.
     */
    public function show(int $id): JsonResponse
    {
        $resident = Resident::with(['vitals.recordedBy', 'medicationLogs.medication', 'visitors'])
            ->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $resident
        ]);
    }

    /**
     * Update resident profile details.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $resident = Resident::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'emergency_contact' => 'sometimes|string|max:255',
            'medical_history' => 'nullable|string',
            'room_number' => 'sometimes|string|max:50',
        ]);

        $resident->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Resident record updated',
            'data' => $resident
        ]);
    }
}
`
  },
  {
    category: 'Controller',
    filename: 'VitalController.php',
    path: 'app/Http/Controllers/Api/VitalController.php',
    description: 'Controller for recording vitals and auto-triggering Telegram alerts when thresholds are exceeded.',
    code: `<?php

namespace App\\Http\\Controllers\\Api;

use App\\Http\\Controllers\\Controller;
use App\\Models\\Vital;
use App\\Services\\TelegramAlertService;
use Illuminate\\Http\\Request;
use Illuminate\\Http\\JsonResponse;

class VitalController extends Controller
{
    protected TelegramAlertService $telegramService;

    public function __construct(TelegramAlertService $telegramService)
    {
        $this->telegramService = $telegramService;
    }

    /**
     * List all recorded vitals with filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Vital::with(['resident', 'recordedBy'])->latest();

        if ($request->has('resident_id')) {
            $query->where('resident_id', $request->input('resident_id'));
        }

        if ($request->boolean('critical_only')) {
            $query->where(function ($q) {
                $q->where('bp_systolic', '>', 140)
                  ->orWhere('temperature', '>', 37.5);
            });
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->paginate(20)
        ]);
    }

    /**
     * Record new health vitals for a resident.
     * Triggers Telegram alert if Systolic BP > 140 or Temp > 37.5°C.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'resident_id' => 'required|exists:residents,id',
            'bp_systolic' => 'required|integer|min:70|max:240',
            'bp_diastolic' => 'required|integer|min:40|max:150',
            'heart_rate' => 'required|integer|min:40|max:200',
            'temperature' => 'required|numeric|min:35.0|max:42.0',
            'oxygen_level' => 'required|integer|min:70|max:100',
        ]);

        $validated['recorded_by'] = auth()->id() ?? 1;

        $vital = Vital::create($validated);
        $vital->load(['resident', 'recordedBy']);

        // Check critical threshold
        $isCritical = $vital->bp_systolic > 140 || $vital->temperature > 37.5;
        $telegramStatus = null;

        if ($isCritical) {
            $telegramStatus = $this->telegramService->sendCriticalAlert($vital);
        }

        return response()->json([
            'status' => 'success',
            'message' => $isCritical 
                ? 'Vital recorded! Critical threshold exceeded - Telegram Alert Dispatched.' 
                : 'Vital successfully recorded.',
            'is_critical' => $isCritical,
            'telegram_dispatched' => $telegramStatus,
            'data' => $vital
        ], 201);
    }
}
`
  },
  {
    category: 'Controller',
    filename: 'TelegramAlertService.php',
    path: 'app/Services/TelegramAlertService.php',
    description: 'Service class for formatting and sending HTTP POST requests to Telegram Bot API.',
    code: `<?php

namespace App\\Services;

use App\\Models\\Vital;
use Illuminate\\Support\\Facades\\Http;
use Illuminate\\Support\\Facades\\Log;

class TelegramAlertService
{
    /**
     * Send critical health alert notification to Telegram Group Chat.
     */
    public function sendCriticalAlert(Vital $vital): bool
    {
        $botToken = config('services.telegram.bot_token', env('TELEGRAM_BOT_TOKEN'));
        $chatId = config('services.telegram.chat_id', env('TELEGRAM_CHAT_ID'));

        if (empty($botToken) || empty($chatId)) {
            Log::warning('Telegram Alert skipped: BOT_TOKEN or CHAT_ID not configured in .env');
            return false;
        }

        $residentName = $vital->resident ? $vital->resident->name : "Resident #{$vital->resident_id}";
        $roomNo = $vital->resident ? $vital->resident->room_number : 'Unassigned';
        $caregiver = $vital->recordedBy ? $vital->recordedBy->name : 'On-duty Caregiver';

        $message = "🚨 *GOLDEN CARE EMERGENCY VITALS ALERT* 🚨\\n\\n";
        $message .= "🏢 *Facility:* Pusat Jagaan Warga Emas Fitrah\\n";
        $message .= "👤 *Resident:* {$residentName} (Room {$roomNo})\\n";
        $message .= "🩸 *Blood Pressure:* {$vital->bp_systolic}/{$vital->bp_diastolic} mmHg\\n";
        $message .= "🌡️ *Body Temp:* {$vital->temperature}°C\\n";
        $message .= "🫀 *Heart Rate:* {$vital->heart_rate} bpm\\n";
        $message .= "🫁 *Oxygen Level:* {$vital->oxygen_level}%\\n\\n";
        $message .= "👨‍⚕️ *Logged By:* {$caregiver}\\n";
        $message .= "⏰ *Time:* " . now()->format('Y-m-d H:i:s') . "\\n";
        $message .= "⚠️ *Action:* Immediate nursing review required!";

        try {
            $response = Http::post("https://api.telegram.org/bot{$botToken}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => 'Markdown',
            ]);

            if ($response->successful()) {
                Log::info("Telegram alert sent successfully for Resident {$residentName}");
                return true;
            }

            Log::error("Telegram API Error: " . $response->body());
            return false;
        } catch (\\Exception $e) {
            Log::error("Failed to trigger Telegram alert: " . $e->getMessage());
            return false;
        }
    }
}
`
  },
  {
    category: 'Controller',
    filename: 'MedicationLogController.php',
    path: 'app/Http/Controllers/Api/MedicationLogController.php',
    description: 'Controller for administering resident medications and viewing daily administration logs.',
    code: `<?php

namespace App\\Http\\Controllers\\Api;

use App\\Http\\Controllers\\Controller;
use App\\Models\\MedicationLog;
use Illuminate\\Http\\Request;
use Illuminate\\Http\\JsonResponse;

class MedicationLogController extends Controller
{
    /**
     * List medication logs.
     */
    public function index(): JsonResponse
    {
        $logs = MedicationLog::with(['resident', 'medication', 'givenBy'])
            ->latest()
            ->paginate(20);

        return response()->json([
            'status' => 'success',
            'data' => $logs
        ]);
    }

    /**
     * Record a medication administration event (given or missed).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'resident_id' => 'required|exists:residents,id',
            'medication_id' => 'required|exists:medications,id',
            'status' => 'required|in:given,missed',
            'given_at' => 'nullable|date',
        ]);

        $validated['given_by'] = auth()->id() ?? 1;
        $validated['given_at'] = $validated['given_at'] ?? now();

        $log = MedicationLog::create($validated);
        $log->load(['resident', 'medication', 'givenBy']);

        return response()->json([
            'status' => 'success',
            'message' => 'Medication log updated.',
            'data' => $log
        ], 201);
    }
}
`
  },
  {
    category: 'Middleware',
    filename: 'RoleMiddleware.php',
    path: 'app/Http/Middleware/RoleMiddleware.php',
    description: 'Middleware verifying if the authenticated user possesses the required role (admin or caregiver).',
    code: `<?php

namespace App\\Http\\Middleware;

use Closure;
use Illuminate\\Http\\Request;
use Symfony\\Component\\HttpFoundation\\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if (! $request->user() || $request->user()->role !== $role) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized access. Required access level: ' . strtoupper($role)
            ], 403);
        }

        return $next($request);
    }
}
`
  },
  {
    category: 'Route',
    filename: 'api.php',
    path: 'routes/api.php',
    description: 'Laravel 13 REST API routes with Sanctum authentication and Role Middleware.',
    code: `<?php

use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Route;
use App\\Http\\Controllers\\Api\\ResidentController;
use App\\Http\\Controllers\\Api\\VitalController;
use App\\Http\\Controllers\\Api\\MedicationLogController;
use App\\Http\\Controllers\\Api\\VisitorController;

/*
|--------------------------------------------------------------------------
| Golden Care API Routes (Laravel 13)
|--------------------------------------------------------------------------
*/

// Public Health Check
Route::get('/health', fn () => response()->json(['status' => 'ok', 'app' => 'Golden Care FYP API']));

// Protected API Routes
Route::middleware('auth:sanctum')->group(function () {
    
    // User Context
    Route::get('/user', fn (Request $request) => $request->user());

    // Residents Directory & Profiles
    Route::apiResource('residents', ResidentController::class);

    // Vitals & Health Tracking
    Route::get('/vitals', [VitalController::class, 'index']);
    Route::post('/vitals', [VitalController::class, 'store']);

    // Medication Administration
    Route::get('/medication-logs', [MedicationLogController::class, 'index']);
    Route::post('/medication-logs', [MedicationLogController::class, 'store']);

    // Visitor Tracking
    Route::get('/visitors', [VisitorController::class, 'index']);
    Route::post('/visitors', [VisitorController::class, 'store']);

    // Admin Only Management Routes
    Route::middleware('role:admin')->group(function () {
        Route::post('/residents', [ResidentController::class, 'store']);
        Route::put('/residents/{id}', [ResidentController::class, 'update']);
        Route::get('/reports/summary', fn () => response()->json(['status' => 'success', 'report' => 'Admin summary analytics']));
    });
});
`
  }
];
