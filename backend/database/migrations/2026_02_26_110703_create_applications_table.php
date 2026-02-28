<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Crée la table "applications" (Candidatures aux offres)
     */
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->id();

            // 🔗 Lien vers l'offre concernée
            $table->foreignId('job_id')
                  ->constrained('jobs')
                  ->onDelete('cascade');
            // → cascade : si on supprime l'offre, ses candidatures sont aussi supprimées
            // → logique : pas de candidature sans offre

            // 🔗 Lien vers le candidat (utilisateur avec rôle "candidate")
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('cascade');
            // → cascade : si on supprime le compte candidat, ses candidatures partent aussi

            // 🎯 Statut de la candidature
            $table->enum('statut', [
                'en_attente',    // 🟡 Soumise, en cours de revue
                'acceptee',      // 🟢 Sélectionnée, entretien ou embauche
                'refusee',       // 🔴 Refusée après revue
                'retiree'        // ⚪ Candidat a retiré sa candidature
            ])->default('en_attente');
            // → default : à la création, statut = "en_attente" automatiquement

            // 📄 Chemin vers le CV uploadé (stocké dans storage/)
            $table->string('cv_path')->nullable();
            // → nullable : le candidat peut postuler sans CV (si l'offre le permet)
            // → on stocke le chemin relatif, pas le fichier lui-même

            // ✉️ Lettre de motivation (texte ou chemin vers fichier)
            $table->text('lettre_motivation')->nullable();
            // → text : assez long pour une lettre complète

            // 📅 Date de soumission de la candidature
            $table->timestamp('date_candidature')->useCurrent();
            // → useCurrent() : date/heure automatique à la création
            // → timestamp : plus précis que date (inclut l'heure)

            // 💬 Notes internes du RH (non visibles par le candidat)
            $table->text('notes_internes')->nullable();
            // → nullable : seulement rempli si le RH ajoute des commentaires

            // 📅 Date de dernière mise à jour du statut (par le RH)
            $table->timestamp('date_derniere_modification')->nullable();
            // → Utile pour trier : "candidatures mises à jour récemment"

            // 📅 Timestamps standards
            $table->timestamps();

            // 🔍 Index composites pour accélérer les requêtes fréquentes
            $table->index(['job_id', 'statut']); 
            // → Ex: "Toutes les candidatures 'en_attente' pour l'offre #42"
            
            $table->index(['user_id', 'created_at']);
            // → Ex: "Historique des candidatures du candidat #15, triées par date"
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};