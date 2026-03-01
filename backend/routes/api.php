<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\RhController;
use App\Http\Controllers\JobController;
use App\Http\Controllers\DepartmentController;


Route::middleware('api')->group(function () {
    // ✅ INSCRIPTIONS SÉPARÉES PAR RÔLE
    Route::post('/register/candidat', [AuthController::class, 'registerCandidat']);
    Route::post('/register/rh', [AuthController::class, 'registerRh']);
    Route::post('/register/manager', [AuthController::class, 'registerManager']);
    
    // ✅ CONNEXIONS SÉPARÉES PAR URL
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/login/rh', [AuthController::class, 'login']);
    Route::post('/login/manager', [AuthController::class, 'login']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});


/**Route::middleware(['auth:sanctum', 'role:rh'])
    ->prefix('rh')
    ->group(function () {
        Route::apiResource('jobs', JobController::class);
    });*/


    

/// ✅ Routes PROTÉGÉES pour RH uniquement
Route::middleware(['auth:sanctum', 'role:rh'])
    ->prefix('rh')
    ->group(function () {
        
        Route::get('/jobs', [JobController::class, 'index']);           // GET /api/rh/jobs
        Route::post('/jobs', [JobController::class, 'store']);          // POST /api/rh/jobs
        Route::get('/jobs/{job}', [JobController::class, 'show']);      // GET /api/rh/jobs/1
        Route::put('/jobs/{job}', [JobController::class, 'update']);    // PUT /api/rh/jobs/1
        Route::delete('/jobs/{job}', [JobController::class, 'destroy']); // DELETE /api/rh/jobs/1
        
    });
    
// ✅ Route PUBLIQUE pour charger les départements dans les formulaires
Route::get('/departments', [DepartmentController::class, 'index']);

// ✅ Route pour récupérer l'utilisateur connecté (utile pour le frontend)
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

// ✅ Soumettre une candidature (nécessite authentification candidat)
/*Route::middleware('auth:sanctum')->post('/applications', function (\Illuminate\Http\Request $request) {
    $validated = $request->validate([
        'job_id' => 'required|exists:jobs,id',
        'message' => 'required|string|min:50',
        'cv_path' => 'nullable|string',
    ]);
    
    $application = \App\Models\Application::create([
        'job_id' => $validated['job_id'],
        'candidate_id' => auth()->id(),
        'message' => $validated['message'],
        'cv_path' => $validated['cv_path'] ?? null,
        'statut' => 'en_attente',
    ]);
    
    return response()->json([
        'success' => true,
        'message' => 'Candidature envoyée',
        'data' => $application
    ], 201);
});*/








