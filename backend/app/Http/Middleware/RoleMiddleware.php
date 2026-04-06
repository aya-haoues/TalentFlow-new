<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $role  Le rôle requis (ex: 'rh', 'candidat', 'manager')
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        // Vérification défensive — au cas où utilisé sans auth:sanctum
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié. Veuillez vous connecter.'
            ], 401);  
        }

        // Vérifier si le rôle de l'user est dans la liste des rôles autorisés
        if ($request->user()->role !== $role) {
            return response()->json([
                'success' => false,
                'message' => "Accès refusé : le rôle '{$role}' est requis pour accéder à cette ressource."
            ], 403);  
        }

        return $next($request);
    }
}