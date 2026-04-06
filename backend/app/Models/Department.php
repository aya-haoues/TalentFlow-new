<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'departments';

    // On ne définit pas $primaryKey = 'id' car MongoDB utilise '_id'
    // Laravel-MongoDB fait le pont automatiquement.

    protected $fillable = [
        'nom', 
        'description', 
        'created_by'
    ];

    /**
     * Relation avec les offres d'emploi (Jobs)
     */
    public function jobs(): HasMany
    {
        // 'department_id' est la clé étrangère dans la collection 'jobs'
        // '_id' est la clé locale dans 'departments'
        return $this->hasMany(Job::class, 'department_id', '_id');
    }

    /**
     * Accéder aux candidatures via les offres (HasManyThrough)
     */
    public function applications()
    {
        return $this->hasManyThrough(
            Application::class, 
            Job::class,
            'department_id', // FK dans jobs
            'job_id',        // FK dans applications
            '_id',           // PK locale Departement
            '_id'            // PK locale Job
        );
    }
}