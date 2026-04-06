<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Ajoute les champs pour le formulaire de candidature enrichi
     */
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            
            // ✨ Motivation (remplace/complète lettre_motivation)
            // why_us du frontend → motivation en backend
            $table->text('motivation')->nullable()->after('cv_path');
            
            // 📋 Type de contrat préféré
            $table->string('contract_type_preferred', 20)->nullable()->after('motivation');
            
            // ♿ Informations handicap / aménagements
            $table->text('handicap_info')->nullable()->after('contract_type_preferred');
            
            // 💼 Expériences professionnelles (stockées en JSON)
            $table->json('experiences')->nullable()->after('handicap_info');
            
            // 🎓 Formations (stockées en JSON)
            $table->json('formations')->nullable()->after('experiences');
            
            // 🛠️ Compétences (stockées en JSON)
            $table->json('skills')->nullable()->after('formations');
            
            // 🎯 Défis professionnels (stockées en JSON)
            $table->json('challenges')->nullable()->after('skills');
            
            // 🔄 Index pour accélérer les requêtes sur les nouveaux champs
            $table->index('contract_type_preferred');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropIndex(['contract_type_preferred']);
            $table->dropColumn([
                'motivation',
                'contract_type_preferred',
                'handicap_info',
                'experiences',
                'formations',
                'skills',
                'challenges',
            ]);
        });
    }
};