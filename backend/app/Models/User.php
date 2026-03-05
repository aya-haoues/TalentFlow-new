<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    // backend/app/Models/User.php

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'telephone',
        'linkedin_url',
        'departement',
        // ✅ Champs social auth génériques
        'social_provider',
        'social_id',
        'avatar',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

// ✅ Helper pour vérifier si l'utilisateur est connecté via un provider social
public function isSocialAccount(): bool
{
    return !empty($this->social_provider) && !empty($this->social_id);
}


}