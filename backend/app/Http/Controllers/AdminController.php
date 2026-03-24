<?php

namespace App\Http\Controllers;

use MongoDB\BSON\Regex;
use App\Models\User;
use App\Models\Job;
use App\Models\Application;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Http\Resources\UserResource;

class AdminController extends Controller
{
    /* ═══════════════════════════════════════════════════════
       STATS
    ═══════════════════════════════════════════════════════ */

   public function stats()
{
    try {
        // Astuce : Utiliser des requêtes brutes ou s'assurer que le model utilise bien le driver MongoDB
        return response()->json([
            'success' => true,
            'data'    => [
                // On vérifie que les modèles sont bien chargés
                'total_users'        => \App\Models\User::where('role', '!=', 'admin')->count(),
                'total_candidats'    => \App\Models\User::where('role', 'candidat')->count(),
                'total_rh'           => \App\Models\User::where('role', 'rh')->count(),
                'total_managers'     => \App\Models\User::where('role', 'manager')->count(),
                'total_departments'  => \App\Models\Department::count(),
                'total_jobs'         => \App\Models\Job::count(),
                'total_applications' => \App\Models\Application::count(),
                
                // Attention : 'whereIn' + 'where' fonctionne sur MongoDB, mais vérifie les types de données
                'pending_approvals'  => \App\Models\User::whereIn('role', ['rh', 'manager'])
                                                    ->where('is_approved', false)
                                                    ->count(),
            ],
        ]);
    } catch (\Exception $e) {
    dd($e->getMessage());
}
}
    /* ═══════════════════════════════════════════════════════
       LISTER LES USERS
    ═══════════════════════════════════════════════════════ */

    public function index(Request $request)
{
    $users = User::where('role', '!=', 'admin')->paginate(15);

    // ✅ Utilise UserResource pour éviter les erreurs de formatage
    return UserResource::collection($users)
        ->additional(['success' => true]);
}

    /* ═══════════════════════════════════════════════════════
       COMPTES EN ATTENTE
    ═══════════════════════════════════════════════════════ */

    public function pending()
{
    $users = User::whereIn('role', ['rh', 'manager'])
                 ->where('is_approved', false)
                 ->orderBy('created_at', 'desc')
                 ->get();

    // ✅ Utiliser UserResource
    return UserResource::collection($users)
        ->additional(['success' => true])
        ->response();
}

    /* ═══════════════════════════════════════════════════════
       APPROUVER
    ═══════════════════════════════════════════════════════ */

    public function approve(User $user)
    {
        if (!in_array($user->role, ['rh', 'manager'])) {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les comptes RH et Manager nécessitent une approbation.',
            ], 422);
        }

        $user->update(['is_approved' => true]);

        Log::info('✅ Compte approuvé', [
            'user_id' => $user->id,
            'role'    => $user->role,
        ]);

        return (new UserResource($user))
        ->additional([
            'success' => true,
            'message' => 'Compte approuvé.',
        ])
        ->response();
    }

    /* ═══════════════════════════════════════════════════════
       REJETER
    ═══════════════════════════════════════════════════════ */

    public function reject(User $user)
    {
        if (!in_array($user->role, ['rh', 'manager'])) {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les comptes RH et Manager nécessitent une approbation.',
            ], 422);
        }

        $user->update(['is_approved' => false]);

        Log::info('❌ Compte rejeté', ['user_id' => $user->id]);

        return (new UserResource($user))
        ->additional([
            'success' => true,
            'message' => 'Compte rejeté.',
        ])
        ->response();
    }

    /* ═══════════════════════════════════════════════════════
       BLOQUER / DÉBLOQUER
    ═══════════════════════════════════════════════════════ */

    public function toggleBlock(User $user)
    {
        if ($user->role === 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de bloquer un administrateur.',
            ], 422);
        }

        $user->update(['is_blocked' => !$user->is_blocked]);

        $action = $user->is_blocked ? 'bloqué' : 'débloqué';

        Log::info("🔒 Compte {$action}", ['user_id' => $user->id]);

        return (new UserResource($user))
        ->additional([
            'success' => true,
            'message' => "Compte {$action}.",
        ])
        ->response();
    }

    /* ═══════════════════════════════════════════════════════
       SUPPRIMER
    ═══════════════════════════════════════════════════════ */

    public function destroy(User $user)
    {
        if ($user->role === 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer un administrateur.',
            ], 422);
        }

        Log::info('🗑️ Compte supprimé', ['user_id' => $user->id]);
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Compte supprimé.',
        ]);
    }

    /* ═══════════════════════════════════════════════════════
       DÉPARTEMENTS
    ═══════════════════════════════════════════════════════ */

    public function departments()
    {
        // ✅ withCount() pas supporté MongoDB → calcul manuel
        $departments = Department::orderBy('nom')->get()->map(function ($dept) {
            $dept->jobs_count = $dept->jobs()->count();
            return $dept;
        });

        return response()->json(['success' => true, 'data' => $departments]);
    }

    public function storeDepartment(Request $request)
    {
        $request->validate([
            'nom'         => 'required|string|max:100|unique:departments,nom',
            'description' => 'nullable|string',
        ]);

        $dept = Department::create([
            'nom'         => trim($request->nom),
            'description' => $request->description,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Département créé avec succès',
            'data'    => $dept,
        ], 201);
    }

    public function updateDepartment(Request $request, $id)
    {
        $dept = Department::findOrFail($id);

        $request->validate([
            'nom'         => "required|string|max:100|unique:departments,nom,{$id}",
            'description' => 'nullable|string',
        ]);

        $dept->update([
            'nom'         => trim($request->nom),
            'description' => $request->description,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Département mis à jour',
            'data'    => $dept,
        ]);
    }

    public function destroyDepartment($id)
    {
        $dept = Department::findOrFail($id);

        if ($dept->jobs()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer : des offres sont liées à ce département.',
            ], 400);
        }

        $dept->delete();

        return response()->json([
            'success' => true,
            'message' => 'Département supprimé.',
        ]);
    }
}
