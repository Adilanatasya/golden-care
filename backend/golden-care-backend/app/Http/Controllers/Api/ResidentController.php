<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Resident;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

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

        $perPage = min(max($request->integer('per_page', 15), 1), 100);

        $residents = $query->orderBy('room_number', 'asc')->paginate($perPage);

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
        $resident = Resident::with(['vitals.recordedBy', 'visitors'])
            ->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $resident
        ]);
    }

    /**
     * Update resident profile details.
     */
    public function update(Request $request, Resident $resident): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'ic_number' => [
                'sometimes',
                'required',
                'string',
                Rule::unique('residents', 'ic_number')->ignore($resident->id),
            ],
            'dob' => 'sometimes|required|date',
            'gender' => 'sometimes|required|in:Male,Female',
            'emergency_contact' => 'sometimes|required|string|max:255',
            'medical_history' => 'sometimes|nullable|string',
            'room_number' => 'sometimes|required|string|max:50',
        ]);

        $resident->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Resident record updated',
            'data' => $resident->refresh()
        ]);
    }

    public function destroy(Resident $resident): JsonResponse
    {
        $resident->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Resident record deleted'
        ]);
    }

}
