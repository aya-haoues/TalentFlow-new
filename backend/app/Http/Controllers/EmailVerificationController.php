<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use App\Models\User;


class EmailVerificationController extends Controller
{
    /**
     * Route 1 — Notice (email non vérifié)
     */
    public function notice(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Veuillez vérifier votre adresse email.',
            'action'  => 'check_your_inbox',
        ]);
    }

    /**
     * Route 2 — Clic sur le lien dans l'email
     */
    
public function verify(Request $request, $id, $hash)
{
    // 1. Trouver l'utilisateur par l'ID de l'URL
    $user = User::findOrFail($id);

    // 2. Vérifier si le hash correspond à l'email
    if (!hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
        return redirect()->away(config('app.frontend_url') . '/login?error=invalid_hash');
    }

    // 3. Marquer comme vérifié s'il ne l'est pas déjà
    if (!$user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
    }

    // 4. Rediriger vers React (Port 5173)
    return redirect()->away(config('app.frontend_url') . '/login?verified=true');
}

    /**
     * Route 3 — Renvoyer l'email de vérification
     */
public function resend(Request $request)
{
    // Vérifie si l'utilisateur a déjà validé son email
    if ($request->user()->hasVerifiedEmail()) {
        return response()->json(['message' => 'Email déjà vérifié.'], 400);
    }

    // Déclenche l'envoi vers Mailtrap
    $request->user()->sendEmailVerificationNotification();

    return response()->json([
        'success' => true,
        'message' => 'Lien de vérification envoyé !'
    ]);
}
    
}