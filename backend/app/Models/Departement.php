<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Departement extends Model
{
    protected $fillable = ['nom', 'description', 'created_by'];

    // ⚠️ Si ta table s'appelle "departments" (anglais) mais ton modèle "Departement" (français)
    protected $table = 'departments';

    // 🔗 Un département a plusieurs offres
    public function jobs(): HasMany
    {
        return $this->hasMany(Job::class, 'department_id');
    }
}