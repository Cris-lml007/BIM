<?php

namespace App\Providers;

use App\Enum\RoleProject;
use App\Enum\RoleSaas;
use App\Models\Project;
use App\Models\ProjectInvitation;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use JeroenNoten\LaravelAdminLte\Events\BuildingMenu;
use function PHPUnit\Framework\assertDirectoryDoesNotExist;

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
        if (app()->environment('production')) {
            URL::forceScheme('https');
        }


        Paginator::useBootstrap();

        Gate::define('isAdmin', function (User $user) {
            return $user->role == RoleSaas::ADMIN;
        });

        Gate::define('isPreviligied', function (User $user) {
            return $user->role == RoleSaas::PRIVILIGIED;
        });

        Gate::define('isAdministration', function (User $user) {
            return $user->role == RoleSaas::PRIVILIGIED || $user->role == RoleSaas::ADMIN;
        });

        Gate::define('isUser', function (User $user) {
            return $user->role == RoleSaas::USER;
        });

        Event::listen(BuildingMenu::class, function (BuildingMenu $event) {
            $projects = Project::where('user_id', Auth::user()->id)
                ->orWhereHas('members',function(Builder $builder){
                    $builder->where('user_id',Auth::user()->id);
                })->get();
            $menu = [];
            foreach ($projects as $project) {
                $menu[] = [
                    'text' => $project->name,
                    'url' => $project->id ? route('app.project', ['project' => $project->id]) : '#',
                    'icon' => 'fas fa-folder-open',
                    'submenu' => [
                        [
                            'text' => 'Principal',
                            'url' => $project->id ? route('app.project', ['project' => $project->id]) : '#',
                            'icon' => 'fas fa-home',
                        ],
                        [
                            'text' => 'Modelos 3D',
                            'url' => route('app.project.model3d',['project' => $project->id]),
                            'icon' => 'nf nf-fa-cube',
                        ],
                        [
                            'text' => 'Incidencias',
                            'url' => route('app.project.incidents', ['project' => $project->id]),
                            'icon' => 'nf nf-cod-issue_reopened',
                        ],
                        [
                            'text' => 'Anclajes Virtuales',
                            'url' => route('app.project.anchors', ['project' => $project->id]),
                            'icon' => 'nf nf-fa-anchor',
                        ],
                        [
                            'text' => 'Documentos',
                            'url' => route('app.project.documents', ['project' => $project->id]),
                            'icon' => 'nf nf-fa-folder',
                        ],
                        [
                            'text' => 'Miembros del proyecto',
                            'url' => route('app.project.members', ['project' => $project->id]),
                            'icon' => 'nf nf-fa-users',
                        ],
                    ],
                ];
            }
            $after = 'dashboard';

            if(auth()->user()->role != RoleSaas::ADMIN){         
//                if( $this->getRoleByProject() == RoleProject::OWNER->value){ //es propietario
                    $event->menu->addAfter('dashboard',[
                    'key' => 'new-project',
                    'text' => 'Nuevo Proyecto',
                    'icon' => 'fas fa-plus',
                    'route' => 'app.projects',
                    ]);
                    $after = 'new-project';
  //              }
                    
                $event->menu->addAfter($after,[
                        'text' => 'Proyectos',
                         'icon' => 'fas fa-city',
                // 'route' => 'app.projects',
                'submenu' => $menu
                ]);
            }
        });
    }

    public function getRoleByProject()
    {
        $user = auth()->user();

        $userInProject = Project::roleMember($user->id);
        if ($userInProject ==  null) { //es el dueño
            $idOwnerProject = Project::where('user_id', $user->id)->selectRaw('user_id')->first();
            if ($idOwnerProject) {
                return 1; // 'owner';
            }
            return 0; //'no_member';            
        }
        //es invitado
        return $userInProject->role; 
    }
}
