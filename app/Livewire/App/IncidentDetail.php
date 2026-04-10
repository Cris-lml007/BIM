<?php

namespace App\Livewire\App;

use App\Models\incident;
use Livewire\Attributes\On;
use Livewire\Component;

class IncidentDetail extends Component
{
    public $comment;
public $project;
    public $incident = [
        'title' => null,
        'description' => null,
        'priority' => null,
        'status' => null,
        'created_at' => null
    ];
    public function mount($project){
        $this->project = $project;

    }

    public function render()
    {
        return view('livewire.app.incident-detail');
    }
    #[On('getIncident')]
    public function getIncident($id){
        $this->incident = Incident::with('comments')->find($id);

    }
    public function statusIncident($id){
        $incident = incident::find($id);
        $incident->status = $incident->status === 1 ? 0 : 1;
        $incident->save();
        $this->getIncident($id);
        $this->js("
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Estado de la incidencia actualizado',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
        ");
    }
    public function addComment($id){
        $this->validate([
            'comment' => 'required|string|max:255',
        ]);
        $incident = incident::find($id);
        $incident->comments()->create([
            'user_id' => auth()->id(),
            'comment' => $this->comment,
            'incident_id' => $id,
        ]);
        $this->comment = '';
        $this->getIncident($id);
    }
}
