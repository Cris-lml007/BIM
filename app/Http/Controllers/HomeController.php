<?php

namespace App\Http\Controllers;

use App\Models\Access;
use App\Models\Project;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

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

            return view('app.dashboard', compact('access', 'user'));
        }
    }
    /*
    public function dataDashboardAdmin()
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
        $storage = Access::sum('max_storage');
        $storageGB = round($storage / 1024, 2);

        $usersThisMonth = User::whereMonth('created_at', Carbon::now()->month)
            ->whereYear('created_at', Carbon::now()->year)
            ->count();
        $projectsThisMonth = Project::whereMonth('created_at', Carbon::now()->month)
            ->whereYear('created_at', Carbon::now()->year)
            ->count();

        return $data = [
            'access'
        ];
    }

    */
    public function dashboardAdmin()
    {
        $today = Carbon::now();
        $limitDays = 7;

        // 🔐 Accesos
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

        // 👤 Usuarios
        $userTotal = User::count();

        // 📁 Proyectos
        $projects = Project::count();

        // 💾 Almacenamiento
        $storage = Access::sum('max_storage'); // MB
        $storageGB = round($storage / 1024, 2);

        // 📈 Crecimiento mensual
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
}
