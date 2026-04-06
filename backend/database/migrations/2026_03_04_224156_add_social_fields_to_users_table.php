<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint; // ✅ Vérifiez que cet import est présent en haut
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->string('social_id')->nullable()->after('password');
        $table->string('social_provider')->nullable()->after('social_id');
        $table->string('avatar')->nullable()->after('social_provider');
    });
}

public function down(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn(['social_id', 'social_provider', 'avatar']);
    });
}
};
