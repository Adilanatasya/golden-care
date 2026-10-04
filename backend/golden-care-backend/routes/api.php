<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ResidentController;
use App\Http\Controllers\Api\VitalController;
use App\Http\Controllers\Api\VisitorController;
use App\Http\Controllers\Api\StaffController;

use App\Models\User;
use App\Models\Resident;
use App\Models\Vital;
use App\Models\Visitor;

/*
|--------------------------------------------------------------------------
| Golden Care API Routes (Laravel 13)
|--------------------------------------------------------------------------
*/

// ============================================================
// PUBLIC ROUTES
// ============================================================

// Public Health Check
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'app' => 'Golden Care FYP API'
    ]);
});

// Login
Route::post('/login', [AuthController::class, 'login']);

// ============================================================
// PROTECTED ROUTES
// ============================================================

Route::middleware('auth:sanctum')->group(function () {

    // --------------------------------------------------------
    // Authentication
    // --------------------------------------------------------

    // Get currently authenticated user
    Route::get('/user', function (Request $request) {
        return response()->json([
            'status' => 'success',
            'data' => $request->user()
        ]);
    });

    // Logout
    Route::post('/logout', [AuthController::class, 'logout']);


    // --------------------------------------------------------
    // Residents
    // --------------------------------------------------------

    // Authenticated users can view, update and delete residents.
    // Creating a resident is restricted to admin.
    Route::apiResource('residents', ResidentController::class)
        ->except(['store']);

    // --------------------------------------------------------
    // ADMIN ONLY
    // --------------------------------------------------------

    Route::middleware('role:admin')->group(function () {

        // Create new resident
        Route::post('/residents', [ResidentController::class, 'store']);

        // Staff account management
        Route::apiResource('staff', StaffController::class)
            ->except(['show']);


        // ----------------------------------------------------
        // Admin Summary Report
        // ----------------------------------------------------

        Route::get('/reports/summary', function () {

            // Total residents
            $totalResidents = Resident::count();

            // Total caregivers
            $totalCaregivers = User::where('role', 'caregiver')->count();

            // Total vital records
            $totalVitals = Vital::count();

            // Critical vital records
            $criticalVitals = Vital::where(function ($query) {

                $query->where('bp_systolic', '>', 140)
                      ->orWhere('temperature', '>', 37.5);

            })->count();

            // Total visitors
            $totalVisitors = Visitor::count();

            $visitorsCheckedIn = Visitor::where(
                'status',
                'Checked In'
            )->count();


            return response()->json([
                'status' => 'success',

                'report' => 'Admin summary analytics',

                'data' => [

                    'total_residents' => $totalResidents,

                    'total_caregivers' => $totalCaregivers,

                    'total_vitals' => $totalVitals,

                    'critical_vitals' => $criticalVitals,

                    'total_visitors' => $totalVisitors,

                    'visitors_checked_in' => $visitorsCheckedIn,
                ]
            ]);
        });
    });


    // --------------------------------------------------------
    // Vitals & Health Tracking
    // --------------------------------------------------------

    // View vitals
    Route::get('/vitals', [VitalController::class, 'index']);

    // Record new vital
    Route::post('/vitals', [VitalController::class, 'store']);


    // --------------------------------------------------------
    // Visitor Tracking
    // --------------------------------------------------------

    // View visitor logs
    Route::get('/visitors', [VisitorController::class, 'index']);

    // Record visitor
    Route::post('/visitors', [VisitorController::class, 'store']);

    // Update visitor arrival and departure status
    Route::patch('/visitors/{visitor}/check-in', [VisitorController::class, 'checkIn']);
    Route::patch('/visitors/{visitor}/check-out', [VisitorController::class, 'checkOut']);

});
