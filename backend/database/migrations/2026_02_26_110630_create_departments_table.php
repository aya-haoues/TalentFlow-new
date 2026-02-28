<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Crée la table "departments" (Départements de l'entreprise)
     */
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();

            // 🏢 Nom du département (ex: "IT", "RH", "Marketing")
            $table->string('nom', 100);
            // → string(100) = VARCHAR(100) en SQL
            // → Assez court pour un nom, assez long pour "Ressources Humaines"

            // 📝 Description optionnelle
            $table->text('description')->nullable();
            // → text = jusqu'à 65 535 caractères
            // → nullable = un département peut exister sans description

            // 👤 Qui a créé ce département (optionnel, pour traçabilité)
            $table->foreignId('created_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            // → nullable : un département peut être créé par un script d'initialisation
            // → nullOnDelete : si on supprime l'utilisateur, created_by devient NULL (pas de suppression en cascade)

            // 📅 Timestamps automatiques
            $table->timestamps();
            // → created_at : date de création
            // → updated_at : date de dernière modification

            // 🔍 Index pour accélérer les recherches par nom
            $table->index('nom');
        });
    }

    /**
     * Reverse the migrations.
     * Supprime la table si on fait un rollback
     */
    public function down(): void
    {
        Schema::dropIfExists('departments');
    }
};