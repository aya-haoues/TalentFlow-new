<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            // 🔗 Champs pour l'authentification sociale générique
            $table->string('social_provider')->nullable()->index();  // 'google', 'linkedin'
            $table->string('social_id')->nullable();                  // ID chez le provider
            
            // ✅ Contrainte unique COMPOSITE : un user ne peut avoir qu'un compte par provider
            $table->unique(['social_provider', 'social_id'], 'users_social_unique');
            
            // 👤 Avatar et infos supplémentaires
            $table->string('avatar')->nullable();
            $table->timestamp('email_verified_at')->nullable();  // Si le provider a vérifié l'email
        });
    }

    public function down(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_social_unique');
            $table->dropColumn(['social_provider', 'social_id', 'avatar', 'email_verified_at']);
        });
    }
};