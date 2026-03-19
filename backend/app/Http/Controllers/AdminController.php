<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Job;
use App\Models\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdminController extends Controller
{
    
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

    
    public function index(Request $request)
    {
        $query = User::where('role', '!=', 'admin')
                     ->orderBy('created_at', 'desc');
        log($query);
        
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

    public function approve(User $user)  // ← Laravel injecte automatiquement
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

        return response()->json([
            'success' => true,
            'message' => 'Compte approuvé.',
            'data'    => $user,
        ]);
    }

    /* ═══════════════════════════════════════════════════════
       REJETER
    ═══════════════════════════════════════════════════════ */

    // ✅ Toutes avec Route Model Binding

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

    return response()->json([
        'success' => true,
        'message' => 'Compte rejeté.',
        'data'    => $user,
    ]);
}

public function toggleBlock(User $user)
{
    // Empêcher de bloquer l'admin
    if ($user->role === 'admin') {
        return response()->json([
            'success' => false,
            'message' => 'Impossible de bloquer un administrateur.',
        ], 422);
    }

    $user->update(['is_blocked' => !$user->is_blocked]);

    $action = $user->is_blocked ? 'bloqué' : 'débloqué';

    Log::info("🔒 Compte {$action}", ['user_id' => $user->id]);

    return response()->json([
        'success' => true,
        'message' => "Compte {$action}.",
        'data'    => $user,
    ]);
}

public function destroy(User $user)
{
    // Empêcher de supprimer l'admin
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