<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return string|null
     */
    protected function redirectTo(Request $request): ?string
    {
        // ✅ SI requête API (attend JSON) → NE PAS rediriger → Retourne 401 JSON automatiquement
        if ($request->expectsJson()) {
            return null;
        }
        
        // Pour les routes web → rediriger vers login
        return route('login');
    }
}