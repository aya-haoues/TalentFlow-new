<?php

namespace App\Console\Commands;

use App\Models\Application;
use App\Models\Departement;
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
            $newDept = Departement::updateOrCreate(
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
                $this->warn("⚠️ User déjà existant : {$u->email} → ignoré");
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
            // ← Vérifier si déjà existant
            $existing = Job::where('titre', $j->titre)
                ->where('created_by', $userMap[$j->created_by] ?? null)
                ->first();

            if ($existing) {
                $jobMap[$j->id] = $existing->id;
                $this->warn("⚠️ Job déjà existant : {$j->titre} → ignoré");
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

        // ── 4. Applications ───────────────────────────────────
$this->info('📋 Migration applications...');
$applications = DB::connection('mysql')->table('applications')->get();

foreach ($applications as $a) {

    // Décoder les champs JSON
    $experiences  = $a->experiences  ? json_decode($a->experiences, true)  : null;
    $formations   = $a->formations   ? json_decode($a->formations, true)   : null;
    $skills       = $a->skills       ? json_decode($a->skills, true)       : null;
    $challenges   = $a->challenges   ? json_decode($a->challenges, true)   : null;
    $adresse      = $a->adresse      ? json_decode($a->adresse, true)      : null;

    Application::create([
        // Relations
        'job_id'                  => $jobMap[$a->job_id] ?? null,
        'candidate_id'            => $userMap[$a->user_id] ?? null,
        // ↑ user_id dans MySQL → candidate_id dans MongoDB

        // Statut
        'statut'                  => $a->statut,
        'date_candidature'        => $a->date_candidature,
        'date_derniere_modification' => $a->date_derniere_modification,

        // CV
        'cv_path'                 => $a->cv_path ?? null,
        'lettre_motivation'       => $a->lettre_motivation ?? null,

        // Infos personnelles
        'nom'                     => $a->nom ?? null,
        'prenom'                  => $a->prenom ?? null,
        'email'                   => $a->email ?? null,
        'telephone'               => $a->telephone ?? null,
        'date_naissance'          => $a->date_naissance ?? null,
        'genre'                   => $a->genre ?? null,
        'nationalite'             => $a->nationalite ?? null,
        'adresse'                 => $adresse,           // ← JSON → array
        'linkedin_url'            => $a->linkedin_url ?? null,
        'github_url'              => $a->github_url ?? null,
        'site_web'                => $a->site_web ?? null,

        // Candidature
        'motivation'              => $a->motivation ?? null,
        'contract_type_preferred' => $a->contract_type_preferred ?? null,
        'handicap_info'           => $a->handicap_info ?? null,
        'notes_internes'          => $a->notes_internes ?? null,

        // Arrays JSON → arrays MongoDB natifs ✅
        'experiences'             => $experiences,
        'formations'              => $formations,
        'skills'                  => $skills,
        'challenges'              => $challenges,
    ]);
}
$this->info("✅ {$applications->count()} candidatures migrées");

        $this->info('');
        $this->info('🎉 Migration terminée avec succès !');
    }
}