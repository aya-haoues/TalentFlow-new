<?php

namespace App\Http\Controllers;

use App\Models\Job;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class JobController extends Controller
{
    /**
     * Liste des offres publiées — publique
     * GET /api/jobs
     */
    public function indexPublic(Request $request)
    {
        $query = Job::query();

        if ($request->filled('type_contrat')) {
            $query->where('type_contrat', $request->type_contrat);
        }
        if ($request->filled('niveau_experience')) {
            $query->where('niveau_experience', $request->niveau_experience);
        }
        if ($request->filled('type_lieu')) {
            $query->where('type_lieu', $request->type_lieu);
        }
        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        }
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('titre', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%");
            });
        }

        $jobs = $query->where('statut', 'publiee')
                      ->with(['department'])
                      ->latest()
                      ->paginate(10);

        return response()->json(['success' => true, 'data' => $jobs]);
    }

    /**
     * Détail d'une offre publiée — publique
     * GET /api/jobs/{id}
     */
    public function showPublic($id)
    {
        $job = Job::with(['department'])
                  ->where('id', $id)
                  ->where('statut', 'publiee')
                  ->first();

        if (!$job) {
            return response()->json([
                'success' => false,
                'message' => 'Offre non trouvée ou non publiée',
            ], 404);
        }

        return response()->json(['success' => true, 'data' => $job]);
    }

    /**
     * Liste des offres pour RH (tous statuts)
     * GET /api/rh/jobs
     */
    public function index(Request $request)
    {
        // ✅ Policy viewAny
        $this->authorize('viewAny', Job::class);

        $query = Job::query();

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

        $jobs = $query->with(['department', 'creator'])
                      ->latest()
                      ->paginate(10);

        return response()->json(['success' => true, 'data' => $jobs]);
    }

    /**
     * Détail d'une offre pour RH
     * GET /api/rh/jobs/{job}
     */
    public function show(Job $job)
    {
        // ✅ Policy view
        $this->authorize('view', $job);

        $job->load(['department', 'creator', 'applications']);

        return response()->json(['success' => true, 'data' => $job]);
    }

    /**
     * Créer une offre
     * POST /api/rh/jobs
     */
    public function store(Request $request)
    {
        // ✅ Policy create
        $this->authorize('create', Job::class);

        try {
            $validated = $request->validate([
                'titre'                  => 'required|string|max:255',
                'department_id'          => 'required|exists:departments,id',
                'type_contrat'           => 'required|in:CDI,CDD,Stage,Alternance,Freelance',
                'niveau_experience'      => 'required|in:junior,confirme,senior',
                'type_lieu'              => 'required|in:remote,hybrid,onsite',
                'description'            => 'required|string|min:50',
                'competences_requises'   => 'required|array|min:1',
                'competences_requises.*' => 'string|max:50',
                'statut'                 => 'nullable|in:brouillon,publiee,pausee,archivee',
                'nombre_postes'          => 'nullable|integer|min:1',
                'date_limite'            => 'nullable|date|after_or_equal:today',
                'salaire_min'            => 'nullable|integer|min:0',
                'salaire_max'            => 'nullable|integer|min:0|gte:salaire_min',
            ]);

            $job = Job::create([
                ...$validated,
                'created_by' => Auth::id(),
                'statut'     => $validated['statut'] ?? 'brouillon',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Offre créée avec succès',
                'data'    => $job->load(['department', 'creator']),
            ], 201);

        } catch (\Exception $e) {
            Log::error('Erreur création offre: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur serveur lors de la création.',
            ], 500);
        }
    }

    /**
     * Modifier une offre
     * PUT /api/rh/jobs/{job}
     */
    public function update(Request $request, Job $job)
    {
        // ✅ Policy update — seulement le créateur
        // Remplace l'ancienne absence de vérification
        $this->authorize('update', $job);

        try {
            $validated = $request->validate([
                'titre'                  => 'sometimes|required|string|max:255',
                'department_id'          => 'sometimes|required|exists:departments,id',
                'type_contrat'           => 'sometimes|required|in:CDI,CDD,Stage,Alternance,Freelance',
                'niveau_experience'      => 'sometimes|required|in:junior,confirme,senior',
                'type_lieu'              => 'sometimes|required|in:remote,hybrid,onsite',
                'description'            => 'sometimes|required|string|min:50',
                'competences_requises'   => 'sometimes|required|array|min:1',
                'competences_requises.*' => 'string|max:50',
                'statut'                 => 'sometimes|in:brouillon,publiee,pausee,archivee',
                'nombre_postes'          => 'sometimes|nullable|integer|min:1',
                'date_limite'            => 'sometimes|nullable|date',
                'salaire_min'            => 'sometimes|nullable|integer|min:0',
                'salaire_max'            => 'sometimes|nullable|integer|min:0|gte:salaire_min',
            ]);

            $job->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Offre mise à jour avec succès',
                'data'    => $job->fresh(),
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur mise à jour offre: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur serveur lors de la mise à jour.',
            ], 500);
        }
    }

    /**
     * Supprimer une offre
     * DELETE /api/rh/jobs/{job}
     */
    public function destroy(Job $job)
    {
        // ✅ Policy delete — remplace la vérif manuelle
        // Avant : if ($job->created_by !== Auth::id()) { abort(403) }
        $this->authorize('delete', $job);

        if ($job->applications()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer : des candidatures sont liées à cette offre.',
            ], 400);
        }

        $job->delete();

        return response()->json([
            'success' => true,
            'message' => 'Offre supprimée',
        ]);
    }
}