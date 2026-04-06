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
            return view('app.dashboard', compact(['access', 'userTotal', 'projects', 'storageGB', 'usersThisMonth', 'projectsThisMonth']));

        } else {

            $access = $user->access;
            return view('app.dashboard', compact('access', 'user'));
        }
    }

    public function dashboard()
    {
        $user = auth()->user();
        $access = $user->access;
        return view('app.dashboard', compact('access', 'user'));
    }
}
