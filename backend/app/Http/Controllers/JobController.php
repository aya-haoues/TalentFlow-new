<?php

namespace App\Http\Controllers;

use App\Http\Resources\JobResource;
use App\Models\Job;
use App\Models\Department;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class JobController extends Controller
{
    public function publicIndex(Request $request): JsonResponse
    {
        $jobs = Job::where('statut', 'publiee')
                   ->where(function ($q) {
                       $q->whereNull('date_limite')
                         ->orWhere('date_limite', '>=', now());
                   })
                   ->with(['department'])
                   ->latest()
                   ->paginate(10);

        return JobResource::collection($jobs)
            ->additional(['success' => true])
            ->response();
    }

    public function publicShow($id): JsonResponse
    {
        $job = Job::where('id', $id)->first();

        if (!$job || !$job->is_published) {
            return response()->json([
                'success' => false,
                'message' => 'Offre non trouvée ou non publiée.',
            ], 404);
        }

        $job->load(['department']);

        return (new JobResource($job))
            ->additional(['success' => true])
            ->response();
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Job::class);

        $jobs = Job::when($request->filled('statut'),
                    fn($q) => $q->where('statut', $request->statut))
                ->when($request->filled('type_contrat'),
                    fn($q) => $q->where('type_contrat', $request->type_contrat))
                ->when($request->filled('department_id'),
                    fn($q) => $q->where('department_id', $request->department_id))
                ->when($request->filled('niveau_experience'),
                    fn($q) => $q->where('niveau_experience', $request->niveau_experience))
                ->where('created_by', Auth::id()) // ← RH voit seulement ses offres
                ->with(['department', 'creator'])
                ->latest()
                ->paginate(10);

        return JobResource::collection($jobs)
            ->additional(['success' => true])
            ->response();
    }

    public function show(Job $job): JsonResponse
    {
        $this->authorize('view', $job);
        $job->load(['department', 'creator', 'applications']);

        return (new JobResource($job))
            ->additional(['success' => true])
            ->response();
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Job::class);

        try {
            $validated = $request->validate([
                'titre'                  => 'required|string|max:255',
                'department_id'          => 'required|string',
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
                'salaire_max'            => 'nullable|integer|min:0',
            ]);

            // ✅ Validation manuelle département
            $department = Department::where('id', $validated['department_id'])->first();
            if (!$department) {
                return response()->json([
                    'success' => false,
                    'message' => 'Département introuvable.',
                    'errors'  => ['department_id' => ['Le département sélectionné est invalide.']],
                ], 422);
            }

            $job = Job::create([
                ...$validated,
                'created_by' => Auth::id(),
            ]);

            $job->load(['department', 'creator']);

            return (new JobResource($job))
                ->additional(['success' => true, 'message' => 'Offre créée avec succès'])
                ->response()
                ->setStatusCode(201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors'  => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            Log::error('Erreur création offre: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur serveur : ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, Job $job): JsonResponse
    {
        $this->authorize('update', $job);

        try {
            $validated = $request->validate([
                'titre'                  => 'sometimes|required|string|max:255',
                'department_id'          => 'sometimes|required|string',
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
                'salaire_max'            => 'sometimes|nullable|integer|min:0',
            ]);

            $job->update($validated);
            $job->load(['department', 'creator']);

            return (new JobResource($job))
                ->additional(['success' => true, 'message' => 'Offre mise à jour avec succès'])
                ->response();

        } catch (\Exception $e) {
            Log::error('Erreur mise à jour offre: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur serveur : ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Job $job): JsonResponse
    {
        $this->authorize('delete', $job);

        if ($job->applications()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer : des candidatures sont liées.',
            ], 400);
        }

        $job->delete();

        return response()->json([
            'success' => true,
            'message' => 'Offre supprimée avec succès.',
        ]);
    }
}