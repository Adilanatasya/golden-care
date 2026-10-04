import { LaravelCodeFile } from '../types';

export const LARAVEL_PHASE_1_FILES: LaravelCodeFile[] = [
  // --- MIGRATIONS ---
  {
    category: 'Migration',
    filename: '2026_01_01_000001_create_residents_table.php',
    path: 'database/migrations/2026_01_01_000001_create_residents_table.php',
    description: 'Migration schema for residents table in Pusat Jagaan Warga Emas.',
    code: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('residents', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('ic_number')->unique();
            $table->date('dob');
            $table->enum('gender', ['Male', 'Female']);
            $table->string('emergency_contact');
            $table->text('medical_history')->nullable();
            $table->string('room_number');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('residents');
    }
};`
  },
  {
    category: 'Migration',
    filename: '2026_01_01_000002_create_vitals_table.php',
    path: 'database/migrations/2026_01_01_000002_create_vitals_table.php',
    description: 'Migration schema for vitals tracking table linked to residents and caregivers.',
    code: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('vitals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('resident_id')->constrained('residents')->onDelete('cascade');
            $table->foreignId('recorded_by')->constrained('users')->onDelete('cascade');
            $table->integer('bp_systolic');
            $table->integer('bp_diastolic');
            $table->integer('heart_rate');
            $table->decimal('temperature', 8, 2);
            $table->integer('oxygen_level');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vitals');
    }
};`
  },
  {
    category: 'Migration',
    filename: '2026_01_01_000003_create_medications_table.php',
    path: 'database/migrations/2026_01_01_000003_create_medications_table.php',
    description: 'Migration schema for medications catalog.',
    code: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('medications', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('dosage');
            $table->text('instructions')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medications');
    }
};`
  },
  {
    category: 'Migration',
    filename: '2026_01_01_000004_create_medication_logs_table.php',
    path: 'database/migrations/2026_01_01_000004_create_medication_logs_table.php',
    description: 'Migration schema for tracking medication administration logs.',
    code: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('medication_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('resident_id')->constrained('residents')->onDelete('cascade');
            $table->foreignId('medication_id')->constrained('medications')->onDelete('cascade');
            $table->foreignId('given_by')->constrained('users')->onDelete('cascade');
            $table->dateTime('given_at');
            $table->enum('status', ['given', 'missed'])->default('given');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medication_logs');
    }
};`
  },
  {
    category: 'Migration',
    filename: '2026_01_01_000005_create_visitors_table.php',
    path: 'database/migrations/2026_01_01_000005_create_visitors_table.php',
    description: 'Migration schema for tracking resident visitor logs.',
    code: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('visitors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('resident_id')->constrained('residents')->onDelete('cascade');
            $table->string('visitor_name');
            $table->string('relationship');
            $table->dateTime('visit_date');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('visitors');
    }
};`
  },

  // --- MODELS ---
  {
    category: 'Model',
    filename: 'User.php',
    path: 'app/Models/User.php',
    description: 'User model with role support and relationships to Vitals and Medication Logs.',
    code: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Foundation\\Auth\\User as Authenticatable;
use Illuminate\\Notifications\\Notifiable;
use Illuminate\\Database\\Eloquent\\Relations\\HasMany;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Check if user is Admin.
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user is Caregiver.
     */
    public function isCaregiver(): bool
    {
        return $this->role === 'caregiver';
    }

    /**
     * Relationship: Vitals recorded by this user/caregiver.
     */
    public function vitals(): HasMany
    {
        return $this->hasMany(Vital::class, 'recorded_by');
    }

    /**
     * Relationship: Medication logs recorded by this user/caregiver.
     */
    public function medicationLogs(): HasMany
    {
        return $this->hasMany(MedicationLog::class, 'given_by');
    }
}`
  },
  {
    category: 'Model',
    filename: 'Resident.php',
    path: 'app/Models/Resident.php',
    description: 'Resident model with relationships to vitals, medication_logs, and visitors.',
    code: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\HasMany;

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
        'dob' => 'date',
    ];

    /**
     * Relationship: Vitals associated with this resident.
     */
    public function vitals(): HasMany
    {
        return $this->hasMany(Vital::class);
    }

    /**
     * Relationship: Medication logs associated with this resident.
     */
    public function medicationLogs(): HasMany
    {
        return $this->hasMany(MedicationLog::class);
    }

    /**
     * Relationship: Visitors associated with this resident.
     */
    public function visitors(): HasMany
    {
        return $this->hasMany(Visitor::class);
    }
}`
  },
  {
    category: 'Model',
    filename: 'Vital.php',
    path: 'app/Models/Vital.php',
    description: 'Vital model for resident health metrics.',
    code: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;

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
}`
  },
  {
    category: 'Model',
    filename: 'Medication.php',
    path: 'app/Models/Medication.php',
    description: 'Medication model for prescribing instructions.',
    code: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\HasMany;

class Medication extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'dosage',
        'instructions',
    ];

    /**
     * Relationship: Logs associated with this medication.
     */
    public function logs(): HasMany
    {
        return $this->hasMany(MedicationLog::class);
    }
}`
  },
  {
    category: 'Model',
    filename: 'MedicationLog.php',
    path: 'app/Models/MedicationLog.php',
    description: 'MedicationLog model tracking medication events.',
    code: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;

class MedicationLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'resident_id',
        'medication_id',
        'given_by',
        'given_at',
        'status',
    ];

    protected $casts = [
        'given_at' => 'datetime',
    ];

    /**
     * Relationship: Resident receiving medication.
     */
    public function resident(): BelongsTo
    {
        return $this->belongsTo(Resident::class);
    }

    /**
     * Relationship: Medication administered.
     */
    public function medication(): BelongsTo
    {
        return $this->belongsTo(Medication::class);
    }

    /**
     * Relationship: Caregiver who administered medication.
     */
    public function givenBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'given_by');
    }
}`
  },
  {
    category: 'Model',
    filename: 'Visitor.php',
    path: 'app/Models/Visitor.php',
    description: 'Visitor model tracking center visitors.',
    code: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;

class Visitor extends Model
{
    use HasFactory;

    protected $fillable = [
        'resident_id',
        'visitor_name',
        'relationship',
        'visit_date',
    ];

    protected $casts = [
        'visit_date' => 'datetime',
    ];

    /**
     * Relationship: Resident being visited.
     */
    public function resident(): BelongsTo
    {
        return $this->belongsTo(Resident::class);
    }
}`
  },

  // --- FACTORIES ---
  {
    category: 'Factory',
    filename: 'ResidentFactory.php',
    path: 'database/factories/ResidentFactory.php',
    description: 'Factory for generating realistic Golden Care residents.',
    code: `<?php

namespace Database\\Factories;

use App\\Models\\Resident;
use Illuminate\\Database\\Eloquent\\Factories\\Factory;

class ResidentFactory extends Factory
{
    protected $model = Resident::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->name(),
            'ic_number' => $this->faker->numerify('######-##-####'),
            'dob' => $this->faker->dateTimeBetween('-90 years', '-65 years')->format('Y-m-d'),
            'gender' => $this->faker->randomElement(['Male', 'Female']),
            'emergency_contact' => $this->faker->name() . ' (' . $this->faker->randomElement(['Son', 'Daughter']) . ') - ' . $this->faker->phoneNumber(),
            'medical_history' => $this->faker->randomElement([
                'Hypertension, Type 2 Diabetes',
                'Post-Stroke recovery, Mild Vascular Dementia',
                'Coronary Artery Disease, Hyperlipidemia',
                'Early Stage Alzheimer Disease',
                'Osteoporosis, Atrial Fibrillation'
            ]),
            'room_number' => 'R' . $this->faker->numberBetween(101, 120),
        ];
    }
}`
  },
  {
    category: 'Factory',
    filename: 'VitalFactory.php',
    path: 'database/factories/VitalFactory.php',
    description: 'Factory for generating realistic vitals data.',
    code: `<?php

namespace Database\\Factories;

use App\\Models\\Vital;
use App\\Models\\Resident;
use App\\Models\\User;
use Illuminate\\Database\\Eloquent\\Factories\\Factory;

class VitalFactory extends Factory
{
    protected $model = Vital::class;

    public function definition(): array
    {
        return [
            'resident_id' => Resident::factory(),
            'recorded_by' => User::factory(),
            'bp_systolic' => $this->faker->numberBetween(110, 155),
            'bp_diastolic' => $this->faker->numberBetween(70, 95),
            'heart_rate' => $this->faker->numberBetween(60, 100),
            'temperature' => $this->faker->randomFloat(2, 36.2, 38.2),
            'oxygen_level' => $this->faker->numberBetween(94, 100),
            'created_at' => $this->faker->dateTimeBetween('-10 days', 'now'),
        ];
    }
}`
  },
  {
    category: 'Factory',
    filename: 'MedicationFactory.php',
    path: 'database/factories/MedicationFactory.php',
    description: 'Factory for cataloging medications.',
    code: `<?php

namespace Database\\Factories;

use App\\Models\\Medication;
use Illuminate\\Database\\Eloquent\\Factories\\Factory;

class MedicationFactory extends Factory
{
    protected $model = Medication::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->randomElement(['Amlodipine', 'Metformin', 'Paracetamol', 'Atorvastatin', 'Lisinopril', 'Omeprazole']),
            'dosage' => $this->faker->randomElement(['5mg', '10mg', '500mg', '20mg']),
            'instructions' => 'Take 1 tablet daily after meals.',
        ];
    }
}`
  },
  {
    category: 'Factory',
    filename: 'MedicationLogFactory.php',
    path: 'database/factories/MedicationLogFactory.php',
    description: 'Factory for generating medication administration logs.',
    code: `<?php

namespace Database\\Factories;

use App\\Models\\MedicationLog;
use App\\Models\\Resident;
use App\\Models\\Medication;
use App\\Models\\User;
use Illuminate\\Database\\Eloquent\\Factories\\Factory;

class MedicationLogFactory extends Factory
{
    protected $model = MedicationLog::class;

    public function definition(): array
    {
        return [
            'resident_id' => Resident::factory(),
            'medication_id' => Medication::factory(),
            'given_by' => User::factory(),
            'given_at' => $this->faker->dateTimeBetween('-5 days', 'now'),
            'status' => $this->faker->randomElement(['given', 'missed']),
        ];
    }
}`
  },
  {
    category: 'Factory',
    filename: 'VisitorFactory.php',
    path: 'database/factories/VisitorFactory.php',
    description: 'Factory for generating visitor records.',
    code: `<?php

namespace Database\\Factories;

use App\\Models\\Visitor;
use App\\Models\\Resident;
use Illuminate\\Database\\Eloquent\\Factories\\Factory;

class VisitorFactory extends Factory
{
    protected $model = Visitor::class;

    public function definition(): array
    {
        return [
            'resident_id' => Resident::factory(),
            'visitor_name' => $this->faker->name(),
            'relationship' => $this->faker->randomElement(['Son', 'Daughter', 'Spouse', 'Sibling', 'Nephew']),
            'visit_date' => $this->faker->dateTimeBetween('-7 days', 'now'),
        ];
    }
}`
  },

  // --- SEEDER ---
  {
    category: 'Seeder',
    filename: 'DatabaseSeeder.php',
    path: 'database/seeders/DatabaseSeeder.php',
    description: 'DatabaseSeeder class seeding Admin, Caregivers, Residents, Medications, Vitals, Medication Logs & Visitors.',
    code: `<?php

namespace Database\\Seeders;

use Illuminate\\Database\\Seeder;
use App\\Models\\User;
use App\\Models\\Resident;
use App\\Models\\Medication;
use App\\Models\\Vital;
use App\\Models\\MedicationLog;
use App\\Models\\Visitor;
use Illuminate\\Support\\Facades\\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create 1 Admin & 2 Caregivers
        $admin = User::create([
            'name' => 'Norazlan Bin Ismail (Admin)',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        $caregiver1 = User::create([
            'name' => 'Siti Nurhaliza Binti Ahmad',
            'email' => 'caregiver@test.com',
            'password' => Hash::make('password'),
            'role' => 'caregiver',
        ]);

        $caregiver2 = User::create([
            'name' => 'Ahmad Razak Bin Hassan',
            'email' => 'caregiver2@test.com',
            'password' => Hash::make('password'),
            'role' => 'caregiver',
        ]);

        $caregivers = [$caregiver1, $caregiver2];

        // 2. Create 15 Residents
        $residentsData = [
            ['name' => 'Hajah Fatimah Binti Abdullah', 'ic' => '450812-10-5234', 'dob' => '1945-08-12', 'gender' => 'Female', 'contact' => 'Ahmad bin Razali (Son) - 012-3456789', 'history' => 'Hypertension, Type 2 Diabetes Mellitus', 'room' => 'R101'],
            ['name' => 'Tan Sri Robert Chen', 'ic' => '420315-08-6123', 'dob' => '1942-03-15', 'gender' => 'Male', 'contact' => 'Grace Chen (Daughter) - 016-9876543', 'history' => 'Post-Stroke recovery, Mild Vascular Dementia', 'room' => 'R102'],
            ['name' => 'K. Muthusamy A/L Krishnan', 'ic' => '481105-05-5541', 'dob' => '1948-11-05', 'gender' => 'Male', 'contact' => 'Suresh Krishnan (Son) - 019-2233445', 'history' => 'Coronary Artery Disease, Hyperlipidemia', 'room' => 'R103'],
            ['name' => 'Hajah Aminah Binti Hamid', 'ic' => '500120-14-5088', 'dob' => '1950-01-20', 'gender' => 'Female', 'contact' => 'Mariam Binti Ibrahim (Daughter) - 013-8877665', 'history' => 'Early Stage Alzheimer Disease, Hypertension', 'room' => 'R104'],
            ['name' => 'Haji Othman Bin Mansor', 'ic' => '390630-10-5119', 'dob' => '1939-06-30', 'gender' => 'Male', 'contact' => 'Farid Bin Othman (Son) - 017-6543210', 'history' => 'Chronic Kidney Disease Stage 3, Gout', 'room' => 'R105'],
            ['name' => 'Wong Ah Kow', 'ic' => '460922-07-5331', 'dob' => '1946-09-22', 'gender' => 'Male', 'contact' => 'David Wong (Son) - 011-1234567', 'history' => 'Parkinson Disease, Chronic Back Pain', 'room' => 'R106'],
            ['name' => 'Zaiton Binti Kassim', 'ic' => '520418-02-5442', 'dob' => '1952-04-18', 'gender' => 'Female', 'contact' => 'Nurul Huda (Daughter) - 018-9988776', 'history' => 'Osteoporosis, Atrial Fibrillation', 'room' => 'R107'],
            ['name' => 'Devi A/P Ramanathan', 'ic' => '490708-08-6220', 'dob' => '1949-07-08', 'gender' => 'Female', 'contact' => 'Priya Raman (Niece) - 014-5544332', 'history' => 'Type 2 Diabetes, Diabetic Neuropathy', 'room' => 'R108'],
            ['name' => 'Haji Sulaiman Bin Yassin', 'ic' => '410214-01-5103', 'dob' => '1941-02-14', 'gender' => 'Male', 'contact' => 'Kamal Sulaiman (Son) - 012-7766554', 'history' => 'COPD, Hypertension', 'room' => 'R109'],
            ['name' => 'Lim Mei Ling', 'ic' => '531103-10-5890', 'dob' => '1953-11-03', 'gender' => 'Female', 'contact' => 'Kevin Lim (Son) - 016-3322110', 'history' => 'Rheumatoid Arthritis, Mild Depression', 'room' => 'R110'],
            ['name' => 'Haji Ramli Bin Mohamad', 'ic' => '440519-03-5287', 'dob' => '1944-05-19', 'gender' => 'Male', 'contact' => 'Salmah Binti Ramli (Daughter) - 019-8877112', 'history' => 'Congestive Heart Failure, Hypertension', 'room' => 'R111'],
            ['name' => 'Chiam Siew Hoon', 'ic' => '470830-08-5114', 'dob' => '1947-08-30', 'gender' => 'Female', 'contact' => 'Jason Chiam (Grandson) - 012-9900112', 'history' => 'Glaucoma, Hypertension', 'room' => 'R112'],
            ['name' => 'S. Rajendran A/L Subramaniam', 'ic' => '510212-06-5329', 'dob' => '1951-02-12', 'gender' => 'Male', 'contact' => 'Meena Rajendran (Wife) - 013-4455667', 'history' => 'Ischemic Heart Disease', 'room' => 'R113'],
            ['name' => 'Hajah Rohani Binti Yusof', 'ic' => '431201-10-5340', 'dob' => '1943-12-01', 'gender' => 'Female', 'contact' => 'Azman Bin Yusof (Nephew) - 017-3344556', 'history' => 'Vascular Dementia, Incontinence', 'room' => 'R114'],
            ['name' => 'Haji Mustaffa Bin Jaafar', 'ic' => '400714-11-5091', 'dob' => '1940-07-14', 'gender' => 'Male', 'contact' => 'Zulkifli Mustaffa (Son) - 011-8899001', 'history' => 'Type 2 Diabetes, Hypertension', 'room' => 'R115'],
        ];

        $residents = [];
        foreach ($residentsData as $res) {
            $residents[] = Resident::create([
                'name' => $res['name'],
                'ic_number' => $res['ic'],
                'dob' => $res['dob'],
                'gender' => $res['gender'],
                'emergency_contact' => $res['contact'],
                'medical_history' => $res['history'],
                'room_number' => $res['room'],
            ]);
        }

        // 3. Create 10 Medications
        $medsData = [
            ['name' => 'Amlodipine', 'dosage' => '5mg', 'instructions' => '1 tablet once daily in the morning.'],
            ['name' => 'Metformin HCl', 'dosage' => '500mg', 'instructions' => '1 tablet twice daily with meals.'],
            ['name' => 'Paracetamol', 'dosage' => '500mg', 'instructions' => '2 tablets PRN for pain or fever.'],
            ['name' => 'Atorvastatin', 'dosage' => '20mg', 'instructions' => '1 tablet once daily at bedtime.'],
            ['name' => 'Lisinopril', 'dosage' => '10mg', 'instructions' => '1 tablet once daily in the morning.'],
            ['name' => 'Omeprazole', 'dosage' => '20mg', 'instructions' => '1 capsule 30 mins before breakfast.'],
            ['name' => 'Salbutamol Inhaler', 'dosage' => '100mcg', 'instructions' => '2 puffs PRN for breathlessness.'],
            ['name' => 'Donepezil HCl', 'dosage' => '5mg', 'instructions' => '1 tablet once daily at night.'],
            ['name' => 'Aspirin (Ecotrin)', 'dosage' => '100mg', 'instructions' => '1 tablet once daily after lunch.'],
            ['name' => 'Calcium + Vit D3', 'dosage' => '600mg', 'instructions' => '1 tablet daily with food.'],
        ];

        $medications = [];
        foreach ($medsData as $med) {
            $medications[] = Medication::create($med);
        }

        // 4. Create 50 Vitals logs (with some critical BP > 140 or Temp > 37.5)
        for ($i = 0; $i < 50; $i++) {
            $resident = $residents[$i % count($residents)];
            $caregiver = $caregivers[$i % count($caregivers)];
            
            $isCritical = ($i % 6 === 0);
            $bpSys = $isCritical ? rand(142, 160) : rand(115, 138);
            $bpDia = $isCritical ? rand(90, 102) : rand(70, 88);
            $temp = $isCritical ? rand(376, 385) / 10.0 : rand(363, 372) / 10.0;

            Vital::create([
                'resident_id' => $resident->id,
                'recorded_by' => $caregiver->id,
                'bp_systolic' => $bpSys,
                'bp_diastolic' => $bpDia,
                'heart_rate' => rand(62, 98),
                'temperature' => $temp,
                'oxygen_level' => rand(95, 99),
                'created_at' => now()->subDays(rand(0, 7))->subHours(rand(1, 12)),
            ]);
        }

        // 5. Create 30 Medication Logs
        for ($i = 0; $i < 30; $i++) {
            $resident = $residents[$i % count($residents)];
            $medication = $medications[$i % count($medications)];
            $caregiver = $caregivers[$i % count($caregivers)];

            MedicationLog::create([
                'resident_id' => $resident->id,
                'medication_id' => $medication->id,
                'given_by' => $caregiver->id,
                'given_at' => now()->subDays(rand(0, 5))->subHours(rand(1, 8)),
                'status' => ($i % 8 === 0) ? 'missed' : 'given',
            ]);
        }

        // 6. Create 10 Visitor Logs
        $relationships = ['Son', 'Daughter', 'Spouse', 'Sibling', 'Nephew'];
        for ($i = 0; $i < 10; $i++) {
            $resident = $residents[$i % count($residents)];
            Visitor::create([
                'resident_id' => $resident->id,
                'visitor_name' => 'Family Visitor ' . ($i + 1),
                'relationship' => $relationships[$i % count($relationships)],
                'visit_date' => now()->subDays(rand(0, 6))->subHours(rand(2, 6)),
            ]);
        }
    }
}`
  }
];
