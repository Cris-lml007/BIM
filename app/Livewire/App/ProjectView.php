<?php

namespace App\Livewire\App;

use App\Models\Project;
use Livewire\Component;

class ProjectView extends Component
{

    public $list = [
        'search' => '',
        'sortField' => 'id',
        'sortDirection' => 'asc'
    ];

    public $project;


    public function mount(Project $project){
        $this->project = $project;
    }

    public function render()
    {
        $heads = [
            'ID' => 'id',
            'Nombre' => 'name',
            'Modelo' => 'model',
            'Creado' => 'create_at',
            'Opciones' => null
        ];
        $number_models = $this->project->models()->count();
        return view('livewire.app.project-view',compact(['heads','number_models']));
    }
}
