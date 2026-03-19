<?php

namespace App\Policies;

use App\Models\Application;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ApplicationPolicy
{
    /**
     * Admin bypass
     */
    public function before(User $user, string $ability): bool|null
    {
        if ($user->role === 'admin') {
            return true;
        }
        return null;
    }

    /**
     * Candidat voit SES candidatures uniquement
     */
    public function view(User $user, Application $application): bool
    {
        return $user->id === $application->user_id;
    }

    /**
     * Créer une candidature — seulement les candidats
     */
    public function create(User $user): bool
    {
        return $user->role === 'candidat';
    }

    /**
     * RH voit les candidatures pour SES offres uniquement
     */
    public function viewAsRh(User $user, Application $application): Response
    {
        if ($user->role !== 'rh') {
            return Response::deny('Accès réservé aux RH.');
        }

        return $user->id === $application->job->created_by
            ? Response::allow()
            : Response::deny('Vous ne pouvez voir que les candidatures de vos propres offres.');
    }

    /**
     * RH change le statut d'une candidature — seulement pour SES offres
     */
    public function updateStatus(User $user, Application $application): Response
    {
        if ($user->role !== 'rh') {
            return Response::deny('Accès réservé aux RH.');
        }

        return $user->id === $application->job->created_by
            ? Response::allow()
            : Response::deny('Vous ne pouvez modifier que les candidatures de vos propres offres.');
    }
}