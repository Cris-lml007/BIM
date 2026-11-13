<?php

use App\Models\Anchor;
use App\Models\incident;
use App\Models\Model3D;
use App\Models\Project;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Renderless;
use Livewire\Component;

new #[Layout('layouts.viewer')] class extends Component
{

    public Model3D $model;
    public Project $project;
    public $models;
    public $anchors;

    public function mount(Project $project, Model3D $model){
        $this->project = $project;
        $this->model = $model;
        $this->models = $this->project->models;
        $this->anchors = $this->model->anchors->toArray();
    }

    #[Renderless]
    public function saveMark($title,$model,$type,$x,$y,$z){
        if($type == 'anchor'){
            do{
                $hash = Str::random(64);
            }while(Anchor::where('hash',$hash)->exists());
            $item = Anchor::create([
                'model_id' => $model == 'main' ? $this->model->id : explode('|',$model)[1],
                'user_id' => Auth::user()->id,
                'title' => $title,
                'hash' => $hash,
                'x' => $x,
                'y' => $y,
                'z' => $z,
            ]);
        }else{
            $item = incident::create([
                'title' => $title,
                'description' => '',
                'priority' => 1,
                'status' => 1,
                'user_id' => Auth::user()->id,
                'model' => $model == 'main' ? $this->model->id : explode('|',$model)[1],
                'x' => $x,
                'y' => $y,
                'z' => $z,
                'project_id' => $this->project->id

            ]);
        }

        if($item->id){
            return $item->id;
        }else{
            return "fail";
        }
    }

    #[Renderless]
    public function removeMark($id,$type){
        if($type == 'anchor'){
            Anchor::destroy($id);
        }else{
            incident::destroy($id);
        }
    }
};
