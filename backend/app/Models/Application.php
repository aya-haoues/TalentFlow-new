<?php
// backend/app/Models/Application.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Application extends Model
{
    // ✅ Champs mass-assignables (incluant les nouveaux)
    protected $fillable = [
        'user_id',
        'job_id',
        'cv_path',
        'lettre_motivation',  // Ancien champ (gardé pour rétrocompatibilité)
        'motivation',         // ✅ Nouveau : why_us du frontend
        'contract_type_preferred',
        'handicap_info',
        'experiences',        // ✅ JSON
        'formations',         // ✅ JSON
        'skills',             // ✅ JSON
        'challenges',         // ✅ JSON
        'statut',
        'notes_internes',
        'date_candidature',
        'date_derniere_modification',
    ];

    // ✅ Casts automatiques JSON → Array PHP
    protected $casts = [
        'experiences' => 'array',
        'formations' => 'array',
        'skills' => 'array',
        'challenges' => 'array',
        'date_candidature' => 'datetime',
        'date_derniere_modification' => 'datetime',
    ];

    // 🔗 Relations
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function job(): BelongsTo
    {
        return $this->belongsTo(Job::class);
    }
}