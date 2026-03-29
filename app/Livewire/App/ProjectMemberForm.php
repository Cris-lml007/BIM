<?php

namespace App\Livewire\App;

use App\Enum\RoleProject;
use App\Mail\ProjectInvitationMail;
use App\Models\Project;
use App\Models\ProjectInvitation;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Livewire\Attributes\On;
use Livewire\Component;

class ProjectMemberForm extends Component
{
    public Project $project;
    public $email = '';
    public $role = '';
    public $selectedUser = null;
    public $searchResults = [];
    public $showSearchResults = false;
    public $isExistingUser = false;
    public $showExternalInviteConfirm = false;

    protected $rules = [
        'email' => 'required|email',
        'role' => 'required|numeric',
    ];

    protected $messages = [
        'email.required' => 'El correo electrónico es requerido',
        'email.email' => 'Ingresa un correo electrónico válido',
        'role.required' => 'Debes seleccionar un rol',
    ];

    public function mount(Project $project)
    {
        $this->project = $project;
    }

    public function updatedEmail($value)
    {
        $this->reset(['selectedUser', 'isExistingUser', 'showExternalInviteConfirm']);

        if (strlen($value) > 2) {
            $this->searchUsers($value);
            $this->showSearchResults = true;
        } else {
            $this->searchResults = [];
            $this->showSearchResults = false;
        }
    }

    public function searchUsers($search)
    {
        // Buscar usuarios que no sean el dueño del proyecto y no sean miembros
        $this->searchResults = User::where('id', '!=', $this->project->user_id)
            ->where(function ($query) use ($search) {
                $query->where('name', 'like', '%' . $search . '%')
                    ->orWhere('email', 'like', '%' . $search . '%');
            })
            ->whereNotIn('id', $this->project->members()->pluck('user_id'))
            ->limit(5)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $this->getAvatar($user->name)
                ];
            });
    }

    public function selectUser($userId)
    {
        $user = User::find($userId);

        if ($user) {
            $this->selectedUser = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email
            ];
            $this->email = $user->email;
            $this->isExistingUser = true;
            $this->showSearchResults = false;
            $this->resetErrorBag('email');
        }
    }

    public function checkExistingUser()
    {
        if (empty($this->email)) {
            $this->addError('email', 'Ingresa un correo electrónico');
            return;
        }

        $user = User::where('email', $this->email)->first();

        if ($user) {
            // Verificar si ya es miembro
            if ($this->isUserAlreadyMember($user->id)) {
                $this->addError('email', 'Este usuario ya es miembro del proyecto');
                return;
            }

            // Verificar si es el dueño
            if ($user->id === $this->project->user_id) {
                $this->addError('email', 'El dueño del proyecto ya es parte del proyecto');
                return;
            }

            $this->selectedUser = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email
            ];
            $this->isExistingUser = true;
            $this->resetErrorBag('email');
        } else {
            $this->isExistingUser = false;
            $this->selectedUser = null;
            // El usuario no existe, mostrar opción para invitar externamente
            $this->showExternalInviteConfirm = true;
        }
    }

    public function isUserAlreadyMember($userId)
    {
        return $this->project->members()->where('user_id', $userId)->exists();
    }

    public function inviteExistingUser()
    {
        $this->validate();

        if (!$this->selectedUser) {
            $this->addError('email', 'Usuario no encontrado');
            return;
        }

        // dd("her");
        try {
            // Agregar miembro al proyecto
            $this->project->members()->attach($this->selectedUser['id'], [
                'role' => $this->role
            ]);

            $this->reset(['email', 'role', 'selectedUser', 'isExistingUser']);

            $this->dispatch('member-created')->to('app.project-members-view');

            $this->js("$('#modal-member').modal('hide');");
        } catch (\Exception $e) {
            dd('Error al invitar usuario: ' . $e->getMessage());
            $this->dispatch('member-invited', [
                'type' => 'error',
                'message' => 'Error al invitar al usuario. Por favor intenta de nuevo.'
            ]);
        }

    }

    public function inviteExternalUser()
    {
        $this->validate([
            'email' => 'required|email'
        ]);

        try {
            // Verificar si ya existe una invitación pendiente
            $existingInvitation = ProjectInvitation::where('project_id', $this->project->id)
                ->where('email', $this->email)
                ->where('status', 'pending')
                ->where('expires_at', '>', now())
                ->first();

            if ($existingInvitation) {
                $this->dispatch('member-invited', [
                    'type' => 'warning',
                    'message' => 'Ya existe una invitación pendiente para este correo electrónico'
                ]);
                return;
            }

            // Crear invitación
            $invitation = ProjectInvitation::create([
                'project_id' => $this->project->id,
                'email' => $this->email,
                'invited_by' => Auth::id(),
                'token' => \Illuminate\Support\Str::random(64),
                'role' => $this->role,
                'status' => 'pending',
                'expires_at' => now()->addDays(7),
            ]);

            // Enviar correo de invitación
            Mail::send('emails.project-invitation', [
                'invitation' => $invitation,
                'project' => $this->project,
                'inviter' => Auth::user()
            ], function ($message) {
                $message->to($this->email)
                    ->subject('Invitación para unirte al proyecto ' . $this->project->name);
            });

            $this->dispatch('member-invited', [
                'type' => 'success',
                'message' => "Invitación enviada exitosamente a {$this->email}"
            ]);

            $this->reset(['email', 'role', 'selectedUser', 'isExistingUser', 'showExternalInviteConfirm']);
            $this->dispatch('close-modal');

        } catch (\Exception $e) {
            dd('Error al enviar invitación externa: ' . $e->getMessage());
            $this->dispatch('member-invited', [
                'type' => 'error',
                'message' => 'Error al enviar la invitación. Por favor intenta de nuevo.'
            ]);
        }
    }



    private function getAvatar($name)
    {
        return 'https://ui-avatars.com/api/?background=random&name=' . urlencode($name);
    }

    public function cancelExternalInvite()
    {
        $this->showExternalInviteConfirm = false;
        $this->reset(['email', 'selectedUser', 'isExistingUser']);
        $this->resetErrorBag();
    }

    public function render()
    {
        $roles = RoleProject::cases();
        return view('livewire.app.project-member-form', compact('roles'));
    }
}
