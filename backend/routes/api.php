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

    