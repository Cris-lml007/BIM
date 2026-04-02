<?php

use App\Http\Controllers\AdministrationController;
use App\Http\Controllers\DocumentsController;
use App\Http\Controllers\MembersController;
use App\Http\Controllers\InvitationController;

use App\Livewire\Admin\UsersForm;
use App\Livewire\App\Model3dView;
use App\Livewire\App\ProjectsView;
use App\Livewire\App\ProjectView;
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
    Route::get('/users/{id}', UsersForm::class)->name('administration.users.form');



    Route::get('/projects', ProjectsView::class)->name('app.projects');
    Route::prefix('/project/{project}')->group(function () {
        Route::get('/', ProjectView::class)->name('app.project');
        Route::get('/model3d', Model3dView::class)->name('app.project.view');
        Route::get('/members', [MembersController::class, 'show'])->name('app.project.members');
        Route::get('/documents', [DocumentsController::class, 'show'])->name('app.project.documents');

    });

    Route::get('/documents/{document}/view', [DocumentsController::class, 'view'])
        ->name('documents.view');
});

Route::get('/invitation/{token}', [InvitationController::class, 'accept'])
    ->name('invitations.accept');


//pages messages
Route::get('/expired', function () {
    return view('errors.custom.expired');
})->name('invitations.expired');
