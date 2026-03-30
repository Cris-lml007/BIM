<?php

namespace App\Http\Controllers;

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
        return view('app.dashboard');
    }

    public function dashboard(){
        $user = Auth::user();
        $number_projects = $user->projects()->where('is_active',1)->count();
        $projects_active = $user->projects()->where('is_active',1)->count();
        $projects_blocked = $user->projects()->where('is_active',0)->count();
        return view('app.dashboard',compact(['number_projects','projects_active','projects_blocked']));
    }
}
