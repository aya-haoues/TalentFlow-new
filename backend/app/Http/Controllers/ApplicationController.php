<?php

namespace App\Http\Controllers;

use App\Models\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth; // Ajout de l'import

class ApplicationController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'job_id'            => 'required|exists:jobs,id',
            'cv'                => 'required|mimes:pdf|max:2048',
            'lettre_motivation' => 'nullable|string|min:10',
        ]);

        // Correction : Utilisation de Auth::id() pour éviter l'erreur Intelephense
        $userId = Auth::id(); 

        $alreadyApplied = Application::where('user_id', $userId)
                                     ->where('job_id', $request->job_id)
                                     ->exists();
        
        if ($alreadyApplied) {
            return response()->json(['message' => 'Vous avez déjà postulé à cette offre.'], 422);
        }

        $path = $request->file('cv')->store('cvs', 'public');

        $application = Application::create([
            'user_id'           => $userId, // Correction ici
            'job_id'            => $request->job_id,
            'cv_path'           => $path,
            'lettre_motivation' => $request->lettre_motivation,
            'statut'            => 'en_attente',
            'date_candidature'  => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Candidature envoyée avec succès !',
            'data'    => $application
        ], 201);
    }

    public function myApplications()
    {
        // Correction ici aussi
        $apps = Application::with('job')
                            ->where('user_id', Auth::id()) 
                            ->orderBy('created_at', 'desc')
                            ->get();
        return response()->json($apps);
    }
}