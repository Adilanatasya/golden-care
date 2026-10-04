<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Resident;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;

class VitalEmergencyAlertTest extends TestCase
{
    use RefreshDatabase;

    public function test_vitals_exceeding_threshold_triggers_telegram_http_post(): void
    {
        Http::fake([
            'https://api.telegram.org/bot*' => Http::response(['ok' => true, 'result' => ['message_id' => 123]], 200),
        ]);

        /** @var \App\Models\User $caregiver */
        $caregiver = User::factory()->create(['role' => 'caregiver']);
        $resident = Resident::factory()->create(['name' => 'Hajah Fatimah', 'room_number' => '201']);

        Sanctum::actingAs($caregiver);

        $response = $this->postJson('/api/vitals', [
            'resident_id' => $resident->id,
            'bp_systolic' => 155,
            'bp_diastolic' => 95,
            'heart_rate' => 88,
            'temperature' => 38.2,
            'oxygen_level' => 96,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'status' => 'success',
                'is_critical' => true,
                'telegram_dispatched' => true,
            ]);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'api.telegram.org') &&
                   str_contains($request['text'], 'Hajah Fatimah') &&
                   str_contains($request['text'], '155/95');
        });
    }

    public function test_normal_vitals_do_not_trigger_telegram_post(): void
    {
        Http::fake();

        /** @var \App\Models\User $caregiver */
        $caregiver = User::factory()->create(['role' => 'caregiver']);
        $resident = Resident::factory()->create();

        Sanctum::actingAs($caregiver);

        $response = $this->postJson('/api/vitals', [
            'resident_id' => $resident->id,
            'bp_systolic' => 120,
            'bp_diastolic' => 80,
            'heart_rate' => 72,
            'temperature' => 36.6,
            'oxygen_level' => 99,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'status' => 'success',
                'is_critical' => false,
            ]);

        Http::assertNothingSent();
    }
}