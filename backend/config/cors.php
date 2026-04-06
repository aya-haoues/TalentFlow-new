<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    // ✅ Routes concernées par le CORS
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'auth/*'],

    // ✅ Méthodes HTTP autorisées
    'allowed_methods' => ['*'],

    // ❌ IMPORTANT : Ne PAS utiliser '*' quand supports_credentials = true
    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:5173'),
        'http://localhost:5173',      // Vite dev server
        'http://127.0.0.1:5173',      // Alternative
        // Ajoute ton domaine de production plus tard :
        // 'https://talentflow.tn',
    ],

    'allowed_origins_patterns' => [],

    // ✅ Headers autorisés dans les requêtes
    'allowed_headers' => ['*'],

    // ✅ Headers exposés dans les réponses
    'exposed_headers' => [],

    // ✅ Durée de cache du preflight request (0 = désactivé)
    'max_age' => 0,

    // ✅ OBLIGATOIRE : true si tu envoies des credentials (cookies, Authorization header)
    'supports_credentials' => true,
];