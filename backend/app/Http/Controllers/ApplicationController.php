<?php
// backend/app/Http/Controllers/ApplicationController.php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\Builder;

class ApplicationController extends Controller
{
    /* ═══════════════════════════════════════════════════════
       👤 CANDIDAT : Créer une candidature
       POST /api/applications
       ═══════════════════════════════════════════════════════ */
    public function store(Request $request)
    {
        // ✅ Initialiser $cvPath pour le cleanup en cas d'erreur
        $cvPath = null;
        
        try {
            // ✅ Validation complète des champs du frontend
            $validated = $request->validate([
                'job_id' => 'required|exists:jobs,id',
                
                // Informations personnelles
                'nom' => 'required|string|max:100',
                'prenom' => 'required|string|max:100',
                'email' => 'required|email|max:255',
                'telephone' => 'required|string|max:20',
                'date_naissance' => 'nullable|date|before:today',
                'genre' => 'nullable|in:homme,femme,autre,prefer_ne_pas_repondre',
                'nationalite' => 'nullable|string|max:100',
                'adresse' => 'nullable|json',
                'linkedin_url' => 'nullable|url|max:255',
                'github_url' => 'nullable|url|max:255',
                'site_web' => 'nullable|url|max:255',
                
                // CV : PDF uniquement, max 5MB
                'cv' => 'required|file|mimes:pdf|max:5120',
                
                // Champs texte requis
                'why_us' => 'required|string|min:20|max:500',
                'contract_type_preferred' => 'required|in:CDI,CDD,SIVP,Freelance,Alternance',
                
                // Champs optionnels
                'handicap_info' => 'nullable|string|max:1000',
                
                // Champs JSON (tableaux sérialisés depuis le frontend)
                'experiences' => 'nullable|json',
                'formations' => 'nullable|json',
                'skills' => 'nullable|json',
                'challenges' => 'nullable|json',
            ], [
                'nom.required' => 'Le nom est requis',
                'prenom.required' => 'Le prénom est requis',
                'email.required' => 'L\'email est requis',
                'telephone.required' => 'Le téléphone est requis',
                'cv.required' => 'Veuillez joindre votre CV',
                'cv.mimes' => 'Le CV doit être au format PDF',
                'cv.max' => 'Le CV ne doit pas dépasser 5 Mo',
                'why_us.required' => 'Veuillez expliquer votre motivation',
                'why_us.min' => 'Votre motivation doit contenir au moins 20 caractères',
                'contract_type_preferred.required' => 'Veuillez sélectionner un type de contrat',
            ]);

            // ✅ Vérifier l'authentification
            $userId = Auth::id();
            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous devez être connecté pour postuler'
                ], 401);
            }

            // ✅ Vérifier si l'utilisateur a déjà postulé à cette offre
            $alreadyApplied = Application::where('user_id', $userId)
                                         ->where('job_id', $validated['job_id'])
                                         ->exists();
            
            if ($alreadyApplied) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous avez déjà postulé à cette offre.'
                ], 422);
            }

            // ✅ Stocker le CV
            $cvFile = $request->file('cv');
            $cvPath = $cvFile->store('cvs/' . date('Y/m'), 'public');

            // ✅ Helper pour décoder les champs JSON
            $decodeJson = function (?string $value): ?array {
                if (!$value) return null;
                $decoded = json_decode($value, true);
                return json_last_error() === JSON_ERROR_NONE ? $decoded : null;
            };

            // ✅ Créer la candidature avec mapping frontend → backend
            $application = Application::create([
                'user_id' => $userId,
                'job_id' => $validated['job_id'],
                
                // Informations personnelles
                'nom' => $validated['nom'],
                'prenom' => $validated['prenom'],
                'email' => $validated['email'],
                'telephone' => $validated['telephone'],
                'date_naissance' => $validated['date_naissance'] ?? null,
                'genre' => $validated['genre'] ?? null,
                'nationalite' => $validated['nationalite'] ?? null,
                'adresse' => $validated['adresse'] ? json_decode($validated['adresse'], true) : null,
                'linkedin_url' => $validated['linkedin_url'] ?? null,
                'github_url' => $validated['github_url'] ?? null,
                'site_web' => $validated['site_web'] ?? null,

                'cv_path' => $cvPath,
                
                // Mapping : why_us (frontend) → motivation (backend)
                'motivation' => $validated['why_us'],
                'lettre_motivation' => $validated['why_us'],  // Rétrocompatibilité
                
                'contract_type_preferred' => $validated['contract_type_preferred'],
                'handicap_info' => $validated['handicap_info'] ?? null,
                
                // Décodage des tableaux JSON
                'experiences' => $decodeJson($validated['experiences'] ?? null),
                'formations' => $decodeJson($validated['formations'] ?? null),
                'skills' => $decodeJson($validated['skills'] ?? null),
                'challenges' => $decodeJson($validated['challenges'] ?? null),
                
                'statut' => 'en_attente',
                'date_candidature' => now(),
            ]);

            // ✅ Charger les relations pour la réponse (avec sélection de champs)
            $application->load(['job.department:id,nom']);

            Log::info('✅ Candidature créée avec succès', [
                'application_id' => $application->id,
                'user_id' => $userId,
                'job_id' => $validated['job_id'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Candidature envoyée avec succès !',
                'data' => $application
            ], 201);

        } catch (ValidationException $e) {
            // ✅ Cleanup du CV en cas d'erreur de validation (fichier déjà uploadé)
            if ($cvPath && Storage::disk('public')->exists($cvPath)) {
                Storage::disk('public')->delete($cvPath);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            // ✅ Cleanup du CV en cas d'erreur serveur
            if ($cvPath && Storage::disk('public')->exists($cvPath)) {
                Storage::disk('public')->delete($cvPath);
                Log::warning('🗑️ CV supprimé après échec', ['path' => $cvPath]);
            }
            
            Log::error('❌ Erreur création candidature', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur serveur lors de l\'envoi de la candidature'
            ], 500);
        }
    }

    /* ═══════════════════════════════════════════════════════
       👤 CANDIDAT : Mes candidatures
       GET /api/applications/my
       ═══════════════════════════════════════════════════════ */
    public function myApplications(Request $request)
    {
        $userId = Auth::id();
        if (!$userId) {
            return response()->json(['success' => false, 'message' => 'Non authentifié'], 401);
        }

        $perPage = (int) $request->get('limit', 10);
        
        // ✅ Eager loading optimisé avec sélection de champs uniquement
        $applications = Application::with([
            'job:id,titre,department_id',
            'job.department:id,nom'
        ])
        ->select('id', 'user_id', 'job_id', 'statut', 'date_candidature', 'motivation')
        ->where('user_id', $userId)
        ->orderBy('date_candidature', 'desc')
        ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $applications->items(),
            'pagination' => [
                'current_page' => $applications->currentPage(),
                'last_page' => $applications->lastPage(),
                'total' => $applications->total(),
                'per_page' => $applications->perPage(),
            ]
        ]);
    }

    /* ═══════════════════════════════════════════════════════
       👤 CANDIDAT : Détail d'une candidature
       GET /api/applications/{application}
       ═══════════════════════════════════════════════════════ */
    public function show(Application $application)
    {
        // Vérifier que l'utilisateur est le propriétaire
        if ($application->user_id !== Auth::id()) {
            return response()->json(['success' => false, 'message' => 'Accès refusé'], 403);
        }

        // ✅ Charger uniquement les relations nécessaires
        $application->load([
            'user:id,name,email,telephone,avatar,linkedin_url',
            'job:id,titre,department_id',
            'job.department:id,nom'
        ]);

        return response()->json([
            'success' => true,
            'data' => $application
        ]);
    }

    /* ═══════════════════════════════════════════════════════
       👤 CANDIDAT : Statistiques de mes candidatures
       GET /api/candidat/dashboard/stats
       ═══════════════════════════════════════════════════════ */
    public function candidatStats(Request $request)
    {
        $userId = $request->user()->id;
        
        // ✅ Cache des stats pendant 5 minutes pour éviter les requêtes répétées
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
            'data' => [
                'total' => (int) ($stats->total ?? 0),
                'en_attente' => (int) ($stats->en_attente ?? 0),
                'acceptee' => (int) ($stats->acceptee ?? 0),
                'en_cours' => (int) ($stats->en_cours ?? 0),
                'profile_completion' => $this->calculateProfileCompletion($request->user()),
            ]
        ]);
    }

    /* ═══════════════════════════════════════════════════════
       👔 RH : Liste des candidatures avec filtres et pagination
       GET /api/rh/applications
       ═══════════════════════════════════════════════════════ */
    public function indexRh(Request $request)
    {
        // ✅ Eager loading optimisé : sélectionner uniquement les champs nécessaires
        $query = Application::with([
            'user:id,name,email,telephone,avatar',
            'job:id,titre,department_id',
            'job.department:id,nom'
        ])
        ->select('id', 'user_id', 'job_id', 'statut', 'date_candidature', 'motivation', 'cv_path');
        
        // Filtres
        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }
        if ($request->filled('job_id')) {
            $query->where('job_id', $request->job_id);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function(Builder $q) use ($search) {
                $q->whereHas('user', function(Builder $u) use ($search) {
                    $u->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                })
                ->orWhereHas('job', function(Builder $j) use ($search) {
                    $j->where('titre', 'like', "%{$search}%");
                });
            });
        }
        
        // Pagination
        $perPage = (int) $request->get('per_page', 15);
        $applications = $query->latest('date_candidature')->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => $applications->items(),
            'pagination' => [
                'current_page' => $applications->currentPage(),
                'last_page' => $applications->lastPage(),
                'total' => $applications->total(),
                'per_page' => $applications->perPage(),
            ]
        ]);
    }

    /* ═══════════════════════════════════════════════════════
       👔 RH : Détails d'une candidature
       GET /api/rh/applications/{application}
       ═══════════════════════════════════════════════════════ */
    public function showRh(Application $application)
    {
        // ✅ Charger toutes les relations nécessaires pour le détail complet
        $application->load([
            'user:id,name,email,telephone,avatar,linkedin_url',
            'job:id,titre,department_id',
            'job.department:id,nom'
        ]);
        
        return response()->json([
            'success' => true,
            'data' => $application
        ]);
    }

    /* ═══════════════════════════════════════════════════════
       👔 RH : Mettre à jour le statut d'une candidature
       PATCH /api/rh/applications/{application}/status
       ═══════════════════════════════════════════════════════ */
    public function updateStatus(Request $request, Application $application)
    {
        $validated = $request->validate([
            'statut' => 'required|in:en_attente,acceptee,refusee,retiree,en_cours',
            'notes_internes' => 'nullable|string|max:1000',
        ]);
        
        $oldStatus = $application->statut;
        
        $application->update([
            'statut' => $validated['statut'],
            'notes_internes' => $validated['notes_internes'] ?? $application->notes_internes,
            'date_derniere_modification' => now(),
        ]);
        
        // 📧 Optionnel : Envoyer un email au candidat si statut changé
        // if ($validated['statut'] !== $oldStatus && in_array($validated['statut'], ['acceptee', 'refusee'])) {
        //     \Mail::to($application->user->email)->send(new ApplicationStatusChanged($application));
        // }
        
        // ✅ Invalider le cache des stats RH après mise à jour
        Cache::forget('rh:applications:stats');
        
        Log::info('🔄 Statut candidature mis à jour', [
            'application_id' => $application->id,
            'old_status' => $oldStatus,
            'new_status' => $validated['statut'],
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Statut mis à jour',
            'data' => $application->fresh([
                'user:id,name,email',
                'job:id,titre',
                'job.department:id,nom'
            ])
        ]);
    }

    /* ═══════════════════════════════════════════════════════
       👔 RH : Statistiques globales des candidatures
       GET /api/rh/applications/stats
       ═══════════════════════════════════════════════════════ */
    public function statsRh(Request $request)
    {
        // 🚀 Cache les stats pendant 5 minutes (300 secondes)
        $stats = Cache::remember('rh:applications:stats', 300, function () {
            return Application::selectRaw('COUNT(*) as total')
                ->selectRaw('SUM(CASE WHEN statut = "en_attente" THEN 1 ELSE 0 END) as en_attente')
                ->selectRaw('SUM(CASE WHEN statut = "acceptee" THEN 1 ELSE 0 END) as acceptee')
                ->selectRaw('SUM(CASE WHEN statut = "en_cours" THEN 1 ELSE 0 END) as en_cours')
                ->selectRaw('SUM(CASE WHEN statut = "refusee" THEN 1 ELSE 0 END) as refusee')
                ->first();
        });
        
        return response()->json([
            'success' => true,
            'data' => [
                'total' => (int) ($stats->total ?? 0),
                'en_attente' => (int) ($stats->en_attente ?? 0),
                'acceptee' => (int) ($stats->acceptee ?? 0),
                'en_cours' => (int) ($stats->en_cours ?? 0),
                'refusee' => (int) ($stats->refusee ?? 0),
            ]
        ]);
    }

    /* ═══════════════════════════════════════════════════════
       🔧 Helpers internes
       ═══════════════════════════════════════════════════════ */
    
    /**
     * Calculer le pourcentage de complétion du profil candidat
     * Optimisé : évite les requêtes N+1 en passant les données nécessaires
     */
    private function calculateProfileCompletion(User $user): int
    {
        $score = 0;
        
        // Champs de base (20 pts chacun)
        if ($user->name) $score += 20;
        if ($user->email) $score += 20;
        
        // Champs optionnels (15 pts chacun)
        if ($user->telephone) $score += 15;
        if ($user->linkedin_url) $score += 15;
        if ($user->avatar) $score += 15;
        
        // CV uploadé (15 pts) - ✅ Optimisé : utilise une requête simple avec exists()
        $hasCv = Application::where('user_id', $user->id)
            ->whereNotNull('cv_path')
            ->exists();
        if ($hasCv) $score += 15;
        
        return min($score, 100);
    }
}