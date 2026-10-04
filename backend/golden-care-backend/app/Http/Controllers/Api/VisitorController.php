<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Visitor;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class VisitorController extends Controller
{
    /**
     * Display a listing of visitors.
     */
    public function index(): JsonResponse
    {
        $visitors = Visitor::with('resident')->latest()->paginate(20);

        return response()->json([
            'status' => 'success',
            'data' => $visitors
        ]);
    }

    /**
     * Record a new visitor entry.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'resident_id' => 'required|exists:residents,id',
            'visitor_name' => 'required|string|max:255',
            'relationship' => 'required|string|max:100',
            'contact_phone' => 'required|string|max:30',
            'check_in' => 'required|date',
            'status' => 'nullable|in:Checked In,Checked Out,Scheduled',
        ]);

        $validated['visit_date'] = $validated['check_in'];
        $validated['status'] = $validated['status'] ?? 'Checked In';

        $visitor = Visitor::create($validated);
        $visitor->load('resident');

        return response()->json([
            'status' => 'success',
            'message' => 'Visitor log created.',
            'data' => $visitor
        ], 201);
    }

    /**
     * Check a visitor into the care centre.
     */
    public function checkIn(Request $request, Visitor $visitor): JsonResponse
    {
        $validated = $request->validate([
            'occurred_at' => 'nullable|date',
        ]);

        $checkedInAt = $validated['occurred_at'] ?? now();

        $visitor->update([
            'check_in' => $checkedInAt,
            'check_out' => null,
            'status' => 'Checked In',
            'visit_date' => $checkedInAt,
        ]);

        $visitor->load('resident');

        return response()->json([
            'status' => 'success',
            'message' => 'Visitor checked in.',
            'data' => $visitor,
        ]);
    }

    /**
     * Check a visitor out of the care centre.
     */
    public function checkOut(Request $request, Visitor $visitor): JsonResponse
    {
        $validated = $request->validate([
            'occurred_at' => 'nullable|date',
        ]);

        $visitor->update([
            'check_out' => $validated['occurred_at'] ?? now(),
            'status' => 'Checked Out',
        ]);

        $visitor->load('resident');

        return response()->json([
            'status' => 'success',
            'message' => 'Visitor checked out.',
            'data' => $visitor,
        ]);
    }
}
