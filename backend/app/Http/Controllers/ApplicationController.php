<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApplicationResource;
use App\Models\Application;
use App\Models\Job;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use MongoDB\BSON\ObjectId; // Import important


class ApplicationController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        if (!$request->user()->hasVerifiedEmail()) {
            return response()->json([
                'success' => false,
                'message' => 'Veuillez vérifier votre adresse email avant de postuler.',
                'action'  => 'verify_email',
            ], 403);
        }

        $this->authorize('create', Application::class);

        $cvPath = null;

        try {
            $validated = $request->validate([
                'job_id'                  => 'required|string',
                'nom'                     => 'required|string|max:100',
                'prenom'                  => 'required|string|max:100',
                'email'                   => 'required|email',
                'telephone'               => 'required|string',
                'date_naissance'          => 'required|date',
                'genre'                   => 'required|in:homme,femme,autre',
                'nationalite'             => 'required|string',
                'motivation'              => 'required|string|min:50',
                'contract_type_preferred' => 'required|in:CDI,CDD,Stage,Alternance,Freelance',
                'cv'                      => 'required|file|mimes:pdf|max:5120',
                'linkedin_url'            => 'nullable|url',
                'github_url'              => 'nullable|url',
                'site_web'                => 'nullable|url',
                'adresse'                 => 'nullable|array',
                'experiences'             => 'nullable|string',
                'formations'              => 'nullable|string',
                'skills'                  => 'nullable|string',
                'challenges'              => 'nullable|string',
                'handicap_info'           => 'nullable|string',
            ]);

            // ✅ Validation manuelle du job
            $job = Job::where('id', $validated['job_id'])->first();
            if (!$job) {
                return response()->json([
                    'success' => false,
                    'message' => 'Offre introuvable.',
                ], 404);
            }

            if (!$job->is_accepting) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette offre n\'accepte plus de candidatures.',
                ], 422);
            }

            // Vérifier double candidature
            $alreadyApplied = Application::where('candidate_id', Auth::id())
                ->where('job_id', $validated['job_id'])
                ->exists();

            if ($alreadyApplied) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous avez déjà postulé à cette offre.',
                ], 422);
            }

            $cvPath = $request->file('cv')->store('cvs/' . date('Y/m'), 'public');

            $application = Application::create([
                'candidate_id'            => Auth::id(),
                'job_id'                  => $validated['job_id'],
                'nom'                     => $validated['nom'],
                'prenom'                  => $validated['prenom'],
                'email'                   => $validated['email'],
                'telephone'               => $validated['telephone'],
                'date_naissance'          => $validated['date_naissance'],
                'genre'                   => $validated['genre'],
                'nationalite'             => $validated['nationalite'],
                'motivation'              => $validated['motivation'],
                'lettre_motivation'       => $validated['motivation'],
                'contract_type_preferred' => $validated['contract_type_preferred'],
                'cv_path'                 => $cvPath,
                'linkedin_url'            => $validated['linkedin_url'] ?? null,
                'github_url'              => $validated['github_url'] ?? null,
                'site_web'                => $validated['site_web'] ?? null,
                'adresse'                 => $validated['adresse'] ?? null,
                'experiences'             => $validated['experiences'] ?? null,
                'formations'              => $validated['formations'] ?? null,
                'skills'                  => $validated['skills'] ?? null,
                'challenges'              => $validated['challenges'] ?? null,
                'handicap_info'           => $validated['handicap_info'] ?? null,
                'statut'                  => 'en_attente',
                'date_candidature'        => now(),
            ]);

            $application->load(['job.department']);

            return (new ApplicationResource($application))
                ->additional(['success' => true, 'message' => 'Candidature envoyée avec succès !'])
                ->response()
                ->setStatusCode(201);

        } catch (ValidationException $e) {
            if ($cvPath && Storage::disk('public')->exists($cvPath)) {
                Storage::disk('public')->delete($cvPath);
            }
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors'  => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            if ($cvPath && Storage::disk('public')->exists($cvPath)) {
                Storage::disk('public')->delete($cvPath);
            }
            Log::error('❌ Erreur création candidature', ['message' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur serveur : ' . $e->getMessage(),
            ], 500);
        }
    }

    public function myApplications(Request $request): JsonResponse
    {
        $perPage = min((int) $request->get('limit', 10), 50);

        $applications = Application::with(['job.department'])
            ->where('candidate_id', Auth::id())
            ->orderBy('date_candidature', 'desc')
            ->paginate($perPage);

        return ApplicationResource::collection($applications)
            ->additional(['success' => true])
            ->response();
    }

    public function show(Application $application): JsonResponse
    {
        $this->authorize('view', $application);
        $application->load(['candidate', 'job.department']);

        return (new ApplicationResource($application))
            ->additional(['success' => true])
            ->response();
    }

    public function candidatStats(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $stats = Cache::remember("candidat:stats:{$userId}", 300, function () use ($userId) {
            $applications = Application::where('candidate_id', $userId)->get(['statut']);
            return [
                'total'      => $applications->count(),
                'en_attente' => $applications->where('statut', 'en_attente')->count(),
                'acceptee'   => $applications->where('statut', 'acceptee')->count(),
                'en_cours'   => $applications->where('statut', 'en_cours')->count(),
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => array_merge($stats, [
                'profile_completion' => $this->calculateProfileCompletion($request->user()),
            ]),
        ]);
    }

    public function getStats()
{
    // Correction : s'assurer que l'on compte bien la collection MongoDB
    $stats = [
        // Utilisez 'total_applications' car c'est ce que votre hook useApplications attend
        'total_applications' => \App\Models\Application::count(), 
        'en_attente'         => \App\Models\Application::where('statut', 'en_attente')->count(),
        'acceptee'           => \App\Models\Application::where('statut', 'acceptee')->count(),
        'refusee'            => \App\Models\Application::where('statut', 'refusee')->count(),
        'en_cours'           => \App\Models\Application::where('statut', 'en_cours')->count(),
        'new_this_week'      => \App\Models\Application::where('created_at', '>=', now()->subDays(7))->count(),
        'total_jobs_active'  => \App\Models\Job::where('is_accepting', true)->count(),
    ];

    return response()->json([
        'success' => true,
        'data' => $stats
    ]);
}

public function indexRh(Request $request)
{
    $query = \App\Models\Application::with(['job', 'candidate']);

    // Filtre de recherche (Nom/Prénom ou Titre du Job)
    if ($request->filled('search')) {
        $search = $request->search;
        $query->where(function($q) use ($search) {
            $q->whereHas('candidate', function($c) use ($search) {
                $c->where('nom', 'like', "%$search%")->orWhere('prenom', 'like', "%$search%");
            })->orWhereHas('job', function($j) use ($search) {
                $j->where('title', 'like', "%$search%");
            });
        });
    }

    // Filtre de statut
    if ($request->filled('statut') && $request->statut !== 'all') {
        $query->where('statut', $request->statut); // Changé 'status' en 'statut'
    }

    $applications = $query->orderBy('created_at', 'desc')->paginate(15);

    // Retourne les données via une Resource pour un format JSON propre
    return ApplicationResource::collection($applications);
}


    public function showRh(Application $application): JsonResponse
    {
        $this->authorize('viewAsRh', $application);
        $application->load(['candidate', 'job.department']);

        return (new ApplicationResource($application))
            ->additional(['success' => true])
            ->response();
    }

    public function updateStatus(Request $request, Application $application): JsonResponse
    {
        $this->authorize('updateStatus', $application);

        $validated = $request->validate([
            'statut'         => 'required|in:en_attente,acceptee,refusee,retiree,en_cours',
            'notes_internes' => 'nullable|string|max:1000',
        ]);

        $oldStatus = $application->statut;

        $application->update([
            'statut'                     => $validated['statut'],
            'notes_internes'             => $validated['notes_internes'] ?? $application->notes_internes,
            'date_derniere_modification' => now(),
        ]);

        $job  = Job::where('id', $application->job_id)->first();
        $rhId = $job?->created_by;
        if ($rhId) Cache::forget("rh:applications:stats:{$rhId}");

        Log::info('🔄 Statut mis à jour', [
            'application_id' => $application->id,
            'old'            => $oldStatus,
            'new'            => $validated['statut'],
        ]);

        $application->load(['candidate', 'job.department']);

        return (new ApplicationResource($application))
            ->additional(['success' => true, 'message' => 'Statut mis à jour'])
            ->response();
    }

    public function statsRh(Request $request): JsonResponse
    {
        $userId = Auth::id();

        $stats = Cache::remember("rh:applications:stats:{$userId}", 300, function () use ($userId) {
            // ✅ whereHas remplacé — MongoDB
            $jobIds = Job::where('created_by', $userId)->pluck('id')->map(fn($id) => (string) $id)->toArray();
            $applications = Application::whereIn('job_id', $jobIds)->get(['statut']);

            return [
                'total_applications' => $applications->count(), // Changé 'total' en 'total_applications'
                'en_attente'         => $applications->where('statut', 'en_attente')->count(),
                'acceptee'           => $applications->where('statut', 'acceptee')->count(),
                'en_cours'           => $applications->where('statut', 'en_cours')->count(),
                'refusee'            => $applications->where('statut', 'refusee')->count(),
            ];
        });

        return response()->json(['success' => true, 'data' => $stats]);
    }

    private function calculateProfileCompletion(User $user): int
    {
        $score = 0;
        if ($user->name)         $score += 20;
        if ($user->email)        $score += 20;
        if ($user->telephone)    $score += 15;
        if ($user->linkedin_url) $score += 15;
        if ($user->avatar)       $score += 15;
        if (Application::where('candidate_id', $user->id)
                        ->whereNotNull('cv_path')->exists()) {
            $score += 15;
        }
        return min($score, 100);
    }
}