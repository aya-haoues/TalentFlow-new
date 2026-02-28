<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Application extends Model
{
    protected $fillable = [
        'job_id',
        'user_id',
        'statut',
        'cv_path',
        'lettre_motivation',
        'notes_internes',
        'date_derniere_modification'
    ];

    protected $casts = [
        'date_candidature' => 'datetime',
        'date_derniere_modification' => 'datetime'
    ];

    // 🔗 Cette candidature appartient à une offre
    public function job(): BelongsTo
    {
        return $this->belongsTo(Job::class, 'job_id');
    }

    // 🔗 Cette candidature appartient à un candidat
    public function candidat(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}