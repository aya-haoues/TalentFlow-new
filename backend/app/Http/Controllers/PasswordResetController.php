<?php


// app/Http/Controllers/RhController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Password;

class PasswordResetController extends Controller
{
    /**
     * Étape 1 — Envoyer le lien de réinitialisation
     */
    public function sendResetLink(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        // Bloquer les comptes OAuth
        $user = User::where('email', $request->email)->first();
        if ($user && $user->social_provider) {
            return response()->json([
                'success' => false,
                'message' => "Ce compte utilise {$user->social_provider}. Connectez-vous via ce provider.",
            ], 422);
        }

        $status = Password::sendResetLink($request->only('email'));

        return $status === Password::RESET_LINK_SENT
            ? response()->json(['success' => true,  'message' => 'Lien envoyé à votre email.'])
            : response()->json(['success' => false, 'message' => 'Email introuvable.'], 422);
    }

    /**
     * Étape 2 — Réinitialiser le mot de passe
     */
    public function reset(Request $request): JsonResponse
    {
        $request->validate([
            'token'                 => 'required',
            'email'                 => 'required|email',
            'password'              => 'required|min:8|confirmed',
            'password_confirmation' => 'required',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password' => $password])->save();

                // Révoquer tous les tokens Sanctum existants
                $user->tokens()->delete();
            }
        );

        return $status === Password::PASSWORD_RESET
            ? response()->json(['success' => true,  'message' => 'Mot de passe réinitialisé.'])
            : response()->json(['success' => false, 'message' => 'Token invalide ou expiré.'], 422);
    }
}