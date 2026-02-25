<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RhController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            if (Auth::user()->role !== 'rh') {
                return response()->json(['success' => false, 'message' => 'Accès refusé'], 403);
            }
            return $next($request);
        });
    }

    public function getStats()
    {
        // TODO: Implémenter la logique de récupération des statistiques
        return response()->json([
            'success' => true,
            'data' => [
                'total_candidates' => 42,
                'active_offers' => 8,
                'interviews_today' => 3,
                'pending_applications' => 15
            ]
        ]);
    }

    public function getOffres()
    {
        // TODO: Implémenter la récupération des offres depuis la base
        return response()->json([
            'success' => true,
            'data' => [
               
            ]
        ]);
    }

    // ... autres méthodes à implémenter plus tard ...
}