<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->api(prepend: [   // Ajouter au début du groupe api 
            \Illuminate\Http\Middleware\HandleCors::class,  // CORS en tête de pipeline
        ]);

        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,    // utilisé via 'role:admin'
            'auth.mongo' => \App\Http\Middleware\MongoTokenAuth::class,  // ← ajouter

        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {

    // ✅ 404 — Ressource introuvable
    $exceptions->render(function (
        \Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e,
        \Illuminate\Http\Request $request
    ) {
        if ($request->is('api/*')) {
            return response()->json([
                'success' => false,
                'message' => 'Ressource introuvable.',
            ], 404);
        }
    });

    // ✅ 401 — Non authentifié
    $exceptions->render(function (
        \Illuminate\Auth\AuthenticationException $e,
        \Illuminate\Http\Request $request
    ) {
        if ($request->is('api/*')) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié. Veuillez vous connecter.',
            ], 401);
        }
    });

    // ✅ Éviter les logs dupliqués
    $exceptions->dontReportDuplicates();

})->create();
