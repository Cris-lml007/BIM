<?php

namespace App\Livewire\App;

use App\Models\Project;
use Illuminate\Support\Facades\Auth;
use Livewire\Attributes\On;
use Livewire\Component;

class ProjectsForm extends Component
{

    public $name;
    public $description;
    public $project_id = null;

    #[On('editProject')]
    public function editProject($id)
    {
        $project = Project::find($id);
        if ($project && ($project->user_id === Auth::user()->id || $project->members()->where('user_id', Auth::user()->id)->exists())) {
            $this->project_id = $id;
            $this->name = $project->name;
            $this->description = $project->description;
        }
    }

    public function save(){

        
        $this->validate([
            'name' => 'required',
            'description' => 'required'
        ]);

        if ($this->project_id) {
            // Editar proyecto existente
            $project = Project::find($this->project_id);
            $project->update([
                'name' => $this->name,
                'description' => $this->description
            ]);
            $message = 'Proyecto Actualizado Satisfactoriamente';
        } else {
            // Validar límite de proyectos antes de crear
            $user = Auth::user();
            $access = $user->access;
            $currentProjectsCount = Project::where('user_id', $user->id)->count();
            
            if (!$access || !$access->canCreateMoreProjects($currentProjectsCount)) {
                $maxProjects = $access?->max_projects ?? 0;
                $this->js("
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'error',
                        title: 'Límite de proyectos alcanzado',
                        text: 'Has alcanzado el límite de $maxProjects proyectos permitidos',
                        showConfirmButton: false,
                        timer: 4000,
                        timerProgressBar: true
                    });
                ");
                return;
            }
            
            // Crear nuevo proyecto
            Project::create([
                'name' => $this->name,
                'description' => $this->description,
                'user_id' => Auth::user()->id
            ]);
            $message = 'Proyecto Creado Satisfactoriamente';
        }

        $this->reset(['name', 'description', 'project_id']);
        $this->js("$('#modal-project').modal('hide')");
                
        $this->js("
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: '$message',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
        ");
     


        $this->dispatch('refresh')->to(ProjectsView::class);
    }

    public function render()
    {
        return view('livewire.app.projects-form');
    }
}
