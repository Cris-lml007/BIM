<?php

namespace App\Livewire\Admin;

use App\Models\Access;
use App\Models\User;
use Livewire\Attributes\On;
use Livewire\Component;

class AccessForm extends Component
{
    public $user_id;
    public $max_projects;
    public $max_users;
    public $is_active = true;
    public $available;
    public $available_end;
    public $userSearch = '';
    public Access $access;

    public $modal_name = null;

    public function mount($modal_name = null, $id = null)
    {
        $this->available = now()->format('Y-m-d');
        $this->modal_name = $modal_name;
        if ($id && ($access = Access::find($id))) {
            $this->setAccess($access);
        } else {
            $this->access = new Access();
        }
    }

    #[On('getAccess')]
    public function getAccess($id)
    {
        if ($access = Access::find($id)) {
            $this->setAccess($access);
        } else {
            $this->access = new Access();
            $this->reset(['user_id', 'max_projects', 'max_users', 'is_active', 'available', 'available_end']);
        }
    }

    private function setAccess(Access $access)
    {
        $this->access = $access;
        $this->user_id = $access->user_id;
        $this->max_projects = $access->max_projects;
        $this->max_users = $access->max_users;
        $this->is_active = $access->is_active;
        $this->available = $access->available ? date('Y-m-d', strtotime($access->available)) : null;
        $this->available_end = $access->available_end ? date('Y-m-d', strtotime($access->available_end)) : null;
    }

    public function save()
    {
        $this->validate([
            'user_id' => 'required|exists:users,id',
            'max_projects' => 'required|integer|min:1',
            'max_users' => 'required|integer|min:1',
            'is_active' => 'required|boolean',
            'available' => 'required|date|after_or_equal:today',
            'available_end' => 'required|date|after_or_equal:available',
        ]);

        // Validar si el usuario puede tener un nuevo acceso
        if (!$this->canUserHaveAccess()) {
            return;
        }

        $this->access->user_id = $this->user_id;
        $this->access->max_projects = $this->max_projects;
        $this->access->max_users = $this->max_users;
        $this->access->is_active = $this->is_active;
        $this->access->available = $this->available;
        $this->access->available_end = $this->available_end;

        $isNew = !$this->access->exists;
        $this->access->save();

        $text = $isNew ? 'Acceso Creado' : 'Acceso Actualizado';

        if ($isNew) {
            $this->access = new Access();
            $this->reset(['user_id', 'max_projects', 'max_users', 'is_active', 'available', 'available_end']);
        }

        $this->js('closeModal');

        $this->dispatch('refreshAccessList')->to('admin.access-view');
    }

    private function canUserHaveAccess(): bool
    {
        $yesterday = now()->subDay()->startOfDay();
        $existingAccess = Access::where('user_id', $this->user_id)
            ->where(function ($query) use ($yesterday) {
                $query->whereDate('available_end', '>', $yesterday);
            })
            ->when($this->access->exists, function ($query) {
                $query->where('id', '!=', $this->access->id);
            })
            ->first();

        if ($existingAccess) {
            $message = 'El usuario ya tiene un acceso que aún no ha expirado. ';
            $message .= 'Fecha de expiración: ' . $existingAccess->available_end->format('d/m/Y');
            $message .= ' - Estado: ' . ($existingAccess->is_active ? 'Activo' : 'Inactivo pero no expirado');

            $this->addError('user_id', $message);
            return false;
        }
        return true;
    }
    public function render()
    {
        $users = User::where('name', 'like', '%' . $this->userSearch . '%')
            ->orWhere('email', 'like', '%' . $this->userSearch . '%')
            ->limit(10)
            ->get();
        return view('livewire.admin.access-form', compact('users'));
    }

}
