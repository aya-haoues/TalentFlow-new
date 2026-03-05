<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    /* ═══════════════════════════════════════════════════════
       INSCRIPTIONS
       ═══════════════════════════════════════════════════════ */

    public function registerCandidat(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'min:2', 'max:100', 'regex:/^[a-zA-Zàâçéèêëîïôûùüÿñæœ\s]+$/u'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed', 'regex:/[a-z]/', 'regex:/[A-Z]/', 'regex:/[0-9]/'],
            'telephone' => ['nullable', 'string', 'regex:/^(\+216|00216|0)?[23456789]\d{7}$/'],
            'linkedin_url' => ['nullable', 'url'],
        ], $this->validationMessages());

        if ($validator->fails()) {
            $existingUser = User::where('email', $request->email)->first();
            if ($existingUser && $existingUser->social_provider) {
                return response()->json([
                    'success' => false,
                    'errors' => [
                        'email' => ["Cet email est lié à un compte " . ucfirst($existingUser->social_provider) . ". Veuillez vous connecter via ce service."]
                    ]
                ], 422);
            }
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name' => trim($request->name),
            'email' => strtolower(trim($request->email)),
            'password' => Hash::make($request->password),
            'role' => 'candidat',
            'telephone' => $request->telephone,
            'linkedin_url' => $request->linkedin_url,
        ]);

        return $this->respondWithToken($user, 'Inscription réussie !');
    }

    public function registerRh(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'email' => ['required', 'string', 'email', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'telephone' => ['required', 'string'],
            'departement' => ['required', 'string'],
        ], $this->validationMessages());

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name' => trim($request->name),
            'email' => strtolower(trim($request->email)),
            'password' => Hash::make($request->password),
            'role' => 'rh',
            'telephone' => $request->telephone,
            'departement' => $request->departement,
        ]);

        return $this->respondWithToken($user, 'Compte RH créé.');
    }

    /* ═══════════════════════════════════════════════════════
       LOGIN EMAIL/PASSWORD
       ═══════════════════════════════════════════════════════ */

    public function login(Request $request)
{
    $user = \App\Models\User::where('email', $request->email)->first();

if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
            'success' => false,
            'message' => 'Email ou mot de passe incorrect'
        ], 401);
    }

    return $this->respondWithToken($user, 'Connexion réussie');
}

    /* ═══════════════════════════════════════════════════════
       GOOGLE OAUTH
       ═══════════════════════════════════════════════════════ */

    public function redirectToGoogle()
{
    $from = request()->query('from');
    
    // ✅ Encoder 'from' dans le state OAuth pour le récupérer au callback
    $state = $from ? base64_encode(json_encode(['from' => $from])) : null;
    
    $driver = Socialite::driver('google')
        ->scopes(['openid', 'profile', 'email'])
        ->stateless();
    
    if ($state) {
        $driver = $driver->with(['state' => $state]);
    }
    
    return $driver->redirect();
}

    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')
                ->scopes(['openid', 'profile', 'email'])
                ->stateless()
                ->user();

            if (!$googleUser->getEmail()) {
                Log::warning('⚠️ Google: No email provided', ['user' => $googleUser->getId()]);
                return $this->redirectWithError('no_email_from_google');
            }

            return $this->handleSocialLogin($googleUser, 'google');

        } catch (\Laravel\Socialite\Two\InvalidStateException $e) {
            Log::error('❌ Google: Invalid state', ['message' => $e->getMessage()]);
            return $this->redirectWithError('invalid_state');
        } catch (\Exception $e) {
            Log::error('❌ Google: Unexpected error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->redirectWithError('social_auth_failed');
        }
    }

    /* ═══════════════════════════════════════════════════════
       LINKEDIN OAUTH (OpenID Connect)
       ═══════════════════════════════════════════════════════ */

   public function redirectToLinkedIn()
{
    return Socialite::driver('linkedin-openid')
        ->stateless()
        ->redirect();
}

public function handleLinkedInCallback()
{
    try {
        $linkedinUser = Socialite::driver('linkedin-openid')
            ->stateless()
            ->user();

        if (!$linkedinUser->getEmail()) {
            return $this->redirectWithError('no_email_from_linkedin');
        }

        return $this->handleSocialLogin($linkedinUser, 'linkedin');

    } catch (\Exception $e) {
        Log::error('❌ LinkedIn error', ['message' => $e->getMessage()]);
        return $this->redirectWithError('social_auth_failed');
    }
}
    /* ═══════════════════════════════════════════════════════
       LOGIQUE COMMUNE POUR GOOGLE ET LINKEDIN
       ═══════════════════════════════════════════════════════ */

    private function handleSocialLogin($socialUser, string $provider)
    {
        // ✅ Extraire les données de manière sécurisée
        $email = $socialUser->getEmail();
        if ($email) {
            $email = strtolower(trim($email));
        }
        
        $socialId = $socialUser->getId();
        $name = $socialUser->getName() ?? 'Utilisateur';
        $avatar = $socialUser->getAvatar();

        // ✅ Vérifier que l'email est présent (requis pour l'authentification)
        if (!$email) {
            Log::warning('⚠️ Social login: No email', ['provider' => $provider, 'social_id' => $socialId]);
            return $this->redirectWithError("no_email_from_{$provider}");
        }

        // ✅ Chercher un utilisateur par email OU par [provider + social_id]
        $user = User::where('email', $email)
            ->orWhere(function ($query) use ($provider, $socialId) {
                $query->where('social_provider', $provider)
                      ->where('social_id', $socialId);
            })
            ->first();

        if (!$user) {
            // ✅ Créer un nouvel utilisateur
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make(Str::random(40)),  // cast 'hashed' supprimé donc ok
                'email_verified_at' => now(),  // Le provider a déjà vérifié l'email
                'role' => 'candidat',
                'social_provider' => $provider,
                'social_id' => $socialId,
                'avatar' => $avatar,
            ]);
            Log::info('✅ Social user created', [
                'user_id' => $user->id,
                'provider' => $provider,
                'email' => $email
            ]);
        } else {
            // ✅ Mettre à jour les infos sociales si l'utilisateur existe
            $updateData = [
                'social_provider' => $provider,
                'social_id' => $socialId,
                'avatar' => $avatar ?? $user->avatar,
            ];
            
            // Si l'utilisateur n'a pas de mot de passe (créé via social), en générer un
            if (empty($user->password) || $user->password === '') {
                $updateData['password'] = bcrypt(Str::random(40));
            }
            
            $user->update($updateData);
            Log::info('✅ Social user updated', [
                'user_id' => $user->id,
                'provider' => $provider
            ]);
        }

        // ✅ Générer le token Sanctum
        $token = $user->createToken('auth_token')->plainTextToken;

        // ✅ Récupérer 'from' depuis le state OAuth OU query param
    $from = null;
    $rawState = request()->query('state');
    
    if ($rawState) {
        $decoded = json_decode(base64_decode($rawState), true);
        $from = $decoded['from'] ?? null;
    }
    
    // Fallback sur query param direct
    if (!$from) {
        $from = request()->query('from');
    }

        // ✅ Construire l'URL de redirection vers le frontend
        $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');
        
        $redirectUrl = "{$frontendUrl}/social/callback?token=" . rawurlencode($token)
                     . '&provider=' . rawurlencode($provider);  // ✅ Ajouter provider pour le frontend

        // ✅ Ajouter from SI présent (pour rediriger vers ApplyJobPage)
    if ($from) {
        $redirectUrl .= '&from=' . rawurlencode($from);
    }

        Log::info('🔗 Social login redirect', [
            'provider' => $provider,
            'user_id' => $user->id,
            'redirect_url' => $redirectUrl
        ]);

        // ✅ Utiliser redirect()->away() pour les URLs externes (cross-domain)
        return redirect()->away($redirectUrl);
    }

    /* ═══════════════════════════════════════════════════════
       HELPERS
       ═══════════════════════════════════════════════════════ */

    /**
     * Helper pour rediriger vers le frontend avec une erreur
     */
    private function redirectWithError(string $errorCode): \Illuminate\Http\RedirectResponse
    {
        $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');
        return redirect()->away("{$frontendUrl}/login?error={$errorCode}");
    }

    /**
     * Déconnexion
     */
    public function logout(Request $request)
    {
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }
        return response()->json(['success' => true, 'message' => 'Déconnexion réussie']);
    }

    /**
     * Helper : Réponse JSON avec token Sanctum
     */
    private function respondWithToken($user, string $message)
    {
        $token = $user->createToken('auth_token')->plainTextToken;
        
        return response()->json([
            'success' => true,
            'message' => $message,
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'avatar' => $user->avatar,
                'social_provider' => $user->social_provider,
            ]
        ], 200);
    }

    /**
     * Messages de validation personnalisés
     */
    private function validationMessages(): array
    {
        return [
            'name.required' => 'Nom obligatoire',
            'email.required' => 'Email obligatoire',
            'email.unique' => 'Email déjà utilisé',
            'email.email' => 'Format d\'email invalide',
            'password.required' => 'Mot de passe obligatoire',
            'password.min' => 'Le mot de passe doit contenir au moins 8 caractères',
            'password.confirmed' => 'Les mots de passe ne correspondent pas',
            'password.regex' => 'Le mot de passe doit contenir des minuscules, majuscules et chiffres',
            'telephone.regex' => 'Numéro de téléphone tunisien invalide',
            'linkedin_url.url' => 'URL LinkedIn invalide',
        ];
    }
}