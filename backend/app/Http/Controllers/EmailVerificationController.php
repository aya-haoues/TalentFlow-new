// app/Http/Controllers/EmailVerificationController.php
<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

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
    public function verify(EmailVerificationRequest $request): RedirectResponse
    {
        $request->fulfill();
        // ↑ marque email_verified_at = now()

        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        return redirect()->away("{$frontendUrl}/email-verified?status=success");
    }

    /**
     * Route 3 — Renvoyer l'email de vérification
     */
    public function resend(Request $request): JsonResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json([
                'success' => false,
                'message' => 'Votre email est déjà vérifié.',
            ], 400);
        }

        $request->user()->sendEmailVerificationNotification();

        return response()->json([
            'success' => true,
            'message' => 'Email de vérification renvoyé.',
        ]);
    }
}