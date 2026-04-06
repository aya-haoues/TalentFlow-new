// database/migrations/2026_03_18_230301_create_mongodb_indexes.php

<?php

use Illuminate\Database\Migrations\Migration;
use MongoDB\Laravel\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'mongodb';

    public function up(): void
    {
        // ── users ─────────────────────────────────────
        if (!Schema::connection('mongodb')->hasIndex('users', 'email_1')) {
            Schema::connection('mongodb')->table('users', function (Blueprint $col) {
                $col->unique('email');
            });
        }
        if (!Schema::connection('mongodb')->hasIndex('users', 'role_1')) {
            Schema::connection('mongodb')->table('users', function (Blueprint $col) {
                $col->index('role');
            });
        }

        // ── departments ───────────────────────────────
        if (!Schema::connection('mongodb')->hasIndex('departments', 'nom_1')) {
            Schema::connection('mongodb')->table('departments', function (Blueprint $col) {
                $col->unique('nom');
            });
        }

        // ── jobs ──────────────────────────────────────
        if (!Schema::connection('mongodb')->hasIndex('jobs', 'statut_1')) {
            Schema::connection('mongodb')->table('jobs', function (Blueprint $col) {
                $col->index('statut');
                $col->index('created_by');
                $col->index('department_id');
            });
        }

        // ── applications ──────────────────────────────
        if (!Schema::connection('mongodb')->hasIndex('applications', 'candidate_id_1')) {
            Schema::connection('mongodb')->table('applications', function (Blueprint $col) {
                $col->index('candidate_id');
                $col->index('job_id');
                $col->index('statut');
            });
        }

        // ── password_reset_tokens ─────────────────────
        if (!Schema::connection('mongodb')->hasIndex('password_reset_tokens', 'email_1')) {
            Schema::connection('mongodb')->table('password_reset_tokens', function (Blueprint $col) {
                $col->index('email');
            });
        }

        // ── personal_access_tokens ────────────────────
        if (!Schema::connection('mongodb')->hasIndex('personal_access_tokens', 'tokenable_id_1')) {
            Schema::connection('mongodb')->table('personal_access_tokens', function (Blueprint $col) {
                $col->index('tokenable_id');
                $col->index('token');
            });
        }
    }

    public function down(): void {}
};