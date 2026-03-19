<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Auth\Events\Registered;  
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;


class AuthService
{
    /* ═══════════════════════════════════════════════════════
       VALIDATION RULES — centralisées ici, réutilisables
       ═══════════════════════════════════════════════════════ */

    /**
     * Règles de validation pour l'inscription candidat.
     * Retournées au controller qui les passe à Validator.
     */
    public function candidatRules(): array
    {
        return [
            'name'         => ['required', 'string', 'min:2', 'max:100',
                               'regex:/^[a-zA-Zàâçéèêëîïôûùüÿñæœ\s]+$/u'],
            'email'        => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password'     => ['required', 'string', 'min:8', 'confirmed',
                               'regex:/[a-z]/', 'regex:/[A-Z]/', 'regex:/[0-9]/'],
            'telephone'    => ['nullable', 'string',
                               'regex:/^(\+216|00216|0)?[23456789]\d{7}$/'],
            'linkedin_url' => ['nullable', 'url'],
        ];
    }

    public function rhRules(): array
    {
        return [
            'name'        => ['required', 'string', 'min:2', 'max:100'],
            'email'       => ['required', 'string', 'email', 'unique:users'],
            'password'    => ['required', 'string', 'min:8', 'confirmed',
                              'regex:/[a-z]/', 'regex:/[A-Z]/', 'regex:/[0-9]/'],
            'telephone'   => ['required', 'string',
                              'regex:/^(\+216|00216|0)?[23456789]\d{7}$/'],
            'departement' => ['required', 'string'],
        ];
    }

    public function managerRules(): array
    {
        return [
            'name'        => ['required', 'string', 'min:2', 'max:100'],
            'email'       => ['required', 'string', 'email', 'unique:users'],
            'password'    => ['required', 'string', 'min:8', 'confirmed',
                              'regex:/[a-z]/', 'regex:/[A-Z]/', 'regex:/[0-9]/'],
            'telephone'   => ['required', 'string',
                              'regex:/^(\+216|00216|0)?[23456789]\d{7}$/'],
            'departement' => ['required', 'string'],
            'position'    => ['required', 'string'],
        ];
    }

    public function loginRules(): array
    {
        return [
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Messages de validation personnalisés — un seul endroit
     * pour tous les messages d'erreur de l'application.
     */
    public function validationMessages(): array
    {
        return [
            'name.required'      => 'Nom obligatoire',
            'name.regex'         => 'Le nom ne doit contenir que des lettres',
            'email.required'     => 'Email obligatoire',
            'email.unique'       => 'Email déjà utilisé',
            'email.email'        => "Format d'email invalide",
            'password.required'  => 'Mot de passe obligatoire',
            'password.min'       => 'Le mot de passe doit contenir au moins 8 caractères',
            'password.confirmed' => 'Les mots de passe ne correspondent pas',
            'password.regex'     => 'Le mot de passe doit contenir des minuscules, majuscules et chiffres',
            'telephone.required' => 'Téléphone obligatoire',
            'telephone.regex'    => 'Numéro de téléphone tunisien invalide',
            'linkedin_url.url'   => 'URL LinkedIn invalide',
            'departement.required' => 'Département obligatoire',
            'position.required'  => 'Poste obligatoire',
        ];
    }

    /* ═══════════════════════════════════════════════════════
       INSCRIPTIONS
       ═══════════════════════════════════════════════════════ */

    /**
     * Crée un compte candidat.
     * $data = tableau validé par le controller.
     * Retourne un tableau ['user' => User, 'token' => string].
     */
    // app/Services/AuthService.php


public function registerCandidat(array $data): array
{
    $user = User::create([
        'name'         => trim($data['name']),
        'email'        => strtolower(trim($data['email'])),
        'password' => $data['password'],
        'role'         => 'candidat',
        'telephone'    => $data['telephone'] ?? null,
        'linkedin_url' => $data['linkedin_url'] ?? null,
    ]);

    // ✅ Déclenche l'envoi automatique de l'email de vérification
    event(new Registered($user));

    Log::info('✅ Candidat créé', ['user_id' => $user->id]);

    return $this->makeTokenPayload($user);
}

    /**
     * Crée un compte RH — marqué is_approved = false
     * en attente de validation par l'admin.
     */
    public function registerRh(array $data): array
    {
        $user = User::create([
            'name'        => trim($data['name']),
            'email'       => strtolower(trim($data['email'])),
            'password' => $data['password'],
            'role'        => 'rh',
            'telephone'   => $data['telephone'],
            'departement' => $data['departement'],
            'is_approved' => false,  // ← admin doit approuver
        ]);

        Log::info('✅ RH créé (en attente)', ['user_id' => $user->id]);

        return $this->makeTokenPayload($user);
    }

    /**
     * Crée un compte Manager — même logique que RH
     * avec un champ position en plus.
     */
    public function registerManager(array $data): array
    {
        $user = User::create([
            'name'        => trim($data['name']),
            'email'       => strtolower(trim($data['email'])),
            'password' => $data['password'],
            'role'        => 'manager',
            'telephone'   => $data['telephone'],
            'departement' => $data['departement'],
            'position'    => $data['position'],
            'is_approved' => false,  // ← admin doit approuver
        ]);

        Log::info('✅ Manager créé (en attente)', ['user_id' => $user->id]);

        return $this->makeTokenPayload($user);
    }

    /* ═══════════════════════════════════════════════════════
       LOGIN
       ═══════════════════════════════════════════════════════ */

    /**
     * Authentifie un utilisateur classique (candidat/rh/manager).
     *
     * Retourne un tableau avec :
     *   - 'success' => bool
     *   - 'status'  => int  (code HTTP)
     *   - 'message' => string
     *   - 'data'    => array|null  (token + user si succès)
     *
     * Le controller utilise status pour le code HTTP de la réponse.
     */
    public function login(string $email, string $password): array
    {
        // Bloquer le compte admin sur cette route
        if ($email === config('auth.admin.email')) {
            return [
                'success' => false,
                'status'  => 403,
                'message' => 'Utilisez /api/login/admin pour le compte administrateur.',
                'data'    => null,
            ];
        }

        $user = User::where('email', $email)->first();

        // Vérifier existence + mot de passe
        if (!$user || !Hash::check($password, $user->password)) {
            return [
                'success' => false,
                'status'  => 401,
                'message' => 'Email ou mot de passe incorrect',
                'data'    => null,
            ];
        }

        // Vérifier approbation pour rh et manager
        if ($this->requiresApproval($user)) {
            return [
                'success' => false,
                'status'  => 403,
                'message' => "Votre compte est en attente d'approbation par l'administrateur.",
                'data'    => null,
            ];
        }

        return [
            'success' => true,
            'status'  => 200,
            'message' => 'Connexion réussie',
            'data'    => $this->makeTokenPayload($user),
        ];
    }

    /**
     * Authentifie l'administrateur.
     * Utilise config() et non env() pour être compatible
     * avec php artisan config:cache en production.
     */
    public function loginAdmin(string $email, string $password): array
    {
        // Comparer avec les identifiants stockés dans config
        if (
            $email    !== config('auth.admin.email') ||
            $password !== config('auth.admin.password')
        ) {
            return [
                'success' => false,
                'status'  => 401,
                'message' => 'Identifiants administrateur incorrects.',
                'data'    => null,
            ];
        }

        // firstOrCreate — crée le compte admin en base
        // s'il n'existe pas encore (premier démarrage)
        $admin = User::firstOrCreate(
            ['email' => config('auth.admin.email')],
            [
                'name'     => 'Administrateur',
                'password' => config('auth.admin.password'),
                'role'     => 'admin',
            ]
        );

        // Sécurité — forcer le rôle admin si modifié en base
        if ($admin->role !== 'admin') {
            $admin->update(['role' => 'admin']);
        }

        return [
            'success' => true,
            'status'  => 200,
            'message' => 'Connexion administrateur réussie',
            'data'    => $this->makeTokenPayload($admin),
        ];
    }

    /* ═══════════════════════════════════════════════════════
       OAUTH — logique commune Google + LinkedIn
       ═══════════════════════════════════════════════════════ */

    /**
     * Trouve l'utilisateur par email OU par [provider + social_id].
     * Si inexistant → crée le compte.
     * Si existant   → met à jour les infos sociales.
     *
     * Retourne l'User hydraté prêt à recevoir un token.
     */
    public function findOrCreateSocialUser(
    string $email,
    string $socialId,
    string $name,
    ?string $avatar,
    string $provider
): User {
    // ✅ Chercher par email uniquement (social_id est chiffré, non recherchable)
    $user = User::where('email', $email)->first();

    if (!$user) {
        $user = User::create([
            'name'              => $name,
            'email'             => $email,
            'password' => Str::random(40),
            'email_verified_at' => now(),
            'role'              => 'candidat',
            'social_provider'   => $provider,
            'social_id'         => Crypt::encryptString($socialId),  // ✅
            'avatar'            => $avatar,
        ]);

        Log::info('✅ Social user créé', [
            'user_id'  => $user->id,
            'provider' => $provider,
        ]);
    } else {
        $updateData = [
            'social_provider' => $provider,
            'social_id'       => Crypt::encryptString($socialId),  // ✅
            'avatar'          => $avatar ?? $user->avatar,
        ];

        if (empty($user->password)) {
            $updateData['password'] = Str::random(40);
        }

        $user->update($updateData);

        Log::info('✅ Social user mis à jour', [
            'user_id'  => $user->id,
            'provider' => $provider,
        ]);
    }

    return $user;
}

    
    public function buildSocialRedirectUrl(
    User $user,
    string $provider,
    ?string $from
): string {
    $token       = $user->createToken('auth_token')->plainTextToken;
    $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');

    // ✅ url()->query() gère l'encodage et ignore les nulls
    return url()->query(
        $frontendUrl . '/social/callback',
        array_filter([
            'token'    => $token,
            'provider' => $provider,
            'from'     => $from,    // ignoré si null
        ])
    );
}

public function buildErrorRedirectUrl(string $errorCode): string
{
    $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');

    // ✅ encodage automatique de $errorCode
    return url()->query(
        $frontendUrl . '/login',
        ['error' => $errorCode]
    );
}

    /**
     * Extrait le paramètre 'from' depuis le state OAuth encodé
     * ou depuis le query param direct.
     *
     * Google encode 'from' dans le state base64 pour le préserver
     * pendant la redirection OAuth.
     */
    public function extractFromParam(?string $rawState, ?string $queryFrom): ?string
    {
        // Priorité 1 — state OAuth encodé (Google)
        if ($rawState) {
            $decoded = json_decode(base64_decode($rawState), true);
            if (!empty($decoded['from'])) {
                return $decoded['from'];
            }
        }

        // Priorité 2 — query param direct (LinkedIn)
        return $queryFrom ?: null;
    }

    /* ═══════════════════════════════════════════════════════
       HELPERS PRIVÉS
       ═══════════════════════════════════════════════════════ */

    /**
     * Vérifie si l'utilisateur doit être approuvé par l'admin
     * avant de pouvoir se connecter.
     * Centralisé ici — une seule règle à modifier si besoin.
     */
    private function requiresApproval(User $user): bool
    {
        return in_array($user->role, ['rh', 'manager'])
            && !$user->is_approved;
    }

    /**
     * Génère le token Sanctum et retourne le tableau
     * de données utilisateur standardisé.
     * Utilisé par login(), registerX(), et loginAdmin().
     */
    public function makeTokenPayload(User $user): array
    {
        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'user'         => [
                'id'              => $user->id,
                'name'            => $user->name,
                'email'           => $user->email,
                'role'            => $user->role,
                'avatar'          => $user->avatar,
                'social_provider' => $user->social_provider,
                'email_verified_at'  => $user->email_verified_at,
            ],
        ];
    }
}