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


    public function mount(Project $project)
    {
        $this->project = $project;
    }

    public function render()
    {
        $documents = $this->project->documents;

        // Estadísticas básicas
        $stats = [
            'models3d' => $documents->filter(fn($doc) => str_contains($doc->type, 'ifc') || str_contains($doc->type, '3d'))->count(),
            'plans' => $documents->filter(fn($doc) => str_contains($doc->type, 'pdf'))->count(),
            'documents' => $documents->count(),
            'members' => $this->project->members()->count() + $this->project->pendingInvitations()->count() + 1, // +1 por el owner
        ];

        // Lista de miembros y colaboradores
        $membersList = collect();

        // 1. Dueño
        $membersList->push((object) [
            'name' => $this->project->owner->name,
            'email' => $this->project->owner->email,
            'role' => 'Dueño',
            'type' => 'member',
            'initials' => $this->getInitials($this->project->owner->name)
        ]);

        // 2. Miembros aceptados
        foreach ($this->project->members as $member) {
            $membersList->push((object) [
                'name' => $member->name,
                'email' => $member->email,
                'role' => $member->pivot->role ?? 'Colaborador',
                'type' => 'member',
                'initials' => $this->getInitials($member->name)
            ]);
        }

        // 3. Invitaciones pendientes
        foreach ($this->project->pendingInvitations as $invitation) {
            $membersList->push((object) [
                'name' => $invitation->email,
                'email' => $invitation->email,
                'role' => $invitation->role ?? 'Invitado',
                'type' => 'pending',
                'initials' => '?'
            ]);
        }

        // Actividad reciente (últimas 5 subidas de documentos)
        $activities = $this->project->documents()
            ->latest()
            ->take(5)
            ->get();

        return view('livewire.app.project-view', compact('stats', 'membersList', 'activities'));
    }

    /**
     * Obtener iniciales de un nombre
     */
    private function getInitials($name)
    {
        $words = explode(' ', $name);
        if (count($words) >= 2) {
            return strtoupper(substr($words[0], 0, 1) . substr($words[1], 0, 1));
        }
        return strtoupper(substr($name, 0, 2));
    }
}
