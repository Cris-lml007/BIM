<?php

namespace App\Livewire\App;

use App\Models\Model3D;
use App\Models\Project;
use Livewire\Component;

class Model3dView extends Component
{
    public Project $project;


    public function mount(Project $project){
        $this->project = $project;
    }


    public function render()
    {
        $data = Model3D::paginate();

        return view('livewire.app.model3d-view',compact(['data']));
    }
}
