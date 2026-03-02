<?php
// routes/api.php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\JobController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\ApplicationController;

// ✅ Groupe API avec middleware 'api'
Route::middleware('api')->group(function () {

    // 🔐 AUTHENTIFICATION
    Route::post('/register/candidat', [AuthController::class, 'registerCandidat']);
    Route::post('/register/rh', [AuthController::class, 'registerRh']);
    Route::post('/register/manager', [AuthController::class, 'registerManager']);
    
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/login/candidat', [AuthController::class, 'loginCandidat']);
    Route::post('/login/rh', [AuthController::class, 'loginRh']);
    Route::post('/login/manager', [AuthController::class, 'loginManager']);

    // 🔗 AUTH SOCIALE
    Route::prefix('auth')->group(function () {
        Route::get('/google/redirect', [AuthController::class, 'redirectToGoogle']);
        Route::get('/google/callback', [AuthController::class, 'handleGoogleCallback']);
        Route::get('/linkedin/redirect', [AuthController::class, 'redirectToLinkedIn']);
        Route::get('/linkedin/callback', [AuthController::class, 'handleLinkedInCallback']);
    });

    // 🌍 ROUTES PUBLIQUES - À METTRE AVANT LES ROUTES PROTÉGÉES
    // ✅ Offres visibles par tous (candidats)
    Route::get('/jobs', function () {
        $jobs = \App\Models\Job::with(['department'])
            ->where('statut', 'publiee')
            ->latest()
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $jobs
        ]);
    });

    Route::get('/jobs/{id}', function ($id) {
        $job = \App\Models\Job::with(['department'])
            ->where('id', $id)
            ->where('statut', 'publiee')
            ->first();
        
        if (!$job) {
            return response()->json(['success' => false, 'message' => 'Offre non trouvée'], 404);
        }
        
        return response()->json(['success' => true, 'data' => $job]);
    });

    // 📋 Départements (public pour les formulaires)
    Route::get('/departments', [DepartmentController::class, 'index']);

    // 🔐 ROUTES PROTÉGÉES (auth:sanctum requis)
    Route::middleware('auth:sanctum')->group(function () {
        
        // 👤 Utilisateur connecté
        Route::get('/user', function (Request $request) {
            return $request->user();
        });
        Route::get('/me', function (Request $request) {
            return $request->user();
        });
        Route::post('/logout', [AuthController::class, 'logout']);

        // 👨‍💼 ROUTES RH UNIQUEMENT
        Route::middleware('role:rh')->prefix('rh')->group(function () {
            Route::get('/jobs', [JobController::class, 'index']);              // GET /api/rh/jobs
            Route::post('/jobs', [JobController::class, 'store']);             // POST /api/rh/jobs
            Route::get('/jobs/{job}', [JobController::class, 'show']);         // GET /api/rh/jobs/1
            Route::put('/jobs/{job}', [JobController::class, 'update']);       // PUT /api/rh/jobs/1
            Route::patch('/jobs/{job}', [JobController::class, 'update']);     // PATCH /api/rh/jobs/1
            Route::delete('/jobs/{job}', [JobController::class, 'destroy']);   // DELETE /api/rh/jobs/1
        });
    });

    Route::middleware('auth:sanctum')->group(function () {
    Route::post('/applications', [ApplicationController::class, 'store']);
    Route::get('/my-applications', [ApplicationController::class, 'myApplications']);
});
});