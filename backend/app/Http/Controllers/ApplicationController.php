<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\Builder;

class ApplicationController extends Controller
{
    /**
     * Candidat — soumettre une candidature
     * POST /api/applications
     */
    public function store(Request $request)
    {
        // ✅ Vérification douce — uniquement pour postuler
        if (!$request->user()->hasVerifiedEmail()) {
            return response()->json([
                'success' => false,
                'message' => 'Veuillez vérifier votre adresse email avant de postuler.',
                'action'  => 'verify_email',  // ← frontend peut afficher un modal
            ], 403);
        }

        // ✅ Policy create — seulement les candidats
        $this->authorize('create', Application::class);

        $cvPath = null;

        try {
            $validated = $request->validate([
                'job_id'                  => 'required|exists:jobs,id',
                'nom'                     => 'required|string|max:100',
                'prenom'                  => 'required|string|max:100',
                'email'                   => 'required|email|max:255',
                'telephone'               => 'required|string|max:20',
                'date_naissance'          => 'nullable|date|before:today',
                'genre'                   => 'nullable|in:homme,femme,autre,prefer_ne_pas_repondre',
                'nationalite'             => 'nullable|string|max:100',
                'adresse'                 => 'nullable|json',
                'linkedin_url'            => 'nullable|url|max:255',
                'github_url'              => 'nullable|url|max:255',
                'site_web'                => 'nullable|url|max:255',
                'cv'                      => 'required|file|mimes:pdf|max:5120',
                'why_us'                  => 'required|string|min:20|max:500',
                'contract_type_preferred' => 'required|in:CDI,CDD,SIVP,Freelance,Alternance',
                'handicap_info'           => 'nullable|string|max:1000',
                'experiences'             => 'nullable|json',
                'formations'              => 'nullable|json',
                'skills'                  => 'nullable|json',
                'challenges'              => 'nullable|json',
            ], [
                'cv.required'                      => 'Veuillez joindre votre CV',
                'cv.mimes'                         => 'Le CV doit être au format PDF',
                'cv.max'                           => 'Le CV ne doit pas dépasser 5 Mo',
                'why_us.required'                  => 'Veuillez expliquer votre motivation',
                'why_us.min'                       => 'Votre motivation doit contenir au moins 20 caractères',
                'contract_type_preferred.required' => 'Veuillez sélectionner un type de contrat',
            ]);

            // Vérifier doublon candidature
            $alreadyApplied = Application::where('user_id', Auth::id())
                ->where('job_id', $validated['job_id'])
                ->exists();

            if ($alreadyApplied) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous avez déjà postulé à cette offre.',
                ], 422);
            }

            // Stocker le CV
            $cvPath = $request->file('cv')->store('cvs/' . date('Y/m'), 'public');

            $decodeJson = fn(?string $v): ?array => $v
                ? (json_decode($v, true) ?: null)
                : null;

            $application = Application::create([
                'user_id'                 => Auth::id(),
                'job_id'                  => $validated['job_id'],
                'nom'                     => $validated['nom'],
                'prenom'                  => $validated['prenom'],
                'email'                   => $validated['email'],
                'telephone'               => $validated['telephone'],
                'date_naissance'          => $validated['date_naissance'] ?? null,
                'genre'                   => $validated['genre'] ?? null,
                'nationalite'             => $validated['nationalite'] ?? null,
                'adresse'                 => $validated['adresse'] ? json_decode($validated['adresse'], true) : null,
                'linkedin_url'            => $validated['linkedin_url'] ?? null,
                'github_url'              => $validated['github_url'] ?? null,
                'site_web'                => $validated['site_web'] ?? null,
                'cv_path'                 => $cvPath,
                'motivation'              => $validated['why_us'],
                'lettre_motivation'       => $validated['why_us'],
                'contract_type_preferred' => $validated['contract_type_preferred'],
                'handicap_info'           => $validated['handicap_info'] ?? null,
                'experiences'             => $decodeJson($validated['experiences'] ?? null),
                'formations'              => $decodeJson($validated['formations'] ?? null),
                'skills'                  => $decodeJson($validated['skills'] ?? null),
                'challenges'              => $decodeJson($validated['challenges'] ?? null),
                'statut'                  => 'en_attente',
                'date_candidature'        => now(),
            ]);

            $application->load(['job.department:id,nom']);

            Log::info('✅ Candidature créée', [
                'application_id' => $application->id,
                'user_id'        => Auth::id(),
                'job_id'         => $validated['job_id'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Candidature envoyée avec succès !',
                'data'    => $application,
            ], 201);

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
                Log::warning('🗑️ CV supprimé après échec', ['path' => $cvPath]);
            }
            Log::error('❌ Erreur création candidature', ['message' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur serveur lors de l\'envoi de la candidature',
            ], 500);
        }
    }

    /**
     * Candidat — ses candidatures
     * GET /api/candidat/applications
     */
    public function myApplications(Request $request)
    {
        $perPage      = (int) $request->get('limit', 10);
        $applications = Application::with([
            'job:id,titre,department_id',
            'job.department:id,nom',
        ])
        ->select('id', 'user_id', 'job_id', 'statut', 'date_candidature', 'motivation')
        ->where('user_id', Auth::id())
        ->orderBy('date_candidature', 'desc')
        ->paginate($perPage);

        return response()->json([
            'success'    => true,
            'data'       => $applications->items(),
            'pagination' => [
                'current_page' => $applications->currentPage(),
                'last_page'    => $applications->lastPage(),
                'total'        => $applications->total(),
                'per_page'     => $applications->perPage(),
            ],
        ]);
    }

    /**
     * Candidat — détail de SA candidature
     * GET /api/candidat/applications/{application}
     */
    public function show(Application $application)
    {
        // ✅ Policy view — remplace la vérif manuelle
        // Avant : if ($application->user_id !== Auth::id()) { abort(403) }
        $this->authorize('view', $application);

        $application->load([
            'user:id,name,email,telephone,avatar,linkedin_url',
            'job:id,titre,department_id',
            'job.department:id,nom',
        ]);

        return response()->json(['success' => true, 'data' => $application]);
    }

    /**
     * Candidat — stats dashboard
     * GET /api/candidat/dashboard/stats
     */
    public function candidatStats(Request $request)
    {
        $userId = $request->user()->id;

        $stats = Cache::remember("candidat:stats:{$userId}", 300, function () use ($userId) {
            return Application::where('user_id', $userId)
                ->selectRaw('COUNT(*) as total')
                ->selectRaw('SUM(CASE WHEN statut = "en_attente" THEN 1 ELSE 0 END) as en_attente')
                ->selectRaw('SUM(CASE WHEN statut = "acceptee" THEN 1 ELSE 0 END) as acceptee')
                ->selectRaw('SUM(CASE WHEN statut = "en_cours" THEN 1 ELSE 0 END) as en_cours')
                ->first();
        });

        return response()->json([
            'success' => true,
            'data'    => [
                'total'               => (int) ($stats->total ?? 0),
                'en_attente'          => (int) ($stats->en_attente ?? 0),
                'acceptee'            => (int) ($stats->acceptee ?? 0),
                'en_cours'            => (int) ($stats->en_cours ?? 0),
                'profile_completion'  => $this->calculateProfileCompletion($request->user()),
            ],
        ]);
    }

    /**
     * RH — liste des candidatures pour SES offres uniquement
     * GET /api/rh/applications
     */
    public function indexRh(Request $request)
    {
        $query = Application::with([
            'user:id,name,email,telephone,avatar',
            'job:id,titre,department_id',
            'job.department:id,nom',
        ])
        ->select('id', 'user_id', 'job_id', 'statut', 'date_candidature', 'motivation', 'cv_path')
        // ✅ Filtrer sur les offres créées par le RH connecté
        ->whereHas('job', function (Builder $q) {
            $q->where('created_by', Auth::id());
        });

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }
        if ($request->filled('job_id')) {
            $query->where('job_id', $request->job_id);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function (Builder $q) use ($search) {
                $q->whereHas('user', fn(Builder $u) =>
                    $u->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                )->orWhereHas('job', fn(Builder $j) =>
                    $j->where('titre', 'like', "%{$search}%")
                );
            });
        }

        $perPage      = (int) $request->get('per_page', 15);
        $applications = $query->latest('date_candidature')->paginate($perPage);

        return response()->json([
            'success'    => true,
            'data'       => $applications->items(),
            'pagination' => [
                'current_page' => $applications->currentPage(),
                'last_page'    => $applications->lastPage(),
                'total'        => $applications->total(),
                'per_page'     => $applications->perPage(),
            ],
        ]);
    }

    /**
     * RH — détail d'une candidature pour SES offres
     * GET /api/rh/applications/{application}
     */
    public function showRh(Application $application)
    {
        // ✅ Policy viewAsRh — remplace l'absence de vérification
        $this->authorize('viewAsRh', $application);

        $application->load([
            'user:id,name,email,telephone,avatar,linkedin_url',
            'job:id,titre,department_id',
            'job.department:id,nom',
        ]);

        return response()->json(['success' => true, 'data' => $application]);
    }

    /**
     * RH — changer le statut
     * PATCH /api/rh/applications/{application}/status
     */
    public function updateStatus(Request $request, Application $application)
    {
        // ✅ Policy updateStatus — remplace l'absence de vérification
        $this->authorize('updateStatus', $application);

        $validated = $request->validate([
            'statut'          => 'required|in:en_attente,acceptee,refusee,retiree,en_cours',
            'notes_internes'  => 'nullable|string|max:1000',
        ]);

        $oldStatus = $application->statut;

        $application->update([
            'statut'                   => $validated['statut'],
            'notes_internes'           => $validated['notes_internes'] ?? $application->notes_internes,
            'date_derniere_modification' => now(),
        ]);

        Cache::forget('rh:applications:stats');

        Log::info('🔄 Statut candidature mis à jour', [
            'application_id' => $application->id,
            'old_status'     => $oldStatus,
            'new_status'     => $validated['statut'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Statut mis à jour',
            'data'    => $application->fresh(['user:id,name,email', 'job:id,titre', 'job.department:id,nom']),
        ]);
    }

    /**
     * RH — statistiques globales de SES candidatures
     * GET /api/rh/applications/stats
     */
    public function statsRh(Request $request)
    {
        $userId = Auth::id();

        // ✅ Stats scopées au RH connecté — pas les stats globales de tous les RH
        $stats = Cache::remember("rh:applications:stats:{$userId}", 300, function () use ($userId) {
            return Application::whereHas('job', fn($q) => $q->where('created_by', $userId))
                ->selectRaw('COUNT(*) as total')
                ->selectRaw('SUM(CASE WHEN statut = "en_attente" THEN 1 ELSE 0 END) as en_attente')
                ->selectRaw('SUM(CASE WHEN statut = "acceptee" THEN 1 ELSE 0 END) as acceptee')
                ->selectRaw('SUM(CASE WHEN statut = "en_cours" THEN 1 ELSE 0 END) as en_cours')
                ->selectRaw('SUM(CASE WHEN statut = "refusee" THEN 1 ELSE 0 END) as refusee')
                ->first();
        });

        return response()->json([
            'success' => true,
            'data'    => [
                'total'      => (int) ($stats->total ?? 0),
                'en_attente' => (int) ($stats->en_attente ?? 0),
                'acceptee'   => (int) ($stats->acceptee ?? 0),
                'en_cours'   => (int) ($stats->en_cours ?? 0),
                'refusee'    => (int) ($stats->refusee ?? 0),
            ],
        ]);
    }

    private function calculateProfileCompletion(User $user): int
    {
        $score = 0;
        if ($user->name)          $score += 20;
        if ($user->email)         $score += 20;
        if ($user->telephone)     $score += 15;
        if ($user->linkedin_url)  $score += 15;
        if ($user->avatar)        $score += 15;
        if (Application::where('user_id', $user->id)->whereNotNull('cv_path')->exists()) {
            $score += 15;
        }
        return min($score, 100);
    }
}