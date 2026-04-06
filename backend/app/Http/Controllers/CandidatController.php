<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class CandidatController extends Controller
{
    /* ══════════════════════════════════════════════════════
       PROFIL
    ══════════════════════════════════════════════════════ */

    /**
     * GET /api/candidat/profile
     * Retourne le profil de l'utilisateur connecté
     */
    public function showProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data'    => [
                'id'           => $user->id,
                'name'         => $user->name,
                'email'        => $user->email,
                'telephone'    => $user->telephone,
                'linkedin_url' => $user->linkedin_url,
                'avatar'       => $user->avatar,
                'role'         => $user->role,
            ],
        ]);
    }

    /**
     * POST /api/candidat/profile
     * Met à jour les infos personnelles du candidat
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'         => 'sometimes|string|max:255',
            'telephone'    => 'sometimes|nullable|string|max:20',
            'linkedin_url' => 'sometimes|nullable|url|max:255',
        ]);

        $user = $request->user();
        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Profil mis à jour avec succès',
            'data'    => [
                'id'           => $user->id,
                'name'         => $user->name,
                'email'        => $user->email,
                'telephone'    => $user->telephone,
                'linkedin_url' => $user->linkedin_url,
                'avatar'       => $user->avatar,
            ],
        ]);
    }

    /* ══════════════════════════════════════════════════════
       DASHBOARD
    ══════════════════════════════════════════════════════ */

    /**
     * GET /api/candidat/dashboard/stats
     * Retourne les stats du dashboard candidat
     */
    public function dashboardStats(Request $request): JsonResponse
    {
        $user = $request->user();

        $applications = $user->applications();

        $stats = [
            'total'              => $applications->count(),
            'en_attente'         => $applications->where('statut', 'en_attente')->count(),
            'en_cours'           => $applications->where('statut', 'en_cours')->count(),
            'acceptee'           => $applications->where('statut', 'acceptee')->count(),
            'refusee'            => $applications->where('statut', 'refusee')->count(),
            'profile_completion' => $this->calcProfileCompletion($user),
        ];

        return response()->json([
            'success' => true,
            'data'    => $stats,
        ]);
    }

    /* ══════════════════════════════════════════════════════
       CANDIDATURES
    ══════════════════════════════════════════════════════ */

    /**
     * GET /api/candidat/applications
     * Liste paginée des candidatures du candidat connecté
     */
    public function myApplications(Request $request): JsonResponse
    {
        $perPage = $request->integer('per_page', 10);
        $statut  = $request->input('statut');
        $search  = $request->input('search');

        $query = $request->user()
            ->applications()
            ->with(['job.department'])
            ->latest();

        if ($statut && $statut !== 'all') {
            $query->where('statut', $statut);
        }

        if ($search) {
            $query->whereHas('job', function ($q) use ($search) {
                $q->where('titre', 'like', "%{$search}%")
                  ->orWhereHas('department', fn($d) => $d->where('nom', 'like', "%{$search}%"));
            });
        }

        $paginated = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data'    => $paginated->items(),
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
            ],
        ]);
    }

    /* ══════════════════════════════════════════════════════
       HELPER PRIVÉ
    ══════════════════════════════════════════════════════ */

    /**
     * Calcule le % de complétion du profil (0-100)
     */
    private function calcProfileCompletion($user): int
    {
        $checks = [
            !empty($user->name),
            !empty($user->email),
            !empty($user->telephone),
            !empty($user->linkedin_url),
            !empty($user->avatar),
        ];

        return (int) round(
            (count(array_filter($checks)) / count($checks)) * 100
        );
    }
}