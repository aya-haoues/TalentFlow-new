<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('jobs', function (Blueprint $table) {
        $table->id();

        $table->string('titre');
        // → Titre de l'offre
        // → string = VARCHAR(255) en SQL

        $table->foreignId('department_id')
              ->constrained('departments')
              ->onDelete('restrict');
        // → Clé étrangère vers la table departments
        // → restrict = impossible de supprimer un département
        //   qui a des offres liées

        $table->enum('type_contrat', ['CDI','CDD','Stage','Alternance','Freelance']);
        // → Seulement ces 5 valeurs acceptées en DB

        $table->enum('niveau_experience', ['junior','confirme','senior']);

        $table->enum('type_lieu', ['remote','hybrid','onsite']);

        $table->text('description');
        // → text = plus long que string (65 535 caractères)

        $table->json('competences_requises');
        // → Stocke un tableau : ["PHP", "React", "MySQL"]
        // → JSON en DB → array en PHP automatiquement

        $table->enum('statut', ['brouillon','publiee','pausee','archivee'])
              ->default('brouillon');
        // → default = valeur automatique à la création

        $table->integer('nombre_postes')->default(1);

        $table->date('date_limite')->nullable();
        // → nullable = peut être NULL en DB

        $table->integer('salaire_min')->nullable();
        $table->integer('salaire_max')->nullable();

        $table->foreignId('created_by')
              ->constrained('users')
              ->onDelete('restrict');
        // → Qui a créé cette offre (le RH)

        $table->timestamps();
        // → created_at + updated_at automatiques
    });
}

public function down(): void
{
    Schema::dropIfExists('jobs');
    // → Appelé par php artisan migrate:rollback
}
};
