<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Job;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Resources\ApplicationResource;

use Illuminate\Support\Facades\Log;

class ManagerController extends Controller
{
    public function getPendingTechnical(Request $request)
    {
        try {
           
            $applications = Application::with(['job', 'candidate'])
                ->whereIn('statut', ['en_cours', 'entretien', 'entretien_technique'])
                ->orderBy('created_at', 'desc')
                ->get();

            Log::info('Candidatures trouvées : ' . $applications->count());

            return ApplicationResource::collection($applications);
            
        } catch (\Exception $e) {
            Log::error('Erreur ManagerController : ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    public function getMyTeam()
    {
        $manager = Auth::user();

        // On s'assure de filtrer par le département et d'exclure le manager lui-même
        $team = User::where('department_id', $manager->department_id)
            ->where('_id', '!=', (string)$manager->id)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $team
        ]);
    }

    
    public function getDashboardStats()
    {
        $manager = Auth::user();

        $jobIds = Job::where('department_id', $manager->department_id)
            ->pluck('_id')
            ->map(fn($id) => (string) $id)
            ->toArray();

        return response()->json([
            'success' => true,
            'data' => [
                'pending' => Application::whereIn('job_id', $jobIds)
                    ->whereIn('statut', ['en_cours', 'entretien'])
                    ->count(),
                'total' => Application::whereIn('job_id', $jobIds)->count(),
                'team_count' => User::where('department_id', $manager->department_id)->count(),
            ]
        ]);
    }
}
