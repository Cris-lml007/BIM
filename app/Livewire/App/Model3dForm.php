<?php

namespace App\Livewire\App;

use App\Models\Attachment;
use App\Models\Model3D;
use App\Models\Project;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Livewire\Component;
use Livewire\WithFileUploads;
use Illuminate\Validation\ValidationException;

class Model3dForm extends Component
{
    use WithFileUploads;

    public $name;
    public $description;
    public $file;
    public $thumbnail;
    public $frag;

    public Project $project;

    public function mount(Project $project)
    {
        $this->project = $project;
    }

    public function save()
    {
        $this->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'file' => 'required|file|extensions:ifc',
            'thumbnail' => 'required|image|mimes:png',
            'frag' => 'required|file|extensions:frag',
        ]);

        $user = Auth::user();

        if ($this->project->models()->count() >= $user->access->max_models) {
            return $this->js(
                'Swal.fire({
                    icon: "warning",
                    title: "Número máximo de modelos superado"
                })'
            );
        }

        $projectId = $this->project->id;

        Storage::makeDirectory("projects/{$projectId}");
        Storage::makeDirectory("projects/{$projectId}/thumbnails");

        $type = strtolower($this->file->getClientOriginalExtension());

        do {
            $hash = Str::random(64);
        } while (Attachment::where('file', "{$hash}.{$type}")->exists());

        $ifcName = "{$hash}.{$type}";
        $fragName = "{$hash}.frag";

        // Guardar los archivos.
        $ifcPath = $this->file->storeAs(
            "projects/{$projectId}",
            $ifcName
        );

        $fragPath = $this->frag->storeAs(
            "projects/{$projectId}",
            $fragName
        );

        if (!$ifcPath || !$fragPath) {
            throw ValidationException::withMessages([
                'file' => 'No se pudieron guardar los archivos del modelo. Intenta nuevamente.',
            ]);
        }

        // Crear el modelo.
        $model = Model3D::create([
            'name' => $this->name,
            'description' => $this->description,
            'project_id' => $projectId,
            'user_id' => $user->id,
        ]);

        $attachment = Attachment::create([
            'name' => $model->name,
            'file' => $ifcName,
            'type' => $type,
            'path' => "projects/{$projectId}",
            'fileable_id' => $model->id,
            'fileable_type' => Model3D::class,
        ]);

        $thumbnailPath = $this->thumbnail->storeAs(
            "projects/{$projectId}/thumbnails",
            $attachment->id . '.png'
        );

        if (!$thumbnailPath) {
            throw ValidationException::withMessages([
                'thumbnail' => 'No se pudo guardar la imagen de vista previa.',
            ]);
        }

        return $this->redirect(
            route('app.project.model3d', $projectId)
        );
    }

    public function render()
    {
        return view('livewire.app.model3d-form');
    }
}
