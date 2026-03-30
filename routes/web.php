<?php

use App\Http\Controllers\AdministrationController;
use App\Http\Controllers\AttachmentController;
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


    Route::can('isAdministration')->group(function(){
        Route::controller(AdministrationController::class)->group(function () {
            Route::get('/users', 'users')->name('administration.users');
        });
        Route::get('/users/{id}', UsersForm::class)->name('administration.users.form');
    });


    Route::controller(AttachmentController::class)->group(function(){
        Route::get('thumbnail/{id}','getThumbnail')->name('app.thumbnail');
        Route::get('Attachment/{id}','getAttachment')->name('app.Attachment');
    });


    Route::can('isUser')->get('/projects',ProjectsView::class)->name('app.projects');
    Route::prefix('/project/{project}')->group(function(){
        Route::get('/',ProjectView::class)->name('app.project');
        Route::get('/model3d',Model3dView::class)->name('app.project.model3d');
        Route::livewire('/model3d/{model}','3d.viewer')->name('app.project.model3d.id');
    });
});
