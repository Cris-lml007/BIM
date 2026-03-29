<?php

use App\Http\Controllers\AdministrationController;
use App\Livewire\Admin\UsersForm;
use App\Livewire\App\Model3dView;
use App\Livewire\App\ProjectsView;
use App\Livewire\App\ProjectView;
use App\Models\Attachment;
use App\Models\Model3D;
use App\Models\Project;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return view('welcome');
});

Auth::routes();

Route::get('/home', [App\Http\Controllers\HomeController::class, 'index'])->name('home');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [App\Http\Controllers\ProfileController::class, 'show'])->name('profile.show');
    Route::get('/admin/access', [App\Http\Controllers\AccessController::class, 'show'])->name('access.show');

});

Route::get('/thumbnail/{id}',function($id){
    $attachment = Attachment::findOrFail($id);

    // dd($attachment->fileable->project_id);
    $path = "projects/{$attachment->fileable->project_id}/thumbnails/{$attachment->id}.png";

    if (!Storage::exists($path)) {
        abort(404);
    }

    return response()->file(storage_path("app/private/".$path));
})->name('thumbnail');


Route::get('/model3d/{id}',function($id){
    $attachment = Attachment::findOrFail($id);

    // dd($attachment->fileable->project_id);
    $path = "projects/{$attachment->fileable->project_id}/{$attachment->file}";

    if (!Storage::exists($path)) {
        abort(404);
    }

    return response()->file(storage_path("app/private/".$path));
})->name('model3d');




Route::prefix('/dashboard')->middleware('auth')->group(function () {

    Route::get('/', [App\Http\Controllers\HomeController::class, 'dashboard'])->name('dashboard');

    Route::controller(AdministrationController::class)->group(function () {
        Route::get('/users', 'users')->name('administration.users');
    });
    Route::get('/users/{id}', UsersForm::class)->name('administration.users.form');



    Route::get('/projects',ProjectsView::class)->name('app.projects');
    Route::prefix('/project/{project}')->group(function(){
        Route::get('/',ProjectView::class)->name('app.project');
        Route::get('/model3d',Model3dView::class)->name('app.project.model3d');
        Route::get('/model3d/{model}',function($project, $model){
            $p_name = Project::find($project)->name;
            $m_name = Model3D::find($model)->name;
            return view('app.viewer',compact('p_name','m_name','model'));
        })->name('app.project.model3d.id');
    });
});
