<?php

namespace App\Livewire\App;

use App\Models\Project;
use Livewire\Component;

class ProjectView extends Component
{

    public $project;


    public function mount(Project $project){
        $this->project = $project;
    }

    public function render()
    {
        return view('livewire.app.project-view');
    }
}
