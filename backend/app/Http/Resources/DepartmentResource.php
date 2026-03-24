<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepartmentResource extends JsonResource
{
    /**
     * Transforme la ressource en tableau.
     */
   public function toArray($request): array
    {
        return [
            // Cette ligne transforme l'objet MongoDB en simple texte "69bb561..."
            'id'          => (string) $this->_id, 
            'nom'         => $this->nom,
            'description' => $this->description,
            'jobs_count'  => $this->relationLoaded('jobs') ? $this->jobs->count() : null,
            'created_at'  => $this->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}