<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('telephone')->nullable()->after('password');
            $table->string('linkedin_url')->nullable()->after('telephone');
            $table->string('departement')->nullable()->after('linkedin_url');
            $table->enum('role', ['candidat', 'rh', 'manager'])->default('candidat')->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['telephone', 'linkedin_url', 'departement']);
            $table->enum('role', ['candidat', 'rh', 'manager'])->default('candidat')->change();
        });
    }
};