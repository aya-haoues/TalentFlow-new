<?php
// app/Http/Controllers/Api/JobController.php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Job;
use App\Models\Departement; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class JobController extends Controller
{
    /**
     * LISTE des offres (avec filtres)
     * GET /api/jobs
     */
    public function index(Request $request)
    {
        $query = Job::query();

        // 🔍 Filtres optionnels
        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }
        if ($request->filled('type_contrat')) {
            $query->where('type_contrat', $request->type_contrat);
        }
        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        }
        if ($request->filled('niveau_experience')) {
            $query->where('niveau_experience', $request->niveau_experience);
        }

        // évite le problème N+1 (1 requête au lieu de N)
        $jobs = $query->with(['department', 'creator'])
                      ->latest()
                      ->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $jobs
        ]);
    }

    /**
     * CRÉER une offre
     * POST /api/jobs
     */
    public function store(Request $request)
    {
        try {
            //  VALIDATION : règles exactes de ta migration
            $validated = $request->validate([
                'titre' => 'required|string|max:255',
                'department_id' => 'required|exists:departments,id',
                'type_contrat' => 'required|in:CDI,CDD,Stage,Alternance,Freelance',
                'niveau_experience' => 'required|in:junior,confirme,senior',
                'type_lieu' => 'required|in:remote,hybrid,onsite',
                'description' => 'required|string|min:50',
                'competences_requises' => 'required|array|min:1',
                'competences_requises.*' => 'string|max:50',
                'statut' => 'nullable|in:brouillon,publiee,pausee,archivee',
                'nombre_postes' => 'nullable|integer|min:1',
                'date_limite' => 'nullable|date|after_or_equal:today',
                'salaire_min' => 'nullable|integer|min:0',
                'salaire_max' => 'nullable|integer|min:0|gte:salaire_min',
            ]);

            // RH connecté (sécurité)
            $job = Job::create([
                ...$validated,
                'created_by' => Auth::id(),
                'statut' => $validated['statut'] ?? 'brouillon'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Offre créée avec succès',
                'data' => $job->load(['department', 'creator'])
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            // Laravel renvoie automatiquement 422 avec les erreurs
            throw $e;
        } catch (\Exception $e) {
            Log::error('Erreur création offre: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur serveur lors de la création.'
            ], 500);
        }
    }

    /**
     * AFFICHER une offre
     * GET /api/jobs/{id}
     */
    public function show(Job $job)
    {
        // Si non trouvé → 404 automatique

        return response()->json([
            'success' => true,
            'data' => $job->load(['department', 'creator', 'applications'])
        ]);
    }

    /**
     * MODIFIER une offre
     * PUT /api/jobs/{id}
     */
   public function update(Request $request, Job $job)
{
    
    try {
        $validated = $request->validate([
            'titre' => 'sometimes|required|string|max:255',
            'department_id' => 'sometimes|required|exists:departments,id',
            'type_contrat' => 'sometimes|required|in:CDI,CDD,Stage,Alternance,Freelance',
            'niveau_experience' => 'sometimes|required|in:junior,confirme,senior',
            'type_lieu' => 'sometimes|required|in:remote,hybrid,onsite',
            'description' => 'sometimes|required|string|min:50',
            'competences_requises' => 'sometimes|required|array|min:1',
            'competences_requises.*' => 'string|max:50',
            'statut' => 'sometimes|in:brouillon,publiee,pausee,archivee',
            'nombre_postes' => 'sometimes|nullable|integer|min:1',
            'date_limite' => 'sometimes|nullable|date',
            'salaire_min' => 'sometimes|nullable|integer|min:0',
            'salaire_max' => 'sometimes|nullable|integer|min:0|gte:salaire_min',
        ]);

        $job->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Offre mise à jour avec succès',
            'data' => $job->fresh() 
        ]);

    } catch (\Illuminate\Validation\ValidationException $e) {
        // Laravel gère automatiquement cette erreur → 422 Unprocessable Entity
        throw $e;
        
    } catch (\Exception $e) {
        Log::error('Erreur mise à jour offre: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Erreur serveur lors de la mise à jour.'
        ], 500);
    }
}
    /**
     * SUPPRIMER une offre
     * DELETE /api/jobs/{id}
     */
    public function destroy(Job $job)
    {
        if ($job->created_by !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Accès refusé.'
            ], 403);
        }

        // vérifier avant de supprimer si des candidatures existent
        if ($job->applications()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer : des candidatures sont liées à cette offre.'
            ], 400);
        }

        $job->delete();

        return response()->json([
            'success' => true,
            'message' => 'Offre supprimée'
        ]);
    }
}