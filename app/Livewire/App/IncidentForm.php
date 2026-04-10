<?php

namespace App\Livewire\App;

use App\Models\incident;
use App\Models\User;
use Livewire\Component;

class IncidentForm extends Component
{
    public $project;
public  $prioridad =2;
    public $titulo;
    public $modelo;
    public $descripcion;
    public $x, $y, $z;
    public function mount($project){
        $this->project = $project;
    }
    public function save(){
        $this->validate([
            'titulo' => 'required|string|max:255',
            'descripcion' => 'required|string|max:255',
            'prioridad' => 'required|integer|between:1,3',
            'modelo' => 'required|integer',
            'x' => 'required|numeric',
            'y' => 'required|numeric',
            'z' => 'required|numeric'
        ]);
        incident::create([
            'title' => $this->titulo,
            'user_id' => auth()->id(),
            'description' => $this->descripcion,
            'priority' => $this->prioridad,
            'model' => $this->modelo,
            'x' => $this->x,
            'y' => $this->y,
            'z' => $this->z,
            'project_id' => $this->project->id
        ]);
        $this->dispatch('incidentAdded')->to(IncidentView::class);
        $this->js("$('#modal-incident').modal('hide');");
        $this->resetForm();
    }
        public function resetForm(){
        $this->prioridad = 2;
        $this->titulo = null;
        $this->descripcion = null;
        $this->modelo = null;
        $this->x = 0;
        $this->y = 0;
        $this->z = 0;
        
    }
    public function render()
    {
        return view('livewire.app.incident-form');
    }
}
