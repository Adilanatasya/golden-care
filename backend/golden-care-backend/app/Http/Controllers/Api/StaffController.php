<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StaffController extends Controller
{
    public function index(): JsonResponse
    {
        $staff = User::query()
            ->select([
                'id',
                'name',
                'email',
                'role',
                'status',
                'phone',
                'last_login',
                'created_at',
                'updated_at',
            ])
            ->orderBy('name')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $staff,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', Rule::in(['admin', 'caregiver'])],
            'status' => ['required', Rule::in(['Active', 'Inactive'])],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $staff = User::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Staff account created successfully.',
            'data' => $staff,
        ], 201);
    }

    public function update(Request $request, User $staff): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($staff->id),
            ],
            'role' => ['sometimes', 'required', Rule::in(['admin', 'caregiver'])],
            'status' => ['sometimes', 'required', Rule::in(['Active', 'Inactive'])],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);

        if (
            $request->user()->is($staff)
            && ($validated['status'] ?? $staff->status) === 'Inactive'
        ) {
            return response()->json([
                'status' => 'error',
                'message' => 'You cannot deactivate your own account.',
            ], 422);
        }

        if (
            $request->user()->is($staff)
            && ($validated['role'] ?? $staff->role) !== $staff->role
        ) {
            return response()->json([
                'status' => 'error',
                'message' => 'You cannot change your own role.',
            ], 422);
        }

        if (
            $staff->role === 'admin'
            && ($validated['role'] ?? $staff->role) !== 'admin'
            && User::where('role', 'admin')->count() <= 1
        ) {
            return response()->json([
                'status' => 'error',
                'message' => 'The last administrator cannot be changed to caregiver.',
            ], 422);
        }

        if (empty($validated['password'])) {
            unset($validated['password']);
        }

        $staff->update($validated);

        if ($staff->status === 'Inactive') {
            $staff->tokens()->delete();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Staff account updated successfully.',
            'data' => $staff->fresh(),
        ]);
    }

    public function destroy(Request $request, User $staff): JsonResponse
    {
        if ($request->user()->is($staff)) {
            return response()->json([
                'status' => 'error',
                'message' => 'You cannot delete your own account.',
            ], 422);
        }

        if (
            $staff->role === 'admin'
            && User::where('role', 'admin')->count() <= 1
        ) {
            return response()->json([
                'status' => 'error',
                'message' => 'The last administrator cannot be deleted.',
            ], 422);
        }

        if ($staff->vitals()->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => 'This staff member has recorded vital signs. Deactivate the account instead to preserve medical records.',
            ], 422);
        }

        $staff->tokens()->delete();
        $staff->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Staff account deleted successfully.',
        ]);
    }
}
