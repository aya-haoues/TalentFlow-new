<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Job;
use App\Models\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdminController extends Controller
{
    /* ═══════════════════════════════════════════════════════
       STATS GLOBALES
    ═══════════════════════════════════════════════════════ */

    public function stats()
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'total_users'        => User::where('role', '!=', 'admin')->count(),
                'total_candidats'    => User::where('role', 'candidat')->count(),
                'total_rh'           => User::where('role', 'rh')->count(),
                'total_managers'     => User::where('role', 'manager')->count(),
                'total_departments'  => \App\Models\Departement::count(),
                'total_jobs'         => Job::count(),
                'total_applications' => Application::count(),
                'pending_approvals'  => User::whereIn('role', ['rh', 'manager'])
                                            ->where('is_approved', false)
                                            ->count(),
            ],
        ]);
    }

    /* ═══════════════════════════════════════════════════════
       LISTE UTILISATEURS
    ═══════════════════════════════════════════════════════ */

    public function index(Request $request)
    {
        $query = User::where('role', '!=', 'admin')
                     ->orderBy('created_at', 'desc');

        // Filtre rôle
        if ($request->filled('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        // Filtre statut
        if ($request->filled('status')) {
            if ($request->status === 'blocked') {
                $query->where('is_blocked', true);
            } elseif ($request->status === 'pending') {
                $query->whereIn('role', ['rh', 'manager'])->where('is_approved', false);
            } elseif ($request->status === 'active') {
                $query->where('is_blocked', false)
                      ->where(function ($q) {
                          $q->where('role', 'candidat')
                            ->orWhere('is_approved', true);
                      });
            }
        }

        // Recherche
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name',  'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success'    => true,
            'data'       => $users->items(),
            'pagination' => [
                'current_page' => $users->currentPage(),
                'last_page'    => $users->lastPage(),
                'total'        => $users->total(),
                'per_page'     => $users->perPage(),
            ],
        ]);
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

        return response()->json(['success' => true, 'data' => $users]);
    }

    /* ═══════════════════════════════════════════════════════
       APPROUVER
    ═══════════════════════════════════════════════════════ */

    public function approve($id)
    {
        $user = User::findOrFail($id);

        if (!in_array($user->role, ['rh', 'manager'])) {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les comptes RH et Manager nécessitent une approbation.',
            ], 422);
        }

        $user->update(['is_approved' => true]);

        Log::info('✅ Compte approuvé', ['user_id' => $user->id, 'role' => $user->role]);

        return response()->json(['success' => true, 'message' => 'Compte approuvé.', 'data' => $user]);
    }

    /* ═══════════════════════════════════════════════════════
       REJETER
    ═══════════════════════════════════════════════════════ */

    public function reject($id)
    {
        $user = User::findOrFail($id);

        Log::info('🗑 Compte rejeté', ['user_id' => $user->id, 'role' => $user->role]);

        $user->delete();

        return response()->json(['success' => true, 'message' => 'Compte rejeté et supprimé.']);
    }

    /* ═══════════════════════════════════════════════════════
       BLOQUER / DÉBLOQUER
    ═══════════════════════════════════════════════════════ */

    public function toggleBlock($id)
    {
        $user = User::findOrFail($id);

        if ($user->role === 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de bloquer le compte administrateur.',
            ], 403);
        }

        $user->update(['is_blocked' => !$user->is_blocked]);

        $action = $user->is_blocked ? 'bloqué' : 'débloqué';
        Log::info("🔒 Utilisateur {$action}", ['user_id' => $user->id]);

        return response()->json([
            'success' => true,
            'message' => "Utilisateur {$action}.",
            'data'    => $user,
        ]);
    }

    /* ═══════════════════════════════════════════════════════
       SUPPRIMER
    ═══════════════════════════════════════════════════════ */

    public function destroy($id)
    {
        $user = User::findOrFail($id);

        if ($user->role === 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer le compte administrateur.',
            ], 403);
        }

        Log::info('🗑 Utilisateur supprimé', ['user_id' => $user->id, 'email' => $user->email]);

        $user->delete();

        return response()->json(['success' => true, 'message' => 'Utilisateur supprimé.']);
    }

    /* ═══════════════════════════════════════════════════════
       DÉPARTEMENTS
    ═══════════════════════════════════════════════════════ */

    public function departments()
    {
        $departments = \App\Models\Departement::withCount('jobs')->orderBy('nom')->get();
        return response()->json(['success' => true, 'data' => $departments]);
    }

    public function storeDepartment(Request $request)
    {
        $request->validate(['nom' => 'required|string|max:100|unique:departments,nom']);
        $dept = \App\Models\Departement::create(['nom' => trim($request->nom)]);
        return response()->json(['success' => true, 'data' => $dept], 201);
    }

    public function updateDepartment(Request $request, $id)
    {
        $dept = \App\Models\Departement::findOrFail($id);
        $request->validate(['nom' => "required|string|max:100|unique:departments,nom,{$id}"]);
        $dept->update(['nom' => trim($request->nom)]);
        return response()->json(['success' => true, 'data' => $dept]);
    }

    public function destroyDepartment($id)
    {
        $dept = \App\Models\Departement::findOrFail($id);
        $dept->delete();
        return response()->json(['success' => true, 'message' => 'Département supprimé.']);
    }
}