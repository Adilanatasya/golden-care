<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Resident;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class ResidentAdmissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_register_new_resident(): void
    {
        /** @var \App\Models\User $admin */
        $admin = User::factory()->create(['role' => 'admin']);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/residents', [
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
        /** @var \App\Models\User $caregiver */
        $caregiver = User::factory()->create(['role' => 'caregiver']);

        Sanctum::actingAs($caregiver);

        $response = $this->postJson('/api/residents', [
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

    public function test_authenticated_user_can_view_paginated_residents(): void
    {
        $user = User::factory()->create(['role' => 'caregiver']);
        Resident::factory()->count(3)->create();

        Sanctum::actingAs($user);

        $this->getJson('/api/residents?per_page=2')
            ->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(2, 'data.data')
            ->assertJsonPath('data.per_page', 2)
            ->assertJsonPath('data.total', 3);
    }

    public function test_admin_can_update_all_resident_profile_fields(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $resident = Resident::factory()->create();

        Sanctum::actingAs($admin);

        $this->putJson("/api/residents/{$resident->id}", [
            'name' => 'Updated Resident',
            'ic_number' => $resident->ic_number,
            'dob' => '1948-03-20',
            'gender' => 'Female',
            'emergency_contact' => '011-2223334 (Daughter - Aina)',
            'medical_history' => 'Hypertension',
            'room_number' => 'R205',
        ])->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.name', 'Updated Resident')
            ->assertJsonPath('data.dob', '1948-03-20')
            ->assertJsonPath('data.room_number', 'R205');

        $this->assertDatabaseHas('residents', [
            'id' => $resident->id,
            'name' => 'Updated Resident',
            'room_number' => 'R205',
        ]);
    }

    public function test_admin_can_delete_resident(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $resident = Resident::factory()->create();

        Sanctum::actingAs($admin);

        $this->deleteJson("/api/residents/{$resident->id}")
            ->assertOk()
            ->assertJsonPath('status', 'success');

        $this->assertDatabaseMissing('residents', ['id' => $resident->id]);
    }
}
