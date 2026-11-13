<?php

namespace App\Livewire\App;

use App\Models\incident;
use Livewire\Attributes\On;
use Livewire\Component;

class EditIncident extends Component
{
    public incident $incident;

    public $name;
    public $priority;
    public $project;

    public function mount($project){
        $this->project = $project;
    }

    #[On('getIncident')]
    public function getIncident($id){
        $this->incident = incident::find($id);
        $this->name = $this->incident->title;
        $this->priority = $this->incident->priority;
    }

    public function save(){
        $this->validate([
            'name' => 'required'
        ]);

        $this->incident->title = $this->name;
        $this->incident->priority = $this->priority;
        $this->incident->save();
        $this->redirect(route('app.project.incidents',[$this->project]));
    }


    public function render()
    {
        return view('livewire.app.edit-incident');
    }
}
