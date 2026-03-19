<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Application extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'applications';

    protected $fillable = [
        'job_id', 'candidate_id', 'statut',
        'date_candidature', 'date_derniere_modification',
        'cv_path', 'lettre_motivation',
        'nom', 'prenom', 'email', 'telephone',
        'date_naissance', 'genre', 'nationalite',
        'adresse', 'linkedin_url', 'github_url', 'site_web',
        'motivation', 'contract_type_preferred',
        'handicap_info', 'notes_internes',
        'experiences', 'formations', 'skills', 'challenges',
    ];

    protected $casts = [
        'adresse'     => 'array',
        'experiences' => 'array',
        'formations'  => 'array',
        'skills'      => 'array',
        'challenges'  => 'array',
    ];
}