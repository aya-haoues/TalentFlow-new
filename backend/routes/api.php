<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

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