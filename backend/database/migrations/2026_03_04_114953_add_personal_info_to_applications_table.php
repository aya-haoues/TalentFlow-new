<?php
// database/migrations/xxxx_xx_xx_add_personal_info_to_applications_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            // 👤 Informations personnelles
            $table->string('nom')->nullable()->after('cv_path');
            $table->string('prenom')->nullable()->after('nom');
            $table->string('email')->nullable()->after('prenom');
            $table->string('telephone')->nullable()->after('email');
            $table->date('date_naissance')->nullable()->after('telephone');
            $table->string('genre', 20)->nullable()->after('date_naissance');
            $table->string('nationalite')->nullable()->after('genre');
            
            // 📍 Adresse (stockée en JSON)
            $table->json('adresse')->nullable()->after('nationalite');
            
            // 🔗 Liens professionnels
            $table->string('linkedin_url')->nullable()->after('adresse');
            $table->string('github_url')->nullable()->after('linkedin_url');
            $table->string('site_web')->nullable()->after('github_url');
            
            // Index pour recherches fréquentes
            $table->index(['email', 'telephone']);
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropIndex(['email', 'telephone']);
            $table->dropColumn([
                'nom', 'prenom', 'email', 'telephone', 'date_naissance',
                'genre', 'nationalite', 'adresse',
                'linkedin_url', 'github_url', 'site_web'
            ]);
        });
    }
};