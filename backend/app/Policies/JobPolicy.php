<?php

namespace App\Policies;

use App\Models\Job;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class JobPolicy
{
    /**
     * Admin bypass — exécuté avant toutes les autres méthodes.
     * Retourne true → admin peut tout faire.
     * Retourne null → continue la vérification normale.
     */
    public function before(User $user, string $ability): bool|null
    {
        if ($user->role === 'admin') {
            return true;
        }
        return null;
    }

    /**
     * Voir la liste des offres (RH voit toutes les offres publiées)
     */
    public function viewAny(User $user): bool
    {
        return $user->role === 'rh';
    }

    /**
     * Voir une offre spécifique
     */
    public function view(User $user, Job $job): bool
    {
        // RH voit toutes les offres
        // Candidat voit seulement les offres publiées
        return $user->role === 'rh'
            || $job->statut === 'publiee';
    }

    /**
     * Créer une offre — seulement les RH
     */
    public function create(User $user): bool
    {
        return $user->role === 'rh';
    }

    /**
     * Modifier une offre — seulement le RH créateur
     */
    public function update(User $user, Job $job): Response
    {
        if ($user->role !== 'rh') {
            return Response::deny('Seuls les RH peuvent modifier les offres.');
        }

        return $user->id === $job->created_by
            ? Response::allow()
            : Response::deny('Vous ne pouvez modifier que vos propres offres.');
    }

    /**
     * Supprimer une offre — seulement le RH créateur
     */
    public function delete(User $user, Job $job): Response
    {
        if ($user->role !== 'rh') {
            return Response::deny('Seuls les RH peuvent supprimer les offres.');
        }

        return $user->id === $job->created_by
            ? Response::allow()
            : Response::deny('Vous ne pouvez supprimer que vos propres offres.');
    }
}