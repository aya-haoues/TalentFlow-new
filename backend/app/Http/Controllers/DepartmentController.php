<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;
use App\Http\Resources\DepartmentResource;
use Illuminate\Support\Facades\DB;


class DepartmentController extends Controller
{
    /**
     * LISTE des départements
     * Test Postman 1.1 — GET /api/departments
     */
    // Remplace Departement par Department

public function index()
{
    // Utilise le nouveau nom du modèle
    $departments = Department::orderBy('nom')->get();

    return \App\Http\Resources\DepartmentResource::collection($departments);
}

    /**
     * CRÉER un département
     * Test Postman 2.5 — POST /api/admin/departments
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100|unique:departments,nom',
            'description' => 'nullable|string'
        ]);

        $dept = Department::create($validated);

        return (new DepartmentResource($dept))
            ->additional([
                'success' => true,
                'message' => 'Département créé avec succès'
            ])
            ->response()
            ->setStatusCode(201);
    }

    /**
     * AFFICHER un département
     * GET /api/departments/{id}
     */
    public function show($id)
    {
        // Avec MongoDB, on utilise souvent findOrFail sur l'ID
        $department = Department::findOrFail($id);
        
        // On charge la relation jobs pour le détail
        $department->load('jobs');

        return new DepartmentResource($department);
    }

    /**
     * MODIFIER un département
     * Test Postman 2.6 — PUT /api/admin/departments/{id}
     */
    public function update(Request $request, $id)
    {
        $department = Department::findOrFail($id);

        $validated = $request->validate([
            // Laravel-MongoDB gère bien l'ID pour l'unique
            'nom' => 'sometimes|required|string|max:100|unique:departments,nom,' . $id . ',_id',
            'description' => 'nullable|string'
        ]);

        $department->update($validated);

        return (new DepartmentResource($department))->additional([
            'success' => true,
            'message' => 'Département mis à jour'
        ]);
    }

    /**
     * SUPPRIMER un département
     * Test Postman 2.7 — DELETE /api/admin/departments/{id}
     */
    public function destroy($id)
    {
        $department = Department::findOrFail($id);

        if ($department->jobs()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer : des offres sont liées à ce département.'
            ], 400);
        }

        $department->delete();

        return response()->json([
            'success' => true,
            'message' => 'Département supprimé avec succès.'
        ]);
    }
}