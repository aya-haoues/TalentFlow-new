<?php
// app/Models/Departement.php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Departement extends Model
{
    // ✅ Table au pluriel (anglais)
    protected $connection = 'mongodb';
    protected $collection = 'departments';

    protected $table = 'departments';
    
    protected $fillable = ['nom', 'description', 'created_by'];
    
    public function jobs(): HasMany
    {
        return $this->hasMany(Job::class, 'department_id');
    }
}