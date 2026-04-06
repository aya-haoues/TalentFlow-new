<?php

namespace App\Console\Commands;

use App\Models\Application;
use App\Models\Department;   // ← sans h — nom exact du fichier
use App\Models\Job;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportMysqlToMongodb extends Command
{
    protected $signature   = 'import:mysql-to-mongodb';
    protected $description = 'Migrer les données MySQL vers MongoDB Atlas';

    public function handle(): void
    {
        $this->info('🚀 Début de la migration MySQL → MongoDB Atlas');

        // ── 1. Departments ────────────────────────────
        $this->info('📦 Migration departments...');
        $departments = DB::connection('mysql')->table('departments')->get();
        $deptMap = [];

        foreach ($departments as $dept) {
            $newDept = Department::updateOrCreate(
                ['nom' => $dept->nom],
                ['description' => $dept->description]
            );
            $deptMap[$dept->id] = $newDept->id;
        }
        $this->info("✅ {$departments->count()} départements migrés");

        // ── 2. Users ──────────────────────────────────
        $this->info('👥 Migration users...');
        $users   = DB::connection('mysql')->table('users')->get();
        $userMap = [];

        foreach ($users as $u) {
            $existing = User::where('email', $u->email)->first();
            if ($existing) {
                $userMap[$u->id] = $existing->id;
                $this->warn("⚠️ User existant : {$u->email} → ignoré");
                continue;
            }

            $newUser = new User();
            $newUser->name              = $u->name;
            $newUser->email             = $u->email;
            $newUser->role              = $u->role ?? 'candidat';
            $newUser->telephone         = $u->telephone;
            $newUser->departement       = $u->departement;
            $newUser->position          = $u->position ?? null;
            $newUser->linkedin_url      = $u->linkedin_url ?? null;
            $newUser->avatar            = $u->avatar ?? null;
            $newUser->cv_path           = $u->cv_path ?? null;
            $newUser->social_provider   = $u->social_provider ?? null;
            $newUser->social_id         = $u->social_id ?? null;
            $newUser->is_approved       = (bool) ($u->is_approved ?? false);
            $newUser->is_blocked        = (bool) ($u->is_blocked ?? false);
            $newUser->email_verified_at = $u->email_verified_at;

            $newUser->setRawAttributes(
                array_merge($newUser->getAttributes(), ['password' => $u->password]),
                true
            );
            $newUser->save();
            $userMap[$u->id] = $newUser->id;
        }
        $this->info("✅ {$users->count()} utilisateurs traités");

        // ── 3. Jobs ───────────────────────────────────
        $this->info('💼 Migration jobs...');
        $jobs   = DB::connection('mysql')->table('jobs')->get();
        $jobMap = [];

        foreach ($jobs as $j) {
            $existing = Job::where('titre', $j->titre)->first();
            if ($existing) {
                $jobMap[$j->id] = $existing->id;
                $this->warn("⚠️ Job existant : {$j->titre} → ignoré");
                continue;
            }

            $competences = is_string($j->competences_requises)
                ? json_decode($j->competences_requises, true)
                : ($j->competences_requises ?? []);

            $newJob = Job::create([
                'titre'                => $j->titre,
                'department_id'        => $deptMap[$j->department_id] ?? null,
                'type_contrat'         => $j->type_contrat,
                'niveau_experience'    => $j->niveau_experience,
                'type_lieu'            => $j->type_lieu,
                'description'          => $j->description,
                'competences_requises' => $competences,
                'statut'               => $j->statut,
                'nombre_postes'        => $j->nombre_postes,
                'salaire_min'          => $j->salaire_min,
                'salaire_max'          => $j->salaire_max,
                'date_limite'          => $j->date_limite,
                'created_by'           => $userMap[$j->created_by] ?? null,
            ]);
            $jobMap[$j->id] = $newJob->id;
        }
        $this->info("✅ {$jobs->count()} offres migrées");

        // ── 4. Applications ───────────────────────────
        $this->info('📋 Migration applications...');
        $applications = DB::connection('mysql')->table('applications')->get();

        // Remplacer dans ImportMysqlToMongodb.php ligne 114-116 :

foreach ($applications as $a) {

    // ← Adapter selon les vrais noms de colonnes
    $candidateId = $userMap[$a->candidate_id ?? $a->user_id ?? null] ?? null;
    $jobId       = $jobMap[$a->job_id ?? $a->offre_id ?? null] ?? null;

    $existing = Application::where('candidate_id', $candidateId)
        ->where('job_id', $jobId)
        ->first();

    if ($existing) {
        $this->warn("⚠️ Application existante → ignorée");
        continue;
    }

    Application::create([
        'job_id'                  => $jobId,
        'candidate_id'            => $candidateId,
        'statut'                  => $a->statut,
        'cv_path'                 => $a->cv_path ?? null,
        'cv_original_name'        => $a->cv_original_name ?? null,
        'why_us'                  => $a->why_us ?? null,
        'telephone'               => $a->telephone ?? null,
        'linkedin_url'            => $a->linkedin_url ?? null,
        'contract_type_preferred' => $a->contract_type_preferred ?? null,
        'ai_score'                => $a->ai_score ?? null,
    ]);
}
        $this->info("✅ {$applications->count()} candidatures migrées");

        $this->info('');
        $this->info('🎉 Migration terminée avec succès !');
    }
}