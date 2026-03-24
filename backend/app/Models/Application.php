<?php

namespace App\Models;

// ── Imports Laravel ───────────────────────────────
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;

// ── Imports MongoDB ───────────────────────────────
use MongoDB\Laravel\Eloquent\Model;

// ── Imports Modèles ───────────────────────────────
use App\Models\Job;
use App\Models\User;

class Application extends Model
{
    use HasFactory;

    /* ══════════════════════════════════════════════
       CONFIGURATION MONGODB
    ══════════════════════════════════════════════ */

    protected $connection = 'mongodb';
    protected $collection = 'applications';
    protected $primaryKey = 'id';


    /* ══════════════════════════════════════════════
       MASS ASSIGNMENT
    ══════════════════════════════════════════════ */

    protected $fillable = [
        'job_id',
        'candidate_id',
        'statut',
        'date_candidature',
        'date_derniere_modification',
        'cv_path',
        'lettre_motivation',
        'nom',
        'prenom',
        'email',
        'telephone',
        'date_naissance',
        'genre',
        'nationalite',
        'adresse',
        'linkedin_url',
        'github_url',
        'site_web',
        'motivation',
        'contract_type_preferred',
        'handicap_info',
        'notes_internes',
        'experiences',
        'formations',
        'skills',
        'challenges',
    ];

    /* ══════════════════════════════════════════════
       VALEURS PAR DÉFAUT
    ══════════════════════════════════════════════ */

    protected $attributes = [
        'statut' => 'en_attente',
    ];

    /* ══════════════════════════════════════════════
       CASTS
    ══════════════════════════════════════════════ */

    protected $casts = [
        'adresse'                    => 'array',
        'experiences'                => 'array',
        'formations'                 => 'array',
        'skills'                     => 'array',
        'challenges'                 => 'array',
        'date_candidature'           => 'datetime',
        'date_derniere_modification' => 'datetime',
        'date_naissance'             => 'date',
    ];

    /* ══════════════════════════════════════════════
       APPENDS — inclus automatiquement dans toArray/toJson
    ══════════════════════════════════════════════ */

    protected $appends = [
        'full_name',
        'is_active',
        'is_finished',
        'has_cv',
    ];

    /* ══════════════════════════════════════════════
       DATE SERIALIZATION
    ══════════════════════════════════════════════ */

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format('Y-m-d H:i:s');
    }

    /* ══════════════════════════════════════════════
       RELATIONS
    ══════════════════════════════════════════════ */

    public function job()
    {
        return $this->belongsTo(Job::class, 'job_id')
                    ->withDefault([
                        'titre'  => 'Offre supprimée',
                        'statut' => 'archivee',
                    ]);
    }

    public function candidate()
    {
        return $this->belongsTo(User::class, 'candidate_id')
                    ->withDefault([
                        'name'  => 'Candidat supprimé',
                        'email' => '',
                    ]);
    }

    /* ══════════════════════════════════════════════
       ACCESSORS / MUTATORS
    ══════════════════════════════════════════════ */

    /**
     * Nom complet du candidat
     * $application->full_name → "Samir Ben Ahmed"
     */
    protected function fullName(): Attribute
    {
        return Attribute::make(
            get: fn($value, $attributes) =>
                trim(($attributes['prenom'] ?? '') . ' ' . ($attributes['nom'] ?? '')),
        );
    }

    /**
     * Email → toujours en minuscule à l'écriture
     */
    protected function email(): Attribute
    {
        return Attribute::make(
            set: fn($value) => strtolower(trim($value ?? '')),
        );
    }

    /**
     * La candidature est-elle active ?
     * $application->is_active → bool
     */
    protected function isActive(): Attribute
    {
        return Attribute::make(
            get: fn() => in_array($this->statut, ['en_attente', 'en_cours']),
        );
    }

    /**
     * La candidature est-elle terminée ?
     * $application->is_finished → bool
     */
    protected function isFinished(): Attribute
    {
        return Attribute::make(
            get: fn() => in_array($this->statut, ['acceptee', 'refusee', 'retiree']),
        );
    }

    /**
     * La candidature a-t-elle un CV ?
     * $application->has_cv → bool
     */
    protected function hasCv(): Attribute
    {
        return Attribute::make(
            get: fn() => !is_null($this->cv_path),
        );
    }

    /**
     * Expériences → JSON string ou array → toujours array
     */
    protected function experiences(): Attribute
    {
        return Attribute::make(
            get: fn($value) => is_string($value)
                ? (json_decode($value, true) ?? [])
                : ($value ?? []),
            set: fn($value) => is_string($value)
                ? (json_decode($value, true) ?? [])
                : ($value ?? []),
        );
    }

    /**
     * Formations → même logique
     */
    protected function formations(): Attribute
    {
        return Attribute::make(
            get: fn($value) => is_string($value)
                ? (json_decode($value, true) ?? [])
                : ($value ?? []),
            set: fn($value) => is_string($value)
                ? (json_decode($value, true) ?? [])
                : ($value ?? []),
        );
    }

    /**
     * Skills → même logique
     */
    protected function skills(): Attribute
    {
        return Attribute::make(
            get: fn($value) => is_string($value)
                ? (json_decode($value, true) ?? [])
                : ($value ?? []),
            set: fn($value) => is_string($value)
                ? (json_decode($value, true) ?? [])
                : ($value ?? []),
        );
    }

    /**
     * Challenges → même logique
     */
    protected function challenges(): Attribute
    {
        return Attribute::make(
            get: fn($value) => is_string($value)
                ? (json_decode($value, true) ?? [])
                : ($value ?? []),
            set: fn($value) => is_string($value)
                ? (json_decode($value, true) ?? [])
                : ($value ?? []),
        );
    }
}
