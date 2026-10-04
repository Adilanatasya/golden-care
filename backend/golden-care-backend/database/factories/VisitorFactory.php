<?php

namespace Database\Factories;

use App\Models\Visitor;
use App\Models\Resident;
use Illuminate\Database\Eloquent\Factories\Factory;

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
}