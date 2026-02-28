<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('jobs', function (Blueprint $table) {
            // ✅ Index pour accélérer les filtres
            $table->index('statut');
            $table->index('department_id');
            $table->index('created_at');
            $table->index(['statut', 'created_at']);  // Index composite
        });
    }

    public function down(): void
    {
        Schema::table('jobs', function (Blueprint $table) {
            $table->dropIndex(['statut']);
            $table->dropIndex(['department_id']);
            $table->dropIndex(['created_at']);
            $table->dropIndex(['statut', 'created_at']);
        });
    }
};