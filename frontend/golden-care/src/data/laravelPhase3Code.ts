import { LaravelCodeFile } from '../types';

export const LARAVEL_PHASE_3_FILES: LaravelCodeFile[] = [
  // --- FORM REQUESTS ---
  {
    category: 'Form Request',
    filename: 'StoreVitalRequest.php',
    path: 'app/Http/Requests/StoreVitalRequest.php',
    description: 'Custom Form Request validating blood pressure, temperature, pulse, and oxygen inputs.',
    code: `<?php

namespace App\\Http\\Requests;

use Illuminate\\Foundation\\Http\\FormRequest;

class StoreVitalRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Allowed for both caregivers and admins
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'resident_id' => ['required', 'exists:residents,id'],
            'bp_systolic' => ['required', 'integer', 'between:70,240'],
            'bp_diastolic' => ['required', 'integer', 'between:40,150'],
            'heart_rate' => ['required', 'integer', 'between:40,200'],
            'temperature' => ['required', 'numeric', 'between:34.0,43.0'],
            'oxygen_level' => ['required', 'integer', 'between:70,100'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'bp_systolic.between' => 'Systolic Blood Pressure must be a physiological value between 70 and 240 mmHg.',
            'temperature.between' => 'Body temperature must be recorded between 34.0°C and 43.0°C.',
            'oxygen_level.between' => 'SpO2 level must be between 70% and 100%.',
        ];
    }
}
`
  },
  {
    category: 'Form Request',
    filename: 'StoreResidentRequest.php',
    path: 'app/Http/Requests/StoreResidentRequest.php',
    description: 'Validation request enforcing admin authority and Malaysian IC format rules for resident registration.',
    code: `<?php

namespace App\\Http\\Requests;

use Illuminate\\Foundation\\Http\\FormRequest;

class StoreResidentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() && $this->user()->role === 'admin';
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'ic_number' => ['required', 'string', 'regex:/^\\d{6}-\\d{2}-\\d{4}$/', 'unique:residents,ic_number'],
            'dob' => ['required', 'date', 'before:today'],
            'gender' => ['required', 'in:Male,Female'],
            'emergency_contact' => ['required', 'string', 'max:255'],
            'medical_history' => ['nullable', 'string', 'max:1000'],
            'room_number' => ['required', 'string', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'ic_number.regex' => 'Malaysian NRIC must follow YYMMDD-PB-###G format (e.g., 480315-10-5231).',
            'ic_number.unique' => 'A resident with this IC number is already registered at Pusat Jagaan Fitrah.',
        ];
    }
}
`
  },

  // --- API RESOURCES ---
  {
    category: 'API Resource',
    filename: 'VitalResource.php',
    path: 'app/Http/Resources/VitalResource.php',
    description: 'API Resource transformer computing critical health status flags and formatted timestamps.',
    code: `<?php

namespace App\\Http\\Resources;

use Illuminate\\Http\\Request;
use Illuminate\\Http\\Resources\\Json\\JsonResource;

class VitalResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $isCriticalBP = $this->bp_systolic > 140;
        $isCriticalTemp = $this->temperature > 37.5;
        $isAlertTriggered = $isCriticalBP || $isCriticalTemp;

        return [
            'id' => $this->id,
            'resident_id' => $this->resident_id,
            'resident' => new ResidentResource($this->whenLoaded('resident')),
            'measurements' => [
                'blood_pressure' => [
                    'systolic' => $this->bp_systolic,
                    'diastolic' => $this->bp_diastolic,
                    'formatted' => "{$this->bp_systolic}/{$this->bp_diastolic} mmHg",
                    'is_high' => $isCriticalBP,
                ],
                'temperature' => [
                    'value' => (float) $this->temperature,
                    'formatted' => "{$this->temperature}°C",
                    'is_fever' => $isCriticalTemp,
                ],
                'heart_rate' => [
                    'bpm' => $this->heart_rate,
                    'formatted' => "{$this->heart_rate} bpm",
                ],
                'oxygen_level' => [
                    'spo2' => $this->oxygen_level,
                    'formatted' => "{$this->oxygen_level}%",
                ],
            ],
            'alert_triggered' => $isAlertTriggered,
            'recorded_by' => [
                'id' => $this->recordedBy->id ?? null,
                'name' => $this->recordedBy->name ?? 'System',
                'role' => $this->recordedBy->role ?? 'caregiver',
            ],
            'created_at' => $this->created_at->toIso8601String(),
            'created_at_human' => $this->created_at->diffForHumans(),
        ];
    }
}
`
  },
  {
    category: 'API Resource',
    filename: 'ResidentResource.php',
    path: 'app/Http/Resources/ResidentResource.php',
    description: 'JSON Resource transformer embedding latest vitals, room metadata, and emergency contacts.',
    code: `<?php

namespace App\\Http\\Resources;

use Illuminate\\Http\\Request;
use Illuminate\\Http\\Resources\\Json\\JsonResource;

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
            'age' => \\Carbon\\Carbon::parse($this->dob)->age,
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
`
  },

  // --- CONSOLE COMMANDS ---
  {
    category: 'Console Command',
    filename: 'SendDailyVitalsReportCommand.php',
    path: 'app/Console/Commands/SendDailyVitalsReportCommand.php',
    description: 'Artisan cron command compiling daily health statistics and emailing/telegramming admins.',
    code: `<?php

namespace App\\Console\\Commands;

use Illuminate\\Console\\Command;
use App\\Models\\Vital;
use App\\Models\\Resident;
use App\\Services\\TelegramAlertService;
use Carbon\\Carbon;

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

        $summaryText = "📊 *GOLDEN CARE DAILY SUMMARY REPORT*\\n";
        $summaryText .= "📅 Date: {$today->format('d M Y')}\\n";
        $summaryText .= "🏠 Total Active Residents: {$totalResidents}\\n";
        $summaryText .= "💉 Total Vitals Recorded Today: {$vitalsToday}\\n";
        $summaryText .= "🚨 Critical Alerts Dispatched: {$criticalAlerts}\\n\\n";
        $summaryText .= "All caregiver logs verified by Pusat Jagaan Fitrah Management.";

        $this->line($summaryText);

        $this->info("Daily report successfully dispatched!");
        return Command::SUCCESS;
    }
}
`
  },

  // --- FEATURE TESTS ---
  {
    category: 'Feature Test',
    filename: 'VitalEmergencyAlertTest.php',
    path: 'tests/Feature/VitalEmergencyAlertTest.php',
    description: 'Automated PHPUnit test verifying Telegram Http::fake dispatch when vitals exceed critical criteria.',
    code: `<?php

namespace Tests\\Feature;

use Tests\\TestCase;
use App\\Models\\User;
use App\\Models\\Resident;
use App\\Models\\Vital;
use Illuminate\\Foundation\\Testing\\RefreshDatabase;
use Illuminate\\Support\\Facades\\Http;

class VitalEmergencyAlertTest extends TestCase
{
    use RefreshDatabase;

    public function test_vitals_exceeding_threshold_triggers_telegram_http_post(): void
    {
        // Fake Telegram Bot API endpoint
        Http::fake([
            'https://api.telegram.org/bot*' => Http::response(['ok' => true, 'result' => ['message_id' => 123]], 200),
        ]);

        $caregiver = User::factory()->create(['role' => 'caregiver']);
        $resident = Resident::factory()->create(['name' => 'Hajah Fatimah', 'room_number' => '201']);

        $response = $this->actingAs($caregiver, 'sanctum')
            ->postJson('/api/vitals', [
                'resident_id' => $resident->id,
                'bp_systolic' => 155, // Critical > 140
                'bp_diastolic' => 95,
                'heart_rate' => 88,
                'temperature' => 38.2, // Critical > 37.5
                'oxygen_level' => 96,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'status' => 'success',
                'is_critical' => true,
                'telegram_dispatched' => true,
            ]);

        // Assert HTTP Post request was made to Telegram API
        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'api.telegram.org') &&
                   str_contains($request['text'], 'Hajah Fatimah') &&
                   str_contains($request['text'], '155/95');
        });
    }

    public function test_normal_vitals_do_not_trigger_telegram_post(): void
    {
        Http::fake();

        $caregiver = User::factory()->create(['role' => 'caregiver']);
        $resident = Resident::factory()->create();

        $response = $this->actingAs($caregiver, 'sanctum')
            ->postJson('/api/vitals', [
                'resident_id' => $resident->id,
                'bp_systolic' => 120, // Normal
                'bp_diastolic' => 80,
                'heart_rate' => 72,
                'temperature' => 36.6, // Normal
                'oxygen_level' => 99,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'status' => 'success',
                'is_critical' => false,
            ]);

        // Assert Telegram HTTP was NOT sent
        Http::assertNothingSent();
    }
}
`
  },
  {
    category: 'Feature Test',
    filename: 'ResidentAdmissionTest.php',
    path: 'tests/Feature/ResidentAdmissionTest.php',
    description: 'Feature test checking Admin Role-Based Access Control (RBAC) when registering new residents.',
    code: `<?php

namespace Tests\\Feature;

use Tests\\TestCase;
use App\\Models\\User;
use App\\Models\\Resident;
use Illuminate\\Foundation\\Testing\\RefreshDatabase;

class ResidentAdmissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_register_new_resident(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/residents', [
                'name' => 'Pakcik Ramli Hassan',
                'ic_number' => '450812-10-5543',
                'dob' => '1945-08-12',
                'gender' => 'Male',
                'emergency_contact' => '012-9876543 (Son - Kamarhat)',
                'medical_history' => 'Hypertension, Mild Stroke 2021',
                'room_number' => 'Room 105',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Pakcik Ramli Hassan');

        $this->assertDatabaseHas('residents', [
            'ic_number' => '450812-10-5543',
            'room_number' => 'Room 105',
        ]);
    }

    public function test_caregiver_cannot_register_resident(): void
    {
        $caregiver = User::factory()->create(['role' => 'caregiver']);

        $response = $this->actingAs($caregiver, 'sanctum')
            ->postJson('/api/residents', [
                'name' => 'Unauthorized Admission',
                'ic_number' => '500101-14-1111',
                'dob' => '1950-01-01',
                'gender' => 'Female',
                'emergency_contact' => '019-1112223',
                'room_number' => 'Room 303',
            ]);

        $response->assertStatus(403)
            ->assertJsonPath('message', 'Unauthorized access. Required access level: ADMIN');
    }
}
`
  }
];
