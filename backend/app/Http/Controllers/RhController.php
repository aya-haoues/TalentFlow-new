<?php
// app/Http/Controllers/RhController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class RhController extends Controller
{
    // ✅ Plus de __construct avec middleware
    // La protection est gérée par la route

    public function getStats()
    {
        // auth()->user() fonctionne car la route
        // a déjà vérifié que l'user est connecté
        return response()->json([
            'success' => true,
            'data' => [
                'total_candidates'     => 42,
                'active_offers'        => 8,
                'interviews_today'     => 3,
                'pending_applications' => 15
            ]
        ]);
    }

    public function getOffres()
    {
        return response()->json([
            'success' => true,
            'data'    => []
        ]);
    }
}