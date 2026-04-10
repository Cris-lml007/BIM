<?php

namespace App\Livewire\App;

use App\Models\incident;
use App\Models\Project;
use Livewire\Attributes\On;
use Livewire\Component;

class IncidentView extends Component
{
    public Project $project;

public $actions = [
        'search' => '',
        'sortField' => 'id',
        'sortDirection' => 'asc'
    ];
public $heads = [
            'ID' => 'id',
            'Incidencia' => 'user_id',
            'Prioridad' => 'max_projects',
            'Estado' => 'max_users',
            'Fecha y hora' => 'max_storage',
          
            'Opciones' => null
        ];

    public function render()
    {
        
        //$search = $this->actions['search'];
        $query = incident::where('project_id', $this->project->id)->get();
        //dd($this->project->id);
        /*if ($search != '' || $search != null) {
            $query->whereHas('incident', function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%');
            });
        }*/
        
        /*$incidents = $query->orderBy($this->actions['sortField'], $this->actions['sortDirection'])
            ->paginate();
            $in
*/
$incidents = $query;

        return view('livewire.app.incident-view', compact( 'incidents'));
    }

    public function getIncident($id){
        $this->dispatch('getIncident', $id)->to(IncidentDetail::class);
        $this->js("$('#modal-incident-detail').modal('show');");
    }
    public function delete($id){
        try{
            incident::find($id)->delete();
            $msg ='Incidencia eliminada';
            $icon = 'success' ;
        }   catch (\Exception $e) {
            $msg = 'Error al eliminar la incidencia';
            $icon = 'error';
        } 
        $this->js("
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: '{$icon}',
                title: '{$msg}',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
        ");
    }
    #[On('incidentAdded')]
    public function incidentAdded(){
//        $this->render();
$this->js("
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Incidencia agregada',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
        ");
    }
}
