<?php

namespace App\Livewire\App;

use App\Models\Project;
use Illuminate\Support\Facades\Auth;
use Livewire\Component;

class ProjectsForm extends Component
{

    public $name;
    public $description;

    public function save(){
        $this->validate([
            'name' => 'required',
            'description' => 'required'
        ]);

        Project::create([
            'name' => $this->name,
            'description' => $this->description,
            'user_id' => Auth::user()->id
        ]);

        $this->js("Swal.fire({icon: 'success', title: 'Proyecto Creado Satisfactoriamente'})");
        $this->js("$('modal-project').modal('hide')");

        $this->dispatch('refresh')->to(ProjectsView::class);
    }

    public function render()
    {
        return view('livewire.app.projects-form');
    }
}
