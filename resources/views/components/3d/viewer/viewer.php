<?php

use App\Models\Model3D;
use App\Models\Project;
use Livewire\Component;

new class extends Component
{

    public Model3D $model;
    public Project $project;

    public function mount(Project $project, Model3D $model){
        $this->project = $project;
        $this->model = $model;
    }
};
