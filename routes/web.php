<?php

use App\Http\Controllers\AdministrationController;
use App\Livewire\Admin\UsersForm;
use App\Livewire\App\ProjectsView;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Auth::routes();

Route::get('/home', [App\Http\Controllers\HomeController::class, 'index'])->name('home');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [App\Http\Controllers\ProfileController::class, 'show'])->name('profile.show');
    Route::get('/admin/access', [App\Http\Controllers\AccessController::class, 'show'])->name('access.show');

});


Route::prefix('/dashboard')->middleware('auth')->group(function () {

    Route::get('/', [App\Http\Controllers\HomeController::class, 'dashboard'])->name('dashboard');

    Route::controller(AdministrationController::class)->group(function () {
        Route::get('/users', 'users')->name('administration.users');
    });

    Route::get('/projects',ProjectsView::class)->name('dashboard.projects');

    Route::get('/users/{id}', UsersForm::class)->name('administration.users.form');
});
