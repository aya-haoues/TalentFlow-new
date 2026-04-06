<?php

namespace App\Models;

use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;
use MongoDB\Laravel\Eloquent\DocumentModel;

class PersonalAccessToken extends SanctumPersonalAccessToken
{
    use DocumentModel;

    protected $connection   = 'mongodb';
    protected $collection   = 'personal_access_tokens';
    protected $primaryKey   = 'id';
    protected $keyType      = 'string';
    public    $incrementing = false;

    protected $fillable = [
        '_id',
        'name',
        'token',
        'abilities',
        'expires_at',
        'tokenable_id',
        'tokenable_type',
    ];

    // ── findToken — cherche par hash ──────────────
    public static function findToken($token): ?static
    {
        if (str_contains($token, '|')) {
            [, $plainText] = explode('|', $token, 2);
        } else {
            $plainText = $token;
        }

        return static::where('token', hash('sha256', $plainText))->first();
    }

    // ── Relation tokenable → User ─────────────────
    public function tokenable()
    {
        return $this->belongsTo(
            \App\Models\User::class,
            'tokenable_id',
            'id'
        );
    }
}