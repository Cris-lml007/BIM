<?php

namespace App\Livewire\Admin;

use App\Models\User;
use App\Models\Project;
use Illuminate\Support\Facades\Gate;
use Livewire\Component;

class UserAuditDetail extends Component
{
    public User $user;

    public function mount(User $user): void
    {
        Gate::authorize('saas-admin');

        $this->user = $user;
    }

    public function render()
    {
        // Proyectos donde el usuario es propietario.
        $ownedProjects = Project::query()
            ->where('user_id', $this->user->id)
            ->withCount(['models', 'documents', 'members'])
            ->withCount('activeMemberships')
            ->latest()
            ->get()
            ->map(function ($project) {
                $project->audit_type = 'owner';

                return $project;
            });

        // Proyectos donde participa como miembro activo.
        $memberProjects = Project::query()
            ->whereHas('activeMemberships', function ($query) {
                $query->where('user_id', $this->user->id);
            })
            ->where('user_id', '!=', $this->user->id)
            ->withCount(['models', 'documents', 'members'])
            ->withCount('activeMemberships')
            ->latest()
            ->get()
            ->map(function ($project) {
                $project->audit_type = 'member';

                return $project;
            });

        $projects = $ownedProjects
            ->concat($memberProjects)
            ->sortByDesc('created_at')
            ->values();

        $stats = [
            'owned_projects' => $ownedProjects->count(),
            'member_projects' => $memberProjects->count(),
            'total_projects' => $projects->count(),
            'models' => $projects->sum('models_count'),
            'documents' => $projects->sum('documents_count'),
            'members' => $projects->sum('active_memberships_count'),
        ];

        return view('livewire.admin.user-audit-detail', [
            'projects' => $projects,
            'stats' => $stats,
        ]);
    }
}
