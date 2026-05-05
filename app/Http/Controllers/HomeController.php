<?php

namespace App\Http\Controllers;

use App\Models\Access;
use App\Models\Project;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class HomeController extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Show the application dashboard.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        $user = auth()->user();
        if ($user->can('isAdministration')) {
            $data = $this->dashboardAdmin();

            return view('app.dashboard', $data);
        } else {

            $access = $user->access;
            $data = $this->dashboardUser($user, $access);

            return view('app.dashboard', $data);
        }
    }
    public function dashboardAdmin()
    {
        $today = Carbon::now();
        $limitDays = 7;

        $access = [
            'total' => Access::count(),
            'active' => Access::where('is_active', 1)
                ->whereDate('available_end', '>=', $today)
                ->count(),
            'expiring' => Access::where('is_active', 1)
                ->whereBetween('available_end', [$today, $today->copy()->addDays($limitDays)])
                ->count(),
            'expired' => Access::whereDate('available_end', '<', $today)
                ->count(),
        ];

        $userTotal = User::count();

        $projects = Project::count();

        $storage = Access::sum('max_storage'); // MB
        $storageGB = round($storage / 1024, 2);

        $usersThisMonth = User::whereBetween('created_at', [
            $today->copy()->startOfMonth(),
            $today->copy()->endOfMonth()
        ])->count();

        $projectsThisMonth = Project::whereBetween('created_at', [
            $today->copy()->startOfMonth(),
            $today->copy()->endOfMonth()
        ])->count();

        $alerts = [];

        if ($access['expiring'] > 0) {
            $alerts[] = [
                'type' => 'warning',
                'message' => "{$access['expiring']} licencias vencen en {$limitDays} días",
                'icon' => 'fas fa-clock',
                'color' => 'text-warning'
            ];
        }

        if ($access['expired'] > 0) {
            $alerts[] = [
                'type' => 'danger',
                'message' => "{$access['expired']} licencias vencidas",
                'icon' => 'fas fa-times-circle',
                'color' => 'text-danger'
            ];
        }

        if ($usersThisMonth > 0) {
            $alerts[] = [
                'type' => 'info',
                'message' => "{$usersThisMonth} usuarios nuevos este mes",
                'icon' => 'fas fa-user-plus',
                'color' => 'text-info'
            ];
        }

        // 📜 Actividad reciente (simple)
        $recentUsers = User::latest()->take(3)->get();
        $recentProjects = Project::latest()->take(3)->get();

        $activities = collect();

        foreach ($recentUsers as $user) {
            $activities->push([
                'message' => "{$user->name} se registró",
                'date' => $user->created_at,
                'icon' => 'fas fa-user',
                'color' => 'text-success'
            ]);
        }

        foreach ($recentProjects as $project) {
            $activities->push([
                'message' => "Proyecto \"{$project->name}\" creado",
                'date' => $project->created_at,
                'icon' => 'fas fa-folder-open',
                'color' => 'text-primary'
            ]);
        }

        $activities = $activities->sortByDesc('date')->take(5);

        // 📦 DATA FINAL
        $data = [
            'access' => $access,
            'userTotal' => $userTotal,
            'projects' => $projects,
            'storageGB' => $storageGB,
            'usersThisMonth' => $usersThisMonth,
            'projectsThisMonth' => $projectsThisMonth,
            'alerts' => $alerts,
            'activities' => $activities,
        ];

        return $data;
    }

    public function dashboardUser($user, $access)
    {
        $today = Carbon::now();
        $alerts = [];
        $activities = collect();

        //dd($access->is_active);
        // Generar alertas para el usuario
        if (!$access) {
            $alerts[] = [
                'type' => 'danger',
                'message' => 'No tienes una licencia asignada',
                'icon' => 'fas fa-exclamation-circle',
                'color' => 'text-danger'
            ];
        } elseif (!$access->is_active) {
            $alerts[] = [
                'type' => 'danger',
                'message' => 'Tu acceso ha sido suspendido por el administrador',
                'icon' => 'fas fa-ban',
                'color' => 'text-danger'
            ];
        } elseif ($access->available_end < $today) {
            $alerts[] = [
                'type' => 'danger',
                'message' => 'Tu licencia ha vencido',
                'icon' => 'fas fa-times-circle',
                'color' => 'text-danger'
            ];
        } else {
            $daysLeft = $today->diffInDays($access->available_end);
            
            if ($daysLeft <= 7) {
                $alerts[] = [
                    'type' => 'warning',
                    'message' => "Tu licencia vence en {$daysLeft} días",
                    'icon' => 'fas fa-clock',
                    'color' => 'text-warning'
                ];
            }
        }

        // Verificar límites si existe acceso
        if ($access) {
            $projectsCount = $user->projectsOwner()->count();
            $usersCount = $user->getAccessUsersCount();
            $storageUsedMB = $user->getStorageUsedMB();

            if ($projectsCount >= $access->max_projects) {
                $alerts[] = [
                    'type' => 'danger',
                    'message' => 'Has alcanzado el límite de proyectos',
                    'icon' => 'fas fa-folder',
                    'color' => 'text-danger'
                ];
            }

            if ($usersCount >= $access->max_users) {
                $alerts[] = [
                    'type' => 'warning',
                    'message' => 'Has alcanzado el límite de miembros',
                    'icon' => 'fas fa-users',
                    'color' => 'text-primary'
                ];
            }

            if ($storageUsedMB >= $access->max_storage) {
                $alerts[] = [
                    'type' => 'danger',
                    'message' => 'Has alcanzado el límite de almacenamiento',
                    'icon' => 'fas fa-hdd',
                    'color' => 'text-danger'
                ];
            }
        }

        // Si no hay alertas, agregar mensaje positivo
        if (empty($alerts)) {
            $alerts[] = [
                'type' => 'success',
                'message' => 'Todo en orden',
                'icon' => 'fas fa-check-circle',
                'color' => 'text-success'
            ];
        }

        // Generar actividad reciente del usuario
        $userProjects = $user->projectsOwner()->latest()->take(5)->get();
        foreach ($userProjects as $project) {
            $activities->push([
                'message' => "Proyecto \"{$project->name}\" creado",
                'date' => $project->created_at,
                'icon' => 'fas fa-folder-open',
                'color' => 'text-primary'
            ]);
        }

        // Ordenar actividades por fecha descendente
        $activities = $activities->sortByDesc('date')->take(5);

        // Datos de uso si existe acceso
        $projectsUsed = $user->projectsOwner()->count();
        $usersUsed = $user->getAccessUsersCount();
        $storageUsedMB = $user->getStorageUsedMB();
        
        $maxProjects = $access ? $access->max_projects : 0;
        $maxUsers = $access ? $access->max_users : 0;
        $maxStorageMB = $access ? $access->max_storage : 0;
        $storageUsedGB = round($storageUsedMB / 1024, 2);
        $maxStorageGB = round($maxStorageMB / 1024, 2);
        $storagePercent = $maxStorageMB > 0 ? ($storageUsedMB / $maxStorageMB) * 100 : 0;
        $blockedProjects = $access ? $user->projectBlockedCount() : 0;

        $data = [
            'access' => $access,
            'user' => $user,
            'alerts' => $alerts,
            'activities' => $activities,
            'projectsUsed' => $projectsUsed,
            'usersUsed' => $usersUsed,
            'storageUsedGB' => $storageUsedGB,
            'maxStorageGB' => $maxStorageGB,
            'storagePercent' => $storagePercent,
            'maxProjects' => $maxProjects,
            'maxUsers' => $maxUsers,
            'blockedProjects' => $blockedProjects,
        ];

        return $data;
    }
}
