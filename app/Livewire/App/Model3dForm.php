<?php

namespace App\Livewire\App;

use App\Models\Attachment;
use App\Models\Model3D;
use App\Models\Project;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Livewire\Attributes\On;
use Livewire\Component;
use Livewire\WithFileUploads;

class Model3dForm extends Component
{
    use WithFileUploads;

    public $name;
    public $description;
    public $file;
    public Project $project;
    public $thumbnail;

    public function mount(Project $project){
        $this->project = $project;
        // dd(phpinfo());
    }

    public function save(){
        // dd($this->thumbnail);
        $this->validate([
            'name' => 'required',
            'description' => 'required',
            'file' => 'required|file|extensions:glb,ifc'
        ]);

        $id = $this->project->id;

        if(!Storage::directoryExists("projects/$id")){
            Storage::makeDirectory("projects/$id");
        }

        $model = Model3D::create([
            'name' => $this->name,
            'description' => $this->description,
            'project_id' => $this->project->id,
            'user_id' => Auth::user()->id
        ]);

        do{
            $hash = Str::random(64);
        }while(Attachment::where('file',$hash)->exists());

        $type = $this->file->extension();
        $hash = "$hash.$type";
        $this->file->storeAs(path: "projects/$id",name: $hash);

        $attachment = Attachment::create([
            'name' => $model->name,
            'file' => $hash,
            'type' => $type,
            'path' => "projects/$id",
            'fileable_id' => $model->id,
            'fileable_type' => Model3D::class
        ]);

        $this->thumbnail->storeAs(path: "projects/$id/thumbnails",name: $attachment->id.'.png');

        return $this->redirect(route('app.project.model3d',$id));
    }


    public function render()
    {
        return view('livewire.app.model3d-form');
    }
}
