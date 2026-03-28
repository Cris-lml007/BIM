<?php

namespace App\Livewire\App;

use Livewire\Component;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

use App\Mail\ProjectInvitationMail;
use Illuminate\Support\Facades\Mail;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\Auth;


use Illuminate\Support\Facades\Log;

class ProjectMembersView extends Component
{
    use AuthorizesRequests;
public Project $project;
    public $email = '';
    public $userSearch = '';
    public $role = '';
    public $selectedUser = null;
    public $externalEmail = '';
    public $isInviting = false;

    public $actions = [
        'search' => '',
        'sortField' => 'id',
        'sortDirection' => 'asc'
    ];

    public $heads = [
        'ID' => 'id',
        'Miembro' => 'name',
        'Email' => 'email',
        'Rol' => 'pivot_role',
        'Desde' => 'created_at',
        'Acciones' => null
    ];

    protected $rules = [
        'email' => 'required|email',
        'role' => 'required|in:admin,member',
    ];

       
    public function mount(Project $project)
    {
        $this->project = $project;
        /*
        // Ensure the current user is authorized to see the project
        if (Auth::user()->id !== $this->project->user_id && !$this->project->members()->where('user_id', Auth::user()->id)->exists()) {
            abort(403);
        }
        */
    }
    

    public function openInviteModal()
    {
        $this->reset(['userSearch', 'selectedUser', 'role', 'email', 'externalEmail']);
        $this->dispatch('openModal', 'modal-invite');
        $this->js("new bootstrap.Modal(document.getElementById('modal-invite')).show();");
    }

    public function selectUser($email)
    {
        $user = User::where('email', $email)->first();

        if ($user) {
            $this->selectedUser = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email
            ];
            $this->email = $user->email;
            $this->userSearch = $user->name;
        }
    }

    public function updatedUserSearch($value)
    {
        // Reset selected user when search changes
        if ($this->selectedUser && $this->selectedUser['email'] !== $value) {
            $this->selectedUser = null;
            $this->email = '';
            $this->role = '';
        }

        // Clear selected user if search is empty
        if (empty($value)) {
            $this->selectedUser = null;
            $this->email = '';
        }
    }

    public function isUserAlreadyMember($userId)
    {
        if ($userId === $this->project->user_id) {
            return true;
        }

        return $this->project->members()->where('user_id', $userId)->exists();
    }

    public function emailExists($email)
    {
        return User::where('email', $email)->exists();
    }

    public function invite()
    {
        $this->validate([
            'email' => 'required|email|exists:users,email',
            'role' => 'required|in:admin,member',
        ]);

        $user = User::where('email', $this->email)->first();

        // Check if user is the owner
        if ($user->id === $this->project->user_id) {
            $this->js("Swal.fire({icon:'error', title: 'Error', text: 'El dueño del proyecto ya es parte del mismo.'})");
            return;
        }

        // Check if user is already a member
        if ($this->project->members()->where('user_id', $user->id)->exists()) {
            $this->js("Swal.fire({icon:'error', title: 'Error', text: 'Este usuario ya es miembro del proyecto.'})");
            return;
        }

        // Add member to project
        $this->project->members()->attach($user->id, ['role' => $this->role]);

        $this->js("Swal.fire({icon:'success', title: 'Éxito', text: 'Usuario añadido al proyecto.'})");

        // Reset form and close modal
        $this->reset(['email', 'userSearch', 'role', 'selectedUser']);
        $this->dispatch('closeModal', 'modal-invite');
        $this->js("
            var modalEl = document.getElementById('modal-invite');
            var modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
        ");

        // Refresh the component
        $this->dispatch('$refresh');
    }

    public function prepareExternalInvitation()
    {
        $this->externalEmail = $this->userSearch;

        $this->validate([
            'externalEmail' => 'required|email',
        ]);

        // Abrir modal de confirmación
        $this->js("
        var inviteModal = bootstrap.Modal.getInstance(document.getElementById('modal-invite'));
        if (inviteModal) inviteModal.hide();
        setTimeout(() => {
            new bootstrap.Modal(document.getElementById('modal-confirm-invite')).show();
        }, 300);
    ");
    }

    public function sendExternalInvitation()
    {
        $this->validate([
            'externalEmail' => 'required|email',
        ]);

        // Evitar duplicado
        $existing = \App\Models\ProjectInvitation::where('project_id', $this->project->id)
            ->where('email', $this->externalEmail)
            ->where('status', 'pending')
            ->first();

        if ($existing && !$existing->isExpired()) {
            $this->js("Swal.fire({icon:'warning', title:'Atención', text:'Ya existe una invitación pendiente para este correo.'})");
            return;
        }

        // Crear invitación
        $invitation = \App\Models\ProjectInvitation::updateOrCreate(
            ['project_id' => $this->project->id, 'email' => $this->externalEmail],
            [
                'invited_by' => Auth::id(),
                'token' => \Illuminate\Support\Str::random(64),
                'role' => 'member', // puedes hacer esto seleccionable después
                'status' => 'pending',
                'expires_at' => now()->addDays(7),
            ]
        );

        // Enviar correo
        Mail::to($this->externalEmail)->send(new \App\Mail\ProjectInvitationMail($invitation));

        $this->js("
        var modal = bootstrap.Modal.getInstance(document.getElementById('modal-confirm-invite'));
        if (modal) modal.hide();
    ");

        $this->js("
        Swal.fire({
            toast: true, position: 'top-end', icon: 'success',
            title: 'Invitación enviada correctamente',
            showConfirmButton: false, timer: 3000, timerProgressBar: true
        });
    ");

        $this->reset(['externalEmail', 'userSearch', 'selectedUser']);
    }


    public function removeMember($userId)
    {
        // Check if current user is the owner
        if (Auth::user()->id !== $this->project->user_id) {
            $this->js("Swal.fire({icon:'error', title: 'Error', text: 'Solo el dueño del proyecto puede eliminar miembros.'})");
            return;
        }

        // Prevent removing yourself if you're not the owner? Actually owner is not in members table
        $member = $this->project->members()->where('user_id', $userId)->first();

        if ($member) {
            $this->project->members()->detach($userId);

            $this->js("
Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'info',
    title: 'Miembro eliminado del proyecto',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true
});
");
        }
    }

    public function getUser($id)
    {
        $this->dispatch('getUser', $id)->to(\App\Livewire\Admin\UsersForm::class);
        $this->js("new bootstrap.Modal(document.getElementById('modal-info')).show();");
    }

    public function render()
    {
        $search = $this->actions['search'];
        $query = $this->project->members();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('users.name', 'like', '%' . $search . '%')
                    ->orWhere('users.email', 'like', '%' . $search . '%');
            });
        }

        $sortField = $this->actions['sortField'];
        $sortColumn = match ($sortField) {
            'pivot_role' => 'project_user.role',
            'created_at' => 'project_user.created_at',
            'id'         => 'users.id',
            'name'       => 'users.name',
            'email'      => 'users.email',
            default      => $sortField
        };

        $members = $query->orderBy($sortColumn, $this->actions['sortDirection'])->get();

        // Search list for the modal - only show users not already in project
        $usersSearchList = collect();
        if (!empty($this->userSearch) && strlen($this->userSearch) > 2) {
            $usersSearchList = User::where('id', '!=', $this->project->user_id)
                ->where(function ($q) {
                    $q->where('name', 'like', '%' . $this->userSearch . '%')
                        ->orWhere('email', 'like', '%' . $this->userSearch . '%');
                })
                ->whereNotIn('id', $this->project->members()->pluck('users.id'))
                ->limit(10)
                ->get();
        }

        // Include owner in the list
        $owner = $this->project->owner;

        // Statistics
        $total_members = $this->project->members()->count() + 1;
        $admins = $this->project->members()->wherePivot('role', 'admin')->count() + 1;
        $basic_members = $this->project->members()->wherePivot('role', 'member')->count();

        Log::info('Render ejecutado para el proyecto ID: ' . $this->project->id);
        return view('livewire.app.project-members-view', compact('members', 'owner', 'total_members', 'admins', 'basic_members', 'usersSearchList'));
    }

}
