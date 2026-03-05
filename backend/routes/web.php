<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;


Route::get('/', function () {
    return view('welcome');
});


// ✅ Routes OAuth dans web.php (sessions + redirects HTTP)
Route::prefix('api/auth')->group(function () {
    Route::get('/google/redirect',   [AuthController::class, 'redirectToGoogle']);
    Route::get('/google/callback',   [AuthController::class, 'handleGoogleCallback']);
    Route::get('/linkedin/redirect', [AuthController::class, 'redirectToLinkedIn']);
    Route::get('/linkedin/callback', [AuthController::class, 'handleLinkedInCallback']);
});
