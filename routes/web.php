<?php

use App\Http\Controllers\AdministrationController;
use App\Http\Controllers\AttachmentController;
use App\Http\Controllers\DocumentsController;
use App\Http\Controllers\IncidentController;
use App\Http\Controllers\MembersController;
use App\Http\Controllers\InvitationController;
use App\Livewire\Admin\UsersForm;
use App\Livewire\App\AnchorsView;
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
});

Route::prefix('/dashboard')->middleware('auth')->group(function () {



    Route::get('/', [App\Http\Controllers\HomeController::class, 'index'])->name('dashboard');

    Route::can('isAdministration')->group(function(){
        Route::controller(AdministrationController::class)->group(function () {
            Route::get('/users', 'users')->name('administration.users');
        });
        Route::get('/users/{id}', UsersForm::class)->name('administration.users.form');
        Route::get('/access', [App\Http\Controllers\AccessController::class, 'show'])->name('administration.access');
    });


    Route::controller(AttachmentController::class)->group(function(){
        Route::get('thumbnail/{id}','getThumbnail')->name('app.thumbnail');
        Route::get('attachment/{id}','getAttachment')->name('app.Attachment');
    });

    Route::can('isUser')->get('/projects',ProjectsView::class)->name('app.projects');
    Route::can('isUser')->can('view','project')->prefix('/project/{project}')->group(function(){
        Route::get('/',ProjectView::class)->name('app.project');
        Route::get('/model3d',Model3dView::class)->name('app.project.model3d');
        Route::livewire('/model3d/{model}','3d.viewer')->name('app.project.model3d.id');
        Route::get('/members', [MembersController::class, 'show'])->name('app.project.members');
        Route::get('/documents', [DocumentsController::class, 'show'])->name('app.project.documents');

        Route::get('/incidents', [IncidentController::class, 'show'])->name('app.project.incidents');
        Route::get('/anchors',AnchorsView::class)->name('app.project.anchors');
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
