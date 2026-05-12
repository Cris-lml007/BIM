<?php

namespace App\Livewire\App;

use Livewire\Component;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

use App\Enum\MembershipStatus;
use App\Enum\RoleProject;
use App\Mail\ProjectInvitationMail;
use App\Models\Project;
use App\Models\User;
use App\Services\ProjectMembershipService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Mail;

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
    public $membersList = null;
    public $selectedMember = null;
    public $selectedMemberMemberships = null;
    public $selectedMemberForRoleChange = null;
    public $newRole = '';
    public $currentMemberRole = null;
    public $current_modal = null;
    public $generalMembershipHistories = null;

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

    public $headsInvitations = [
        'ID' => 'id',
        'Email' => 'email',
        'Rol' => 'pivot_role',
        'Estado' => 'state',
        'Expiracion' => 'expired',
        'Acciones' => null
    ];
    protected $rules = [
        'email' => 'required|email',
        'role' => 'required|integer',
    ];


    protected $listeners = [
        'member-created' => 'refreshMembers',
        'member-invited' => 'memberInvited'
    ];
    public function refreshMembers()
    {
        $this->loadMembers();
        $this->js("
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Nuevo miembro agregado',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
            ");


    }
    public function memberInvited()
    {
        $this->js("
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: 'Invitación enviada',
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true
                    });
                ");
        //$this->resetPage();
    }
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
    protected function loadMembers()
    {
        $query = $this->project->members();

        // Aplicar búsqueda si existe
        if (!empty($this->actions['search'])) {
            $query->where(function ($q) {
                $q->where('users.name', 'like', '%' . $this->actions['search'] . '%')
                    ->orWhere('users.email', 'like', '%' . $this->actions['search'] . '%');
            });
        }

        $sortField = $this->actions['sortField'];
        $sortColumn = match ($sortField) {
            'pivot_role' => 'project_memberships.role',
            'created_at' => 'project_memberships.started_at',
            'id' => 'users.id',
            'name' => 'users.name',
            'email' => 'users.email',
            default => $sortField
        };

        // Guardar en una propiedad para usar en render
        $this->membersList = $query->orderBy($sortColumn, $this->actions['sortDirection'])->get();
    }

    public function openInviteModal()
    {
        $this->reset(['userSearch', 'selectedUser', 'role', 'email', 'externalEmail']);
        $this->current_modal = 'modal-invite';
        $this->js("$('#modal-invite').modal('show');");
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

        return $this->project->activeMemberships()->where('user_id', $userId)->exists();
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
        if ($this->project->activeMemberships()->where('user_id', $user->id)->exists()) {
            $this->js("Swal.fire({icon:'error', title: 'Error', text: 'Este usuario ya es miembro del proyecto.'})");
            return;
        }

        // Add member to project
        $service = new ProjectMembershipService();
        $service->addMember(
            $this->project,
            $user,
            RoleProject::from((int) $this->role),
            Auth::user()
        );

        $this->js("Swal.fire({icon:'success', title: 'Éxito', text: 'Usuario añadido al proyecto.'})");

        // Reset form and close modal
        $this->reset(['email', 'userSearch', 'role', 'selectedUser']);
        $this->js('closeModal');

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
        $this->current_modal = 'modal-confirm-invite';
        $this->js("
        $('#modal-invite').modal('hide');
        setTimeout(() => {
            $('#modal-confirm-invite').modal('show');
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
        Mail::to($this->externalEmail)->send(new \App\Mail\ProjectInvitationMail($invitation, $this->project, Auth::user()));

        $this->js('closeModal');

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

        $membership = $this->project->activeMemberships()
            ->where('user_id', $userId)
            ->first();

        if ($membership) {
            $service = new ProjectMembershipService();
            $service->removeMember(
                $membership,
                MembershipStatus::EXPELLED,
                Auth::user(),
                'Expulsado del proyecto'
            );
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

    public function showMemberHistory(int $userId)
    {
        $this->selectedMember = User::find($userId);

        if (!$this->selectedMember) {
            return;
        }

        $this->selectedMemberMemberships = $this->project->memberships()
            ->where('user_id', $userId)
            ->with(['histories.actor'])
            ->orderBy('started_at')
            ->get();

        $this->current_modal = 'modal-member-history';
        $this->js("$('#modal-member-history').modal('show');");
    }

    public function showGeneralHistory()
    {
        // Obtener todos los eventos del proyecto ordenados por fecha descendente
        $this->generalMembershipHistories = \App\Models\ProjectMembershipHistory::where('project_id', $this->project->id)
            ->with(['user', 'actor', 'membership'])
            ->orderBy('performed_at', 'desc')
            ->get();

        $this->current_modal = 'modal-general-history';
        $this->js("$('#modal-general-history').modal('show');");
    }

    public function openChangeRoleModal(int $userId)
    {
        // Check if current user is the owner
        if (Auth::user()->id !== $this->project->user_id) {
            $this->js("Swal.fire({icon:'error', title: 'Error', text: 'Solo el dueño del proyecto puede cambiar roles.'})");
            return;
        }

        $this->selectedMemberForRoleChange = User::find($userId);

        if (!$this->selectedMemberForRoleChange) {
            $this->js("Swal.fire({icon:'error', title: 'Error', text: 'Miembro no encontrado.'})");
            return;
        }

        // Get current membership and role
        $membership = $this->project->activeMemberships()
            ->where('user_id', $userId)
            ->first();

        if (!$membership) {
            $this->js("Swal.fire({icon:'error', title: 'Error', text: 'El usuario no es un miembro activo del proyecto.'})");
            return;
        }

        $this->currentMemberRole = $membership->role;
        $this->newRole = $membership->role->value;

        $this->current_modal = 'modal-change-role';
        $this->js("$('#modal-change-role').modal('show');");
    }

    public function changeMemberRole()
    {
        // Check if current user is the owner
        if (Auth::user()->id !== $this->project->user_id) {
            $this->js("Swal.fire({icon:'error', title: 'Error', text: 'Solo el dueño del proyecto puede cambiar roles.'})");
            return;
        }

        $this->validate([
            'newRole' => 'required|integer|in:' . implode(',', array_column(RoleProject::cases(), 'value')),
        ]);

        if (!$this->selectedMemberForRoleChange) {
            $this->js("Swal.fire({icon:'error', title: 'Error', text: 'Miembro no encontrado.'})");
            return;
        }

        // Get current membership
        $membership = $this->project->activeMemberships()
            ->where('user_id', $this->selectedMemberForRoleChange->id)
            ->first();

        if (!$membership) {
            $this->js("Swal.fire({icon:'error', title: 'Error', text: 'El usuario no es un miembro activo del proyecto.'})");
            return;
        }

        // Check if role is actually changing
        if ($membership->role->value == $this->newRole) {
            $this->js("Swal.fire({icon:'info', title: 'Sin cambios', text: 'El rol seleccionado es el mismo que el actual.'})");
            return;
        }

        // Change role using service
        $service = new ProjectMembershipService();
        $service->changeRole(
            $membership,
            RoleProject::from((int) $this->newRole),
            Auth::user()
        );

        // Close modal
        $this->js('closeModal');
        

        // Reset properties
        $this->reset(['selectedMemberForRoleChange', 'newRole', 'currentMemberRole']);

        // Show success message
        $this->js("
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Rol actualizado correctamente',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
        ");

        // Refresh the component
        $this->dispatch('$refresh');
    }

    public function removeInvited($invitationId)
    {
        // Check if current user is the owner
        if (Auth::user()->id !== $this->project->user_id) {
            $this->js("Swal.fire({icon:'error', title: 'Error', text: 'Solo el dueño del proyecto puede eliminar miembros.'})");
            return;
        }

        // Prevent removing yourself if you're not the owner? Actually owner is not in members table
        $this->project->invitations()
            ->where('id', $invitationId)
            ->delete();


    }
    public function getUser($id)
    {
        $this->dispatch('getUser', $id)->to(\App\Livewire\Admin\UsersForm::class);
        $this->js("new bootstrap.Modal(document.getElementById('modal-info')).show();");
    }
    public function render()
    {
        if (!$this->project->ownerAccess()) {
            return $this->emptyResponse();
        }

        return $this->authorizedResponse();
    }
    protected function emptyResponse()
    {
        return view('livewire.app.project-members-view', [
            'members' => collect(),
            'owner' => null,
            'total_members' => 0,
            'total' => 0,
            'invites' => collect(),
            'usersSearchList' => collect(),
        ]);
    }
    protected function authorizedResponse()
    {
        $search = $this->actions['search'] ?? null;
        $sortField = $this->actions['sortField'] ?? 'id';
        $sortDirection = $this->actions['sortDirection'] ?? 'asc';

        $query = $this->project->members();

        if (!empty($search) && Auth::id() !== $this->project->user_id) {
            $query->where(function ($q) use ($search) {
                $q->where('users.name', 'like', "%{$search}%")
                    ->orWhere('users.email', 'like', "%{$search}%");
            });
        }

        $sortColumn = match ($sortField) {
            'pivot_role' => 'project_memberships.role',
            'created_at' => 'project_memberships.started_at',
            'id' => 'users.id',
            'name' => 'users.name',
            'email' => 'users.email',
            default => 'users.id'
        };

        $members = $query->orderBy($sortColumn, $sortDirection)->get();

        $usersSearchList = $this->getUsersSearchList();

        $owner = $this->project->owner;
        $total_members = $this->project->members()->count();
        $total = optional($this->project->ownerAccess())->max_users ?? 0;
        $invites = $this->project->invitations()->get();

        return view('livewire.app.project-members-view', compact(
            'members',
            'owner',
            'total_members',
            'total',
            'invites',
            'usersSearchList'
        ));
    }
    protected function getUsersSearchList()
    {
        if (empty($this->userSearch) || strlen($this->userSearch) <= 2) {
            return collect();
        }

        return User::where('id', '!=', $this->project->user_id)
            ->where(function ($q) {
                $q->where('name', 'like', "%{$this->userSearch}%")
                    ->orWhere('email', 'like', "%{$this->userSearch}%");
            })
            ->whereNotIn('id', $this->project->members()->pluck('users.id'))
            ->limit(10)
            ->get();
    }
}
