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
use Illuminate\Support\Facades\Http;

class AuthController extends Controller
{
    /**
     *  INSCRIPTION CANDIDAT (Avec détection de compte Social existant)
     */
    public function registerCandidat(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'min:2', 'max:100', 'regex:/^[a-zA-Zàâçéèêëîïôûùüÿñæœ\s]+$/u'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'], // Le 'unique' bloque ici
            'password' => ['required', 'string', 'min:8', 'confirmed', 'regex:/[a-z]/', 'regex:/[A-Z]/', 'regex:/[0-9]/'],
            'telephone' => ['nullable', 'string', 'regex:/^(\+216|00216|0)?[23456789]\d{7}$/'],
            'linkedin_url' => ['nullable', 'url'],
        ], $this->validationMessages());

        if ($validator->fails()) {
            // 🔍 LOGIQUE PERSONNALISÉE : Vérifier si l'email existe déjà via un login Social
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

        // Si la validation passe, on crée l'utilisateur
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
    /**
     *  INSCRIPTION RH
     */
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

    /**
     *  LOGIN UNIFIÉ
     */
    public function login(Request $request)
    {
        $credentials = $request->only('email', 'password');

        if (!Auth::attempt($credentials)) {
            return response()->json(['success' => false, 'message' => 'Email ou mot de passe incorrect'], 401);
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();
        return $this->respondWithToken($user, 'Connexion réussie');
    }

    /**
     *  MÉTHODES SOCIALES (GOOGLE)
     */
    public function redirectToGoogle()
    {
        /** @var \Laravel\Socialite\Two\AbstractProvider $driver */
        $driver = Socialite::driver('google');
        return $driver->stateless()->redirect();
    }

    public function handleGoogleCallback()
    {
        try {
            /** @var \Laravel\Socialite\Two\AbstractProvider $driver */
            $driver = Socialite::driver('google');
            $socialUser = $driver->stateless()->user();

            return $this->handleSocialLogin($socialUser, 'google');
        } catch (\Exception $e) {
            Log::error('Google Auth Error: ' . $e->getMessage());
            return redirect('http://localhost:5173/login?error=google_failed');
        }
    }

    /**
     * 🔑 MÉTHODES SOCIALES (LINKEDIN - OpenID Connect)
     */
    public function redirectToLinkedIn()
    {
        /** @var \Laravel\Socialite\Two\AbstractProvider $driver */
        $driver = Socialite::driver('linkedin');

        return $driver->scopes(['openid', 'profile', 'email'])
            ->stateless()
            ->redirect();
    }

    public function handleLinkedInCallback(Request $request)
    {
        $code = $request->query('code');

        if (!$code) {
            return redirect('http://localhost:5173/login?error=no_code_provided');
        }

        try {
            // Échange du code contre Token via HTTP Client
            $tokenResponse = Http::asForm()->post('https://www.linkedin.com/oauth/v2/accessToken', [
                'grant_type'    => 'authorization_code',
                'code'          => $code,
                'redirect_uri'  => config('services.linkedin.redirect'),
                'client_id'     => config('services.linkedin.client_id'),
                'client_secret' => config('services.linkedin.client_secret'),
            ]);

            if ($tokenResponse->failed()) throw new \Exception("LinkedIn Token Failed");

            $accessToken = $tokenResponse->json()['access_token'];

            // Récupération Profil via OpenID
            $userResponse = Http::withToken($accessToken)->get('https://api.linkedin.com/v2/userinfo');
            $userData = $userResponse->json();

            // Objet standard pour le login
            $socialUser = new \stdClass();
            $socialUser->id = $userData['sub'];
            $socialUser->name = $userData['name'];
            $socialUser->email = $userData['email'];
            $socialUser->avatar = $userData['picture'] ?? null;

            return $this->handleSocialLogin($socialUser, 'linkedin');
        } catch (\Exception $e) {
            Log::error('LinkedIn Auth Error: ' . $e->getMessage());
            return redirect('http://localhost:5173/login?error=linkedin_failed');
        }
    }

    /**
     * 🔄 LOGIQUE COMMUNE POUR LOGIN SOCIAL
     */
    private function handleSocialLogin($socialUser, $provider)
    {
        // Extraction des données selon que ce soit un objet Socialite ou stdClass
        $id = is_object($socialUser) && method_exists($socialUser, 'getId') ? $socialUser->getId() : ($socialUser->id ?? null);
        $email = is_object($socialUser) && method_exists($socialUser, 'getEmail') ? $socialUser->getEmail() : ($socialUser->email ?? null);
        $name = is_object($socialUser) && method_exists($socialUser, 'getName') ? $socialUser->getName() : ($socialUser->name ?? null);
        $avatar = is_object($socialUser) && method_exists($socialUser, 'getAvatar') ? $socialUser->getAvatar() : ($socialUser->avatar ?? null);

        $user = User::where('email', $email)->first();

        if (!$user) {
            $user = User::create([
                'name' => $name ?? 'Utilisateur',
                'email' => $email,
                'password' => Hash::make(Str::random(24)),
                'role' => 'candidat',
                'social_id' => $id,
                'social_provider' => $provider,
                'avatar' => $avatar,
            ]);
        } else {
            $user->update([
                'social_id' => $id,
                'social_provider' => $provider,
                'avatar' => $avatar ?? $user->avatar,
            ]);
        }

        $token = $user->createToken('social_token')->plainTextToken;
        $userJson = json_encode($user->only(['id', 'name', 'email', 'role', 'avatar']));

        return redirect("http://localhost:5173/social/callback?token={$token}&user=" . urlencode($userJson));
    }

    /**
     * 🚪 DECONNEXION
     */
    public function logout(Request $request)
    {
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }
        return response()->json(['success' => true, 'message' => 'Déconnexion réussie']);
    }

    /**
     * 📦 HELPER : REPONSE AVEC TOKEN
     */
    private function respondWithToken($user, $message)
    {
        $token = $user->createToken('auth_token')->plainTextToken;
        return response()->json([
            'success' => true,
            'message' => $message,
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ], 200);
    }

    private function validationMessages(): array
    {
        return [
            'name.required' => 'Nom obligatoire',
            'email.required' => 'Email obligatoire',
            'email.unique' => 'Email déjà utilisé',
            'password.required' => 'Mot de passe obligatoire',
            'password.confirmed' => 'Les mots de passe ne correspondent pas',
        ];
    }
}
