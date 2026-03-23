<?php

namespace App\Providers;

use App\Enum\RoleSaas;
use App\Models\User;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

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
    }
}
