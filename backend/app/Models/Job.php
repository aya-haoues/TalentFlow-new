<?php
// app/Models/Job.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Application;      // Pour la relation avec les candidatures
use App\Models\Departement;

class Job extends Model
{
    use HasFactory;

    // app/Models/Job.php
    protected $connection = 'mongodb';
    protected $collection = 'offres';   // ← changer jobs → offres
    protected $table      = 'offres';   // ← ajouter aussi

    // 🔐 Champs qu'on autorise à remplir massivement (protection Mass Assignment)
    protected $fillable = [
        'titre',
        'department_id',
        'type_contrat',
        'niveau_experience',
        'type_lieu',
        'description',
        'competences_requises', // ← JSON → array automatiquement
        'statut',
        'nombre_postes',
        'date_limite',
        'salaire_min',
        'salaire_max',
        'created_by'
    ];

    // 🔄 Conversion automatique des types
    protected $casts = [
        'competences_requises' => 'array',  // JSON en DB → array en PHP
        'date_limite' => 'date',            // String → objet Carbon (date)
        'salaire_min' => 'integer',
        'salaire_max' => 'integer',
        'nombre_postes' => 'integer'
    ];

    

    // 🔗 Relation : L'offre a été créée par un utilisateur (RH)
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Departement::class, 'department_id');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class, 'job_id');
    }

    // ✅ Helpers : méthodes utilitaires pour simplifier les tests dans tes vues
    public function isPublished(): bool
    {
        return $this->statut === 'publiee';
    }

    public function isAccepting(): bool
    {
        // Une offre accepte les candidatures si : publiée + pas de date limite dépassée
        if (!$this->isPublished()) {
            return false;
        }
        if ($this->date_limite && $this->date_limite->isPast()) {
            return false;
        }
        return true;
    }
}