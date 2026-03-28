<?php

namespace App\Providers;

use App\Enum\RoleSaas;
use App\Models\Project;
use App\Models\User;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use JeroenNoten\LaravelAdminLte\Events\BuildingMenu;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Paginator::useBootstrap();

        Gate::define('isAdmin',function(User $user){
            return $user->role == RoleSaas::ADMIN;
        });

        Gate::define('isPreviligied',function(User $user){
            return $user->role == RoleSaas::PRIVILIGIED;
        });

        Gate::define('isAdministration',function(User $user){
            return $user->role == RoleSaas::PRIVILIGIED || $user->role == RoleSaas::ADMIN;
        });

        Gate::define('isUser',function(User $user){
            return $user->role == RoleSaas::USER;
        });



        Event::listen(BuildingMenu::class, function (BuildingMenu $event) {
            $projects = Project::where('user_id',Auth::user()->id)->get();
            $menu = [];
            foreach ($projects as $project) {
                $menu [] =[
                    'text' => $project->name,
                    'url' => $project->id ? route('app.project',['project' => $project->id]) : '#',
                    'submenu' => [
                        [
                            'text' => 'Principal',
                            'url' => $project->id ? route('app.project',['project' => $project->id]) : '#',
                            'icon' => 'fas fa-home',
                        ],
                        [
                            'text' => 'Modelos 3D',
                            'url' => route('app.project.view',['project' => $project->id]),
                            'icon' => 'nf nf-fa-cube',
                        ],
                        [
                            'text' => 'Planos 2D',
                            'url' => 'menu/child2',
                            'icon' => 'nf nf-md-floor_plan',
                        ],
                        [
                            'text' => 'Incidencias',
                            'url' => 'menu/child2',
                            'icon' => 'nf nf-cod-issue_reopened',
                        ],[
                            'text' => 'Anclajes Virtuales',
                            'url' => 'menu/child2',
                            'icon' => 'nf nf-fa-anchor',
                        ],
                        [
                            'text' => 'Documentos',
                            'url' => 'menu/child2',
                            'icon' => 'nf nf-fa-folder',
                        ],
                        [
                            'text' => 'Compartido',
                            'url' => 'menu/child2',
                            'icon' => 'nf nf-fa-share',
                        ],
                    ],
                ];
            }

            $event->menu->addAfter('dashboard',[
                'text' => 'Proyectos',
                'icon' => 'fas fa-city',
                'route' => 'app.projects',
                'submenu' => $menu
            ]);
        });


    }
}
