<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\DepartmentResource; // Sans le "e"
use App\Http\Resources\UserResource;

class JobResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isRh    = $request->user()?->role === 'rh';
        $isAdmin = $request->user()?->role === 'admin';

        return [
            // ✅ Correction : Force l'ID en string pour éviter l'objet $oid
            'id'                   => (string) $this->_id,
            
            'titre'                => $this->titre,
            'type_contrat'         => $this->type_contrat,
            'niveau_experience'    => $this->niveau_experience,
            'type_lieu'            => $this->type_lieu,
            'statut'               => $this->statut,
            'nombre_postes'        => $this->nombre_postes,
            'competences_requises' => $this->competences_requises ?? [],
            'description'          => (string) $this->description,

            // ── Champs conditionnels (Salaires cachés pour les candidats) ──
            'salaire_min' => $this->when($isRh || $isAdmin, $this->salaire_min),
            'salaire_max' => $this->when($isRh || $isAdmin, $this->salaire_max),
            
            'date_limite' => $this->when(
                !is_null($this->date_limite),
                $this->date_limite?->format('Y-m-d')
            ),

            // Accès aux Accessors définis dans le modèle Job
            'salary_range' => $this->salary_range,
            'is_accepting' => $this->is_accepting,
            'is_published' => $this->is_published,

            // ✅ Correction : S'assurer que DepartmentResource (sans 'e') est importé
            'department' => $this->whenLoaded('department',
                fn() => new DepartmentResource($this->department)
            ),
            
            'creator' => $this->whenLoaded('creator',
                fn() => new UserResource($this->creator)
            ),
            
            'applications_count' => $this->when(
                isset($this->applications_count),
                $this->applications_count
            ),

            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}