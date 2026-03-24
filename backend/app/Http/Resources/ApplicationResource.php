<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApplicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isRh    = $request->user()?->role === 'rh';
        $isAdmin = $request->user()?->role === 'admin';

        return [
            // ── Identifiant ───────────────────────
            'id'     => $this->id,
            'statut' => $this->statut,

            // ── Informations personnelles ─────────
            'nom'            => $this->nom,
            'prenom'         => $this->prenom,
            'full_name'      => $this->full_name,  // ← accessor $appends
            'email'          => $this->email,
            'telephone'      => $this->telephone,
            'date_naissance' => $this->date_naissance?->format('Y-m-d'),
            'genre'          => $this->genre,
            'nationalite'    => $this->nationalite,
            'adresse'        => $this->adresse,

            // ── Liens ─────────────────────────────
            'linkedin_url' => $this->linkedin_url,
            'github_url'   => $this->github_url,
            'site_web'     => $this->site_web,

            // ── Candidature ───────────────────────
            'motivation'              => $this->motivation,
            'contract_type_preferred' => $this->contract_type_preferred,
            'cv_path'                 => $this->cv_path,
            'has_cv'                  => $this->has_cv,      // ✅ propriété

            // ── Données structurées ───────────────
            'experiences' => $this->experiences ?? [],
            'formations'  => $this->formations  ?? [],
            'skills'      => $this->skills      ?? [],
            'challenges'  => $this->challenges  ?? [],

            // ── Seulement pour RH / Admin ─────────
            'notes_internes' => $this->when(
                $isRh || $isAdmin,
                $this->notes_internes
            ),
            'handicap_info' => $this->when(
                $isRh || $isAdmin,
                $this->handicap_info
            ),

            // ── Helpers du modèle ─────────────────
            'is_active'   => $this->is_active,    // ✅ propriété
            'is_finished' => $this->is_finished,  // ✅ propriété

            // ── Relations — seulement si chargées ─
            'job' => $this->whenLoaded('job',
                fn() => new JobResource($this->job)
            ),
            'candidate' => $this->whenLoaded('candidate',
                fn() => new UserResource($this->candidate)
            ),

            // ── Dates ─────────────────────────────
            'date_candidature'           => $this->date_candidature?->format('Y-m-d H:i:s'),
            'date_derniere_modification' => $this->date_derniere_modification?->format('Y-m-d H:i:s'),
            'created_at'                 => $this->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}