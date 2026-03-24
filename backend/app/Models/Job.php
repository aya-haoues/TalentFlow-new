<?php

namespace App\Models;

// ── Imports Laravel ───────────────────────────────
use Illuminate\Database\Eloquent\Casts\AsStringable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;

// ── Imports MongoDB ───────────────────────────────
use MongoDB\Laravel\Eloquent\Model;

// ── Imports Modèles ───────────────────────────────
use App\Models\Application;
use App\Models\Department;
use App\Models\User;

class Job extends Model
{
    use HasFactory;

    /* ══════════════════════════════════════════════
       CONFIGURATION MONGODB
    ══════════════════════════════════════════════ */

    protected $connection = 'mongodb';
    protected $collection = 'jobs';
// Dans app/Models/Job.php
protected $primaryKey = '_id';
protected $keyType = 'string';
public $incrementing = false;
    /* ══════════════════════════════════════════════
       MASS ASSIGNMENT
    ══════════════════════════════════════════════ */

    protected $fillable = [
        'titre',
        'department_id',
        'type_contrat',
        'niveau_experience',
        'type_lieu',
        'description',
        'competences_requises',
        'statut',
        'nombre_postes',
        'date_limite',
        'salaire_min',
        'salaire_max',
        'created_by',
    ];

    /* ══════════════════════════════════════════════
       VALEURS PAR DÉFAUT
    ══════════════════════════════════════════════ */

    protected $attributes = [
        'statut'        => 'brouillon',
        'nombre_postes' => 1,
    ];

    /* ══════════════════════════════════════════════
       CASTS
    ══════════════════════════════════════════════ */

    protected $casts = [
        '_id' => 'string', // Force Laravel à traiter l'ID comme une string vers le haut
        'competences_requises' => 'array',
        'date_limite'          => 'datetime',
        'salaire_min'          => 'integer',
        'salaire_max'          => 'integer',
        'nombre_postes'        => 'integer',
        'description'          => 'string',
    ];

    /* ══════════════════════════════════════════════
       APPENDS — inclus automatiquement dans toArray/toJson
    ══════════════════════════════════════════════ */

    protected $appends = [
        'salary_range',
        'is_accepting',
        'is_published',
        'has_salary',
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

    public function department()
{
    // On lie le champ 'department_id' de l'offre au '_id' du département
    return $this->belongsTo(Department::class, 'department_id', '_id')
                ->withDefault(['nom' => 'Département supprimé']);
}

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by')
                    ->withDefault(['name' => 'Utilisateur supprimé']);
    }

    public function applications()
    {
        return $this->hasMany(Application::class, 'job_id')
                    ->chaperone();
    }

    public function acceptedApplications()
    {
        return $this->hasMany(Application::class, 'job_id')
                    ->where('statut', 'acceptee');
    }

    public function latestApplication()
    {
        return $this->hasOne(Application::class, 'job_id')
                    ->latestOfMany();
    }

    /* ══════════════════════════════════════════════
       ACCESSORS / MUTATORS
    ══════════════════════════════════════════════ */

    /**
     * Titre → toujours capitalisé
     */
    protected function titre(): Attribute
    {
        return Attribute::make(
            get: fn($value) => ucfirst($value ?? ''),
            set: fn($value) => trim($value),
        );
    }

    /**
     * Fourchette de salaire formatée
     * $job->salary_range → "2500 - 4000 TND" ou null
     */
    protected function salaryRange(): Attribute
    {
        return Attribute::make(
            get: fn($value, $attributes) =>
                isset($attributes['salaire_min'], $attributes['salaire_max'])
                    ? "{$attributes['salaire_min']} - {$attributes['salaire_max']} TND"
                    : null,
        );
    }

    /**
     * L'offre est-elle publiée ?
     * $job->is_published → bool
     */
    protected function isPublished(): Attribute
    {
        return Attribute::make(
            get: fn() => $this->statut === 'publiee',
        );
    }

    /**
     * L'offre accepte-t-elle des candidatures ?
     * $job->is_accepting → bool
     */
    protected function isAccepting(): Attribute
    {
        return Attribute::make(
            get: function () {
                if ($this->statut !== 'publiee') return false;
                if ($this->date_limite && $this->date_limite->isPast()) return false;
                return true;
            }
        );
    }

    /**
     * L'offre a-t-elle une fourchette de salaire ?
     * $job->has_salary → bool
     */
    protected function hasSalary(): Attribute
    {
        return Attribute::make(
            get: fn() => !is_null($this->salaire_min) && !is_null($this->salaire_max),
        );
    }

    /* ══════════════════════════════════════════════
       LOCAL SCOPES
    ══════════════════════════════════════════════ */

    public function scopePubliee(Builder $query): Builder
    {
        return $query->where('statut', 'publiee');
    }

    public function scopeBrouillon(Builder $query): Builder
    {
        return $query->where('statut', 'brouillon');
    }

    public function scopeParType(Builder $query, string $type): Builder
    {
        return $query->where('type_contrat', $type);
    }

    public function scopeRecent(Builder $query, int $days = 30): Builder
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    public function scopeActif(Builder $query): Builder
{
    return $query->where('statut', 'publiee')
                 ->where(function ($q) {
                     // On accepte si la date est dans le futur OU si elle n'est pas définie
                     $q->where('date_limite', '>=', now())
                       ->orWhereNull('date_limite');
                 });
}

    /* ══════════════════════════════════════════════
       EVENTS
    ══════════════════════════════════════════════ */

    protected static function booted(): void
    {
        static::deleting(function (Job $job) {
            $job->applications()->delete();
        });
    }
}