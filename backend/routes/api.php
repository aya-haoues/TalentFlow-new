<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\RhController;
use App\Http\Controllers\JobController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\CandidatController;
use App\Http\Controllers\AdminController;



Route::post('/login/admin', [AuthController::class, 'loginAdmin']);


/* ═══════════════════════════════════════════════════════
   🔐 ROUTES ADMIN (auth:sanctum + role:admin requis)
   ═══════════════════════════════════════════════════════ */
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {

    // Stats globales
    Route::get('/stats', [AdminController::class, 'stats']);

    // Gestion utilisateurs
    Route::get('/users',               [AdminController::class, 'index']);
    Route::get('/users/pending',       [AdminController::class, 'pending']);
    Route::post('/users/{id}/approve', [AdminController::class, 'approve']);
    Route::post('/users/{id}/reject',  [AdminController::class, 'reject']);
    Route::post('/users/{id}/toggle',  [AdminController::class, 'toggleBlock']);
    Route::delete('/users/{id}',       [AdminController::class, 'destroy']);

    // Gestion départements
    Route::get('/departments',         [AdminController::class, 'departments']);
    Route::post('/departments',        [AdminController::class, 'storeDepartment']);
    Route::put('/departments/{id}',    [AdminController::class, 'updateDepartment']);
    Route::delete('/departments/{id}', [AdminController::class, 'destroyDepartment']);
});


Route::middleware('auth:sanctum')->prefix('candidat')->group(function () {
    Route::get('/profile',           [CandidatController::class, 'showProfile']);
    Route::post('/profile',          [CandidatController::class, 'updateProfile']);
    Route::get('/dashboard/stats',   [CandidatController::class, 'dashboardStats']);
    Route::get('/applications',      [CandidatController::class, 'myApplications']);
});

Route::middleware('api')->group(function () {
    Route::post('/register/candidat', [AuthController::class, 'registerCandidat']);
    Route::post('/register/rh', [AuthController::class, 'registerRh']);
    Route::post('/register/manager', [AuthController::class, 'registerManager']);
    
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/login/rh', [AuthController::class, 'login']);
    Route::post('/login/manager', [AuthController::class, 'login']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});



    

Route::middleware(['auth:sanctum', 'role:rh'])
    ->prefix('rh')
    ->group(function () {
        
        Route::get('/jobs', [JobController::class, 'index']);          
        Route::post('/jobs', [JobController::class, 'store']);          
        Route::get('/jobs/{job}', [JobController::class, 'show']);     
        Route::put('/jobs/{job}', [JobController::class, 'update']);    
        Route::delete('/jobs/{job}', [JobController::class, 'destroy']); 
    });
    
// Route PUBLIQUE pour charger les départements dans les formulaires
Route::get('/departments', [DepartmentController::class, 'index']);

// Route pour récupérer l'utilisateur connecté (frontend)
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});







// ✅ Liste des offres publiées (visible par tous)
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

// ✅ Détail d'une offre (visible par tous)
Route::get('/jobs/{id}', function ($id) {
    $job = \App\Models\Job::with(['department'])
        ->where('id', $id)
        ->where('statut', 'publiee')
        ->first();
    
    if (!$job) {
        return response()->json([
            'success' => false,
            'message' => 'Offre non trouvée'
        ], 404);
    }
    
    return response()->json([
        'success' => true,
        'data' => $job
    ]);
});



Route::middleware('auth:sanctum')->group(function () {
    Route::post('/applications', [ApplicationController::class, 'store']);
});



// backend/routes/api.php

/* ═══════════════════════════════════════════════════════
   👤 ROUTES CANDIDAT (auth:sanctum requis)
   ═══════════════════════════════════════════════════════ */
Route::middleware('auth:sanctum')->prefix('candidat')->group(function () {
    Route::get('/applications', [ApplicationController::class, 'myApplications']);
    Route::get('/applications/{application}', [ApplicationController::class, 'show']);
    Route::get('/dashboard/stats', [ApplicationController::class, 'candidatStats']);
});

/* ═══════════════════════════════════════════════════════
   👔 ROUTES RH (auth:sanctum + role:rh requis)
   ═══════════════════════════════════════════════════════ */
Route::middleware(['auth:sanctum', 'role:rh'])->prefix('rh')->group(function () {
    Route::get('/applications/stats', [ApplicationController::class, 'statsRh']);       // ✅ en premier
    Route::get('/applications', [ApplicationController::class, 'indexRh']);
    Route::get('/applications/{application}', [ApplicationController::class, 'showRh']);
    Route::patch('/applications/{application}/status', [ApplicationController::class, 'updateStatus']);
});
/* ═══════════════════════════════════════════════════════
   📤 CRÉER UNE CANDIDATURE (auth:sanctum requis)
   ═══════════════════════════════════════════════════════ */
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/applications', [ApplicationController::class, 'store']);
});