<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\JobController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\CandidatController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\PasswordResetController;  // ← ajouter l'import
use App\Http\Controllers\EmailVerificationController;  // ← ajouter l'import

// ── Vérification Email ────────────────────────────────
Route::get('/email/verify',
    [EmailVerificationController::class, 'notice'])
    ->middleware('auth.mongo')
    ->name('verification.notice');

Route::get('/email/verify/{id}/{hash}',
    [EmailVerificationController::class, 'verify'])
    ->middleware(['auth.mongo', 'signed'])
    ->name('verification.verify');

Route::post('/email/resend-verification',
    [EmailVerificationController::class, 'resend'])
    ->middleware(['auth.mongo', 'throttle:6,1'])
    ->name('verification.send');


// ── Mot de passe oublié ────────────────────────────────
Route::middleware('throttle:public')->group(function () {
    Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLink'])->name('password.email');
    Route::post('/reset-password',  [PasswordResetController::class, 'reset'])        ->name('password.update');
});

/* ═══════════════════════════════════════════════════════
   🌐 ROUTES PUBLIQUES
   ═══════════════════════════════════════════════════════ */

// OAuth — stateless, pas de throttle
Route::prefix('auth')->name('auth.')->group(function () {
    Route::get('/google/redirect',   [AuthController::class, 'redirectToGoogle'])  ->name('google.redirect');
    Route::get('/google/callback',   [AuthController::class, 'handleGoogleCallback'])->name('google.callback');
    Route::get('/linkedin/redirect', [AuthController::class, 'redirectToLinkedIn']) ->name('linkedin.redirect');
    Route::get('/linkedin/callback', [AuthController::class, 'handleLinkedInCallback'])->name('linkedin.callback');
});

// Inscription & Connexion
Route::middleware('throttle:public')->name('auth.')->group(function () {
    Route::post('/register/candidat', [AuthController::class, 'registerCandidat'])->name('register.candidat');
    Route::post('/register/rh',       [AuthController::class, 'registerRh'])      ->name('register.rh');
    Route::post('/register/manager',  [AuthController::class, 'registerManager']) ->name('register.manager');
    Route::post('/login',             [AuthController::class, 'login'])            ->name('login');
    Route::post('/login/admin',       [AuthController::class, 'loginAdmin'])       ->name('login.admin');

    // ✅ Ajouter ces deux routes
    Route::post('/login/rh',          [AuthController::class, 'login'])            ->name('login.rh');
    Route::post('/login/manager',     [AuthController::class, 'login'])            ->name('login.manager');
});


// Offres publiées
Route::get('/jobs',      [JobController::class, 'publicIndex'])->name('jobs.index');
Route::get('/jobs/{job}', [JobController::class, 'publicShow'])->name('jobs.show');
//           ↑
//  Route Model Binding — Laravel trouve le Job automatiquement

// Départements
Route::get('/departments', [DepartmentController::class, 'index'])->name('departments.index');

/* ═══════════════════════════════════════════════════════
   🔐 ROUTES AUTHENTIFIÉES
   ═══════════════════════════════════════════════════════ */

Route::middleware(['auth.mongo', 'throttle:api'])->group(function () {

    Route::get('/user',    fn(Request $r) => $r->user())->name('user.me');
    Route::post('/logout', [AuthController::class, 'logout'])->name('auth.logout');

    /* ── Candidat ── */
    Route::prefix('candidat')->name('candidat.')->group(function () {
        Route::get('/profile',  [CandidatController::class, 'showProfile'])  ->name('profile.show');
        Route::post('/profile', [CandidatController::class, 'updateProfile'])->name('profile.update');
        Route::get('/dashboard/stats', [CandidatController::class, 'dashboardStats'])->name('dashboard.stats');
        Route::get('/applications',              [ApplicationController::class, 'myApplications'])->name('applications.index');
        Route::get('/applications/{application}',[ApplicationController::class, 'show'])          ->name('applications.show');
        //                        ↑ Route Model Binding
    });

    Route::post('/applications', [ApplicationController::class, 'store'])->name('applications.store');

    /* ── RH ── */
    Route::middleware('role:rh')->prefix('rh')->name('rh.')->group(function () {
        // ✅ stats avant {application} — évite conflit
        Route::get('/applications/stats', [ApplicationController::class, 'statsRh'])->name('applications.stats');

        Route::get('/jobs',           [JobController::class, 'index']) ->name('jobs.index');
        Route::post('/jobs',          [JobController::class, 'store']) ->name('jobs.store');
        Route::get('/jobs/{job}',     [JobController::class, 'show'])  ->name('jobs.show');
        Route::put('/jobs/{job}',     [JobController::class, 'update'])->name('jobs.update');
        Route::delete('/jobs/{job}',  [JobController::class, 'destroy'])->name('jobs.destroy');
        //              ↑ Route Model Binding

        Route::get('/applications',              [ApplicationController::class, 'indexRh']) ->name('applications.index');
        Route::get('/applications/{application}',[ApplicationController::class, 'showRh'])  ->name('applications.show');
        Route::patch('/applications/{application}/status', [ApplicationController::class, 'updateStatus'])->name('applications.status');
    });

    /* ── Admin ── */
    Route::middleware('role:admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/stats', [AdminController::class, 'stats'])->name('stats');

        // ✅ pending avant {user} — évite conflit
        Route::get('/users/pending',         [AdminController::class, 'pending'])    ->name('users.pending');
        Route::get('/users',                 [AdminController::class, 'index'])      ->name('users.index');
        Route::post('/users/{user}/approve', [AdminController::class, 'approve'])   ->name('users.approve');
        Route::post('/users/{user}/reject',  [AdminController::class, 'reject'])    ->name('users.reject');
        Route::post('/users/{user}/toggle',  [AdminController::class, 'toggleBlock'])->name('users.toggle');
        Route::delete('/users/{user}',       [AdminController::class, 'destroy'])   ->name('users.destroy');
        //                    ↑ Route Model Binding

        Route::get('/departments',              [AdminController::class, 'departments'])     ->name('departments.index');
        Route::post('/departments',             [AdminController::class, 'storeDepartment']) ->name('departments.store');
        Route::put('/departments/{department}', [AdminController::class, 'updateDepartment'])->name('departments.update');
        Route::delete('/departments/{department}',[AdminController::class,'destroyDepartment'])->name('departments.destroy');
        //                         ↑ Route Model Binding
    });
});

/* ═══════════════════════════════════════════════════════
   🚫 FALLBACK — Toujours en dernier
   ═══════════════════════════════════════════════════════ */
Route::fallback(function () {
    return response()->json([
        'success' => false,
        'message' => 'Route introuvable',
    ], 404);
});

// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/email/resend-verification', [EmailVerificationController::class, 'resend']);
});
