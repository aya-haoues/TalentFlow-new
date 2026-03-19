<?php

namespace App\Models;

use MongoDB\Laravel\Auth\User as Authenticatable;  // ← MongoDB
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Contracts\Auth\CanResetPassword;   

class User extends Authenticatable implements MustVerifyEmail, CanResetPassword
{
    use HasApiTokens, HasFactory, Notifiable;

    // backend/app/Models/User.php
    protected $connection = 'mongodb';
    protected $collection = 'users';
    
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'telephone',
        'linkedin_url',
        'departement',
        'social_provider',
        'social_id',
        'avatar',
        'is_approved', 
        'is_blocked',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',   
    ];

// ✅ Helper pour vérifier si l'utilisateur est connecté via un provider social
public function isSocialAccount(): bool
{
    return !empty($this->social_provider) && !empty($this->social_id);
}


}