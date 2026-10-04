<?php

namespace Database\Factories;

use App\Models\Vital;
use App\Models\Resident;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

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
}