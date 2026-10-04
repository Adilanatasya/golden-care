<?php

namespace Database\Factories;

use App\Models\Resident;
use Illuminate\Database\Eloquent\Factories\Factory;

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
}