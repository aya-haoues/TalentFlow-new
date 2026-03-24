<?php

namespace App\Models;

// ── Imports Laravel ───────────────────────────────
use MongoDB\Laravel\Auth\User as Authenticatable;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Contracts\Auth\CanResetPassword;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

// ── Imports Sanctum ───────────────────────────────
use Laravel\Sanctum\NewAccessToken;

// ── Imports Modèles ───────────────────────────────
use App\Models\Application;
use App\Models\Job;

class User extends Authenticatable implements MustVerifyEmail, CanResetPassword
{
    use HasFactory, Notifiable;

    protected $connection   = 'mongodb';
    protected $collection   = 'users';
    protected $primaryKey   = '_id';
    protected $keyType      = 'string';
    public    $incrementing = false;

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
        'social_id',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',
    ];

    /* ══════════════════════════════════════════════
       MUTATORS
    ══════════════════════════════════════════════ */

    protected function email(): Attribute
    {
        return Attribute::make(
            get: fn($value) => $value,
            set: fn($value) => strtolower(trim($value ?? '')),
        );
    }

    protected function name(): Attribute
    {
        return Attribute::make(
            get: fn($value) => ucwords(strtolower($value ?? '')),
            set: fn($value) => trim($value),
        );
    }

    /* ══════════════════════════════════════════════
       CREATE TOKEN — DB insert direct
    ══════════════════════════════════════════════ */

    public function createToken(
        string $name,
        array $abilities = ['*'],
        ?\DateTimeInterface $expiresAt = null
    ) {
        $plainTextToken = Str::random(64);
        $hashedToken    = hash('sha256', $plainTextToken);

        // ── Insertion directe via DB ──────────────
        DB::connection('mongodb')
            ->table('personal_access_tokens')
            ->insert([
                'name'           => $name,
                'token'          => $hashedToken,
                'abilities'      => json_encode($abilities),
                'expires_at'     => $expiresAt,
                'tokenable_id'   => (string) $this->getKey(),
                'tokenable_type' => static::class,
                'created_at'     => now()->toDateTimeString(),
                'updated_at'     => now()->toDateTimeString(),
            ]);

        // ── Récupérer le token inséré ─────────────
        $token   = \App\Models\PersonalAccessToken::where('token', $hashedToken)->first();
        $tokenId = (string) $token->id;

        return new NewAccessToken($token, "{$tokenId}|{$plainTextToken}");
    }

    public function tokens()
    {
        return $this->morphMany(
            \App\Models\PersonalAccessToken::class,
            'tokenable',
            'tokenable_type',
            'tokenable_id',
            'id'
        );
    }

    /* ══════════════════════════════════════════════
       HELPERS
    ══════════════════════════════════════════════ */

    public function isSocialAccount(): bool
    {
        return !empty($this->social_provider) && !empty($this->social_id);
    }

    /* ══════════════════════════════════════════════
       RELATIONS
    ══════════════════════════════════════════════ */

    public function applications()
    {
        return $this->hasMany(Application::class, 'candidate_id');
    }

    public function jobs()
    {
        return $this->hasMany(Job::class, 'created_by');
    }

    public function latestApplication()
    {
        return $this->hasOne(Application::class, 'candidate_id')
                    ->latestOfMany();
    }

    public function bestApplication()
    {
        return $this->hasOne(Application::class, 'candidate_id')
                    ->ofMany('ai_score', 'max');
    }
}