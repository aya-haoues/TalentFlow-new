<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Ajoute 'admin' aux valeurs autorisées de la colonne role
     */
    public function up(): void
    {
        // ⚠️ MySQL ne permet pas de modifier un ENUM directement avec Schema::change()
        // On utilise une requête SQL brute
        
        DB::statement("
            ALTER TABLE `users` 
            MODIFY `role` ENUM('candidat', 'rh', 'manager', 'admin') 
            NOT NULL DEFAULT 'candidat'
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Optionnel : retirer 'admin' (attention aux users admin existants !)
        DB::statement("
            ALTER TABLE `users` 
            MODIFY `role` ENUM('candidat', 'rh', 'manager') 
            NOT NULL DEFAULT 'candidat'
        ");
    }
};