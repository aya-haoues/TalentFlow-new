<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Hash;
use App\Http\Resources\UserResource;

class AuthService
{
    /* ═══════════════════════════════════════════════════════
       VALIDATION RULES
       ═══════════════════════════════════════════════════════ */

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

    public function validationMessages(): array
    {
        return [
            'name.required'        => 'Nom obligatoire',
            'name.regex'           => 'Le nom ne doit contenir que des lettres',
            'email.required'       => 'Email obligatoire',
            'email.unique'         => 'Email déjà utilisé',
            'email.email'          => "Format d'email invalide",
            'password.required'    => 'Mot de passe obligatoire',
            'password.min'         => 'Le mot de passe doit contenir au moins 8 caractères',
            'password.confirmed'   => 'Les mots de passe ne correspondent pas',
            'password.regex'       => 'Le mot de passe doit contenir des minuscules, majuscules et chiffres',
            'telephone.required'   => 'Téléphone obligatoire',
            'telephone.regex'      => 'Numéro de téléphone tunisien invalide',
            'linkedin_url.url'     => 'URL LinkedIn invalide',
            'departement.required' => 'Département obligatoire',
            'position.required'    => 'Poste obligatoire',
        ];
    }

    /* ═══════════════════════════════════════════════════════
       INSCRIPTIONS
       ═══════════════════════════════════════════════════════ */

    public function registerCandidat(array $data): array
    {
        $user = User::create([
            'name'         => $data['name'],        // ✅ trim() géré par mutator
            'email'        => $data['email'],        // ✅ strtolower+trim géré par mutator
            'password'     => $data['password'],     // ✅ hashed géré par cast
            'role'         => 'candidat',
            'telephone'    => $data['telephone'] ?? null,
            'linkedin_url' => $data['linkedin_url'] ?? null,
        ]);

        event(new Registered($user));

        Log::info('✅ Candidat créé', ['user_id' => $user->id]);

        return $this->makeTokenPayload($user);
    }

    public function registerRh(array $data): array
    {
        $user = User::create([
            'name'        => $data['name'],          // ✅ trim() géré par mutator
            'email'       => $data['email'],          // ✅ strtolower+trim géré par mutator
            'password'    => $data['password'],       // ✅ hashed géré par cast
            'role'        => 'rh',
            'telephone'   => $data['telephone'],
            'departement' => $data['departement'],
            'is_approved' => false,
        ]);

        Log::info('✅ RH créé (en attente)', ['user_id' => $user->id]);

        return $this->makeTokenPayload($user);
    }

    public function registerManager(array $data): array
    {
        $user = User::create([
            'name'        => $data['name'],          // ✅ trim() géré par mutator
            'email'       => $data['email'],          // ✅ strtolower+trim géré par mutator
            'password'    => $data['password'],       // ✅ hashed géré par cast
            'role'        => 'manager',
            'telephone'   => $data['telephone'],
            'departement' => $data['departement'],
            'position'    => $data['position'],
            'is_approved' => false,
        ]);

        Log::info('✅ Manager créé (en attente)', ['user_id' => $user->id]);

        return $this->makeTokenPayload($user);
    }

    /* ═══════════════════════════════════════════════════════
       LOGIN
       ═══════════════════════════════════════════════════════ */

    public function login(string $email, string $password, ?string $role = null): array
{
    if ($email === config('auth.admin.email')) {
        return [
            'success' => false,
            'status'  => 403,
            'message' => 'Utilisez /api/login/admin pour le compte administrateur.',
            'data'    => null,
        ];
    }

    $user = User::where('email', $email)->first();

    if (!$user || !Hash::check($password, $user->password)) {
        return [
            'success' => false,
            'status'  => 401,
            'message' => 'Email ou mot de passe incorrect',
            'data'    => null,
        ];
    }

    // ✅ Vérifier le rôle si spécifié
    if ($role && $user->role !== $role) {
        return [
            'success' => false,
            'status'  => 403,
            'message' => "Ce compte n'est pas un compte {$role}.",
            'data'    => null,
        ];
    }

    if ($this->requiresApproval($user)) {
        return [
            'success' => false,
            'status'  => 403,
            'message' => "Votre compte est en attente d'approbation par l'administrateur.",
            'data'    => null,
        ];
    }

    if ($user->is_blocked) {
        return [
            'success' => false,
            'status'  => 403,
            'message' => 'Votre compte est bloqué.',
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

    public function loginAdmin(string $email, string $password): array
{
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

    // ✅ Trouver le user existant sans le recréer
    $admin = User::where('email', config('auth.admin.email'))
                 ->where('role', 'admin')
                 ->first();

    if (!$admin) {
        return [
            'success' => false,
            'status'  => 401,
            'message' => 'Compte administrateur introuvable en base.',
            'data'    => null,
        ];
    }

    return [
        'success' => true,
        'status'  => 200,
        'message' => 'Connexion administrateur réussie',
        'data'    => $this->makeTokenPayload($admin),
    ];
}
    /* ═══════════════════════════════════════════════════════
       OAUTH
       ═══════════════════════════════════════════════════════ */

    public function findOrCreateSocialUser(
        string $email,
        string $socialId,
        string $name,
        ?string $avatar,
        string $provider
    ): User {
        $user = User::where('email', $email)->first();

        if (!$user) {
            $user = User::create([
                'name'              => $name,              // ✅ trim par mutator
                'email'             => $email,             // ✅ strtolower par mutator
                'password'          => Str::random(40),    // ✅ hashed par cast
                'email_verified_at' => now(),
                'role'              => 'candidat',
                'social_provider'   => $provider,
                'social_id'         => $socialId,          // ✅ encrypted par cast
                'avatar'            => $avatar,
            ]);

            Log::info('✅ Social user créé', [
                'user_id'  => $user->id,
                'provider' => $provider,
            ]);
        } else {
            $updateData = [
                'social_provider' => $provider,
                'social_id'       => $socialId,            // ✅ encrypted par cast
                'avatar'          => $avatar ?? $user->avatar,
            ];

            if (empty($user->password)) {
                $updateData['password'] = Str::random(40); // ✅ hashed par cast
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

        return url()->query(
            $frontendUrl . '/social/callback',
            array_filter([
                'token'    => $token,
                'provider' => $provider,
                'from'     => $from,
            ])
        );
    }

    public function buildErrorRedirectUrl(string $errorCode): string
    {
        $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');

        return url()->query(
            $frontendUrl . '/login',
            ['error' => $errorCode]
        );
    }

    public function extractFromParam(?string $rawState, ?string $queryFrom): ?string
    {
        if ($rawState) {
            $decoded = json_decode(base64_decode($rawState), true);
            if (!empty($decoded['from'])) {
                return $decoded['from'];
            }
        }

        return $queryFrom ?: null;
    }

    /* ═══════════════════════════════════════════════════════
       HELPERS PRIVÉS
       ═══════════════════════════════════════════════════════ */

    private function requiresApproval(User $user): bool
    {
        return in_array($user->role, ['rh', 'manager'])
            && !$user->is_approved;
    }

    public function makeTokenPayload(User $user): array
    {
        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'user'         => new UserResource($user),
        ];
    }
}
