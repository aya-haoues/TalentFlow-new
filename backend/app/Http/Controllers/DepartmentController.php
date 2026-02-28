<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Departement;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    /**
     * LISTE des départements
     * GET /api/departments
     * Utile pour : Remplir le <select> dans le formulaire de création d'offre
     */
    public function index()
    {
        $departments = Departement::orderBy('nom')->get();

        return response()->json([
            'success' => true,
            'data' => $departments
        ]);
    }

    /**
     * CRÉER un département
     * POST /api/departments
     * Réservé aux Super-Admin ou RH Senior
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100|unique:departments,nom',
            'description' => 'nullable|string'
        ]);

        $dept = Departement::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Département créé',
            'data' => $dept
        ], 201);
    }

    /**
     * AFFICHER un département
     * GET /api/departments/{id}
     */
    public function show(Departement $department)
    {
        return response()->json([
            'success' => true,
            'data' => $department->load('jobs') // Charge aussi les offres de ce département
        ]);
    }

    /**
     * MODIFIER un département
     * PUT /api/departments/{id}
     */
    public function update(Request $request, Departement $department)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:100|unique:departments,nom,' . $department->id,
            'description' => 'nullable|string'
        ]);

        $department->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Département mis à jour',
            'data' => $department
        ]);
    }

    /**
     * SUPPRIMER un département
     * DELETE /api/departments/{id}
     */
    public function destroy(Departement $department)
    {
        // ⚠️ Sécurité : On ne peut pas supprimer un département qui a des offres
        if ($department->jobs()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer : des offres sont liées à ce département.'
            ], 400);
        }

        $department->delete();

        return response()->json([
            'success' => true,
            'message' => 'Département supprimé'
        ]);
    }
}