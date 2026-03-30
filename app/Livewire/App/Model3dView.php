<?php

namespace App\Livewire\App;

use App\Models\Attachment;
use App\Models\Model3D;
use App\Models\Project;
use Livewire\Component;

class Model3dView extends Component
{
    public Project $project;


    public function mount(Project $project){
        $this->project = $project;
        // Model3D::destroy(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15);
        // Attachment::destroy(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15);
    }


    public function render()
    {
        $data = Model3D::paginate();

        return view('livewire.app.model3d-view',compact(['data']));
    }
}
