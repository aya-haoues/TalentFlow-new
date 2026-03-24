<?php

namespace App\Http\Controllers;

use App\Services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Http\JsonResponse;


class AuthController extends Controller
{
    /**
     * AuthService injecté automatiquement par le container IoC.
     * Le controller ne connaît pas la BDD, Hash, Str, etc.
     * Il délègue tout au service.
     */
    public function __construct(
        protected AuthService $authService
    ) {}

     // Toutes les méthodes ont accès à $this->authService
     
    /* ═══════════════════════════════════════════════════════
       INSCRIPTIONS
       ═══════════════════════════════════════════════════════ */

    public function registerCandidat(Request $request)
    {
        // Règles viennent du service — controller ne les connaît pas
        $validator = Validator::make(
            $request->all(),
            $this->authService->candidatRules(),
            $this->authService->validationMessages()
        );

        if ($validator->fails()) {
            // Cas spécial : email lié à un compte social
            $existingUser = \App\Models\User::where('email', $request->email)->first();
            if ($existingUser?->social_provider) {
                return response()->json([
                    'success' => false,
                    'errors'  => [
                        'email' => [
                            'Cet email est lié à un compte '
                            . ucfirst($existingUser->social_provider)
                            . '. Veuillez vous connecter via ce service.'
                        ],
                    ],
                ], 422);
            }

            return response()->json([
                'success' => false,
                'errors'  => $validator->errors()
            ], 422);
        }

        // Délègue la création au service
        $payload = $this->authService->registerCandidat($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Inscription réussie !',
            ...$payload,    // access_token, token_type, user
        ], 201);            // 201 Created
    }

    public function registerRh(Request $request)
    {
        $validator = Validator::make(
            $request->all(),
            $this->authService->rhRules(),
            $this->authService->validationMessages()
        );

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors()
            ], 422);
        }

        $payload = $this->authService->registerRh($validator->validated());

        return response()->json([
            'success' => true,
            'message' => "Compte RH créé. En attente d'approbation.",
            ...$payload,
        ], 201);
    }

    public function registerManager(Request $request)
    {
        $validator = Validator::make(
            $request->all(),
            $this->authService->managerRules(),
            $this->authService->validationMessages()
        );

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors()
            ], 422);
        }

        $payload = $this->authService->registerManager($validator->validated());

        return response()->json([
            'success' => true,
            'message' => "Compte Manager créé. En attente d'approbation.",
            ...$payload,
        ], 201);
    }

    /* ═══════════════════════════════════════════════════════
       LOGIN
       ═══════════════════════════════════════════════════════ */

    
public function login(Request $request): JsonResponse
{
    $request->validate($this->authService->loginRules());

    // Détecter le rôle depuis l'URL
    $role = null;
    if (str_contains($request->path(), 'login/rh')) {
        $role = 'rh';
    } elseif (str_contains($request->path(), 'login/manager')) {
        $role = 'manager';
    }

    $result = $this->authService->login(
        $request->email,
        $request->password,
        $role
    );

    return response()->json(
        $result['data']
            ? array_merge(['success' => $result['success'], 'message' => $result['message']], $result['data'])
            : ['success' => $result['success'], 'message' => $result['message']],
        $result['status']
    );
}

    public function loginAdmin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors()
            ], 422);
        }

        Log::info('🔐 Tentative connexion admin', [
            'email' => $request->email,
            'ip'    => $request->ip(),
        ]);

        $result = $this->authService->loginAdmin(
            $request->email,
            $request->password
        );

        if (!$result['success']) {
            Log::warning('⛔ Connexion admin échouée', [
                'email' => $request->email,
                'ip'    => $request->ip(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], $result['status']);
        }

        Log::info('✅ Connexion admin réussie', [
            'ip' => $request->ip()
        ]);

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            ...$result['data'],
        ], 200);
    }

    /* ═══════════════════════════════════════════════════════
       GOOGLE OAUTH
       ═══════════════════════════════════════════════════════ */

    public function redirectToGoogle()
{
    $from  = request()->query('from');
    $state = $from ? base64_encode(json_encode(['from' => $from])) : null;

    /** @var \Laravel\Socialite\Two\AbstractProvider $driver */
    $driver = Socialite::driver('google');  // ← @var s'applique ici ✅
    $driver = $driver->stateless();         // ← plus de rouge ✅

    if ($state) {
        $driver = $driver->with(['state' => $state]);
    }

    return $driver->redirect();
}

public function handleGoogleCallback()
{
    try {
        /** @var \Laravel\Socialite\Two\AbstractProvider $googleDriver */
        $googleDriver = Socialite::driver('google');  // ← @var ici ✅
        $googleUser   = $googleDriver->stateless()->user(); // ← plus de rouge ✅

        if (!$googleUser->getEmail()) {
            return redirect()->away(
                $this->authService->buildErrorRedirectUrl('no_email_from_google')
            );
        }

        return $this->handleSocialLogin($googleUser, 'google');

    } catch (\Exception $e) {
        Log::error('❌ Google: Unexpected error', ['message' => $e->getMessage()]);
        return redirect()->away(
            $this->authService->buildErrorRedirectUrl('social_auth_failed')
        );
    }
}

    /* ═══════════════════════════════════════════════════════
       LINKEDIN OAUTH
       ═══════════════════════════════════════════════════════ */

    public function redirectToLinkedIn()
{
    /** @var \Laravel\Socialite\Two\AbstractProvider $driver */
    $driver = Socialite::driver('linkedin-openid');
    return $driver->stateless()->redirect();
}

public function handleLinkedInCallback()
{
    try {
        /** @var \Laravel\Socialite\Two\AbstractProvider $driver */
        $driver      = Socialite::driver('linkedin-openid');
        $linkedinUser = $driver->stateless()->user();

        if (!$linkedinUser->getEmail()) {
            return redirect()->away(
                $this->authService->buildErrorRedirectUrl('no_email_from_linkedin')
            );
        }

        return $this->handleSocialLogin($linkedinUser, 'linkedin');

    } catch (\Exception $e) {
        Log::error('❌ LinkedIn error', ['message' => $e->getMessage()]);
        return redirect()->away(
            $this->authService->buildErrorRedirectUrl('social_auth_failed')
        );
    }
}

    /* ═══════════════════════════════════════════════════════
       LOGIQUE COMMUNE OAUTH — privée au controller
       ═══════════════════════════════════════════════════════ */

    /**
     * Point commun Google + LinkedIn.
     * Controller extrait les données brutes de Socialite,
     * puis délègue tout au service.
     */
    private function handleSocialLogin($socialUser, string $provider)
    {
        $email = strtolower(trim($socialUser->getEmail()));

        // Service gère findOrCreate + update en base
        $user = $this->authService->findOrCreateSocialUser(
            email:    $email,
            socialId: $socialUser->getId(),
            name:     $socialUser->getName() ?? 'Utilisateur',
            avatar:   $socialUser->getAvatar(),
            provider: $provider,
        );

        // Extraire 'from' depuis state OAuth ou query param
        $from = $this->authService->extractFromParam(
            rawState:   request()->query('state'),
            queryFrom:  request()->query('from'),
        );

        // Service construit l'URL de redirection avec le token
        $redirectUrl = $this->authService->buildSocialRedirectUrl(
            user:     $user,
            provider: $provider,
            from:     $from,
        );

        Log::info('🔗 Social login redirect', [
            'provider' => $provider,
            'user_id'  => $user->id,
        ]);

        return redirect()->away($redirectUrl);
    }

    /* ═══════════════════════════════════════════════════════
       LOGOUT
       ═══════════════════════════════════════════════════════ */

    public function logout(Request $request)
{
    // ── Avec MongoTokenAuth — supprimer le token manuellement ──
    $bearerToken = $request->bearerToken();

    if ($bearerToken) {
        if (str_contains($bearerToken, '|')) {
            [, $plainText] = explode('|', $bearerToken, 2);
        } else {
            $plainText = $bearerToken;
        }

        \App\Models\PersonalAccessToken::where('token', hash('sha256', $plainText))->delete();
    }

    return response()->json([
        'success' => true,
        'message' => 'Déconnexion réussie.',
    ]);
}
}