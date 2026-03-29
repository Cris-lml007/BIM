<?php

namespace App\Livewire\Admin;

use App\Models\Access;
use Livewire\Component;
use Livewire\WithPagination;

class AccessView extends Component
{
    use WithPagination;

    public $actions = [
        'search' => '',
        'sortField' => 'id',
        'sortDirection' => 'asc'
    ];
    protected $listeners = [
        'refreshAccessList' => 'refreshAccessList',
    ];

    public function refreshAccessList()
    {

        $this->js("
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Acceso creado',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
        ");
        $this->resetPage();
    }

    public function changeStatus(Access $access)
    {
        $access->is_active = !$access->is_active;
        $text = $access->is_active ? 'Acceso Habilitado' : 'Acceso Deshabilitado';

        $this->js("
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'info',
                title: '$text',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
            ");
        $access->save();
    }


    public function delete(Access $access)
    {
        $access->delete();
        $this->js("
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'info',
                title: 'Acceso Eliminado',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
            ");
    }

    public function getAccess($id)
    {
        $this->dispatch('getAccess', $id)->to(AccessForm::class);
        $this->js("$('#modal-access').modal('show');");
    }

    public function render()
    {
        $heads = [
            'ID' => 'id',
            'Usuario' => 'user_id',
            'Proyectos' => 'max_projects',
            'Usuarios' => 'max_users',
            'Inicio' => 'available',
            'Fin' => 'available_end',
            'Estado' => 'is_expired',
            'Acceso' => 'is_active',
            'Opciones' => null
        ];

        $search = $this->actions['search'];

        $query = Access::with('user');

        if ($search != '' || $search != null) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('email', 'like', '%' . $search . '%');
            });
        }

        $accesses = $query->orderBy($this->actions['sortField'], $this->actions['sortDirection'])
            ->paginate();

        $actives = Access::where('is_active', 1)
            ->where(function ($query) {
                $query->whereNull('available')
                    ->orWhere('available', '<=', now());
            })
            ->where(function ($query) {
                $query->whereNull('available_end')
                    ->orWhere('available_end', '>=', now());
            })
            ->count();
        $blockeds = Access::where('is_active', 0)
            ->where(function ($query) {
                $query->whereNull('available')
                    ->orWhere('available', '<=', now());
            })
            ->where(function ($query) {
                $query->whereNull('available_end')
                    ->orWhere('available_end', '>=', now());
            })
            ->count();

        $expired = Access::whereNotNull('available_end')
            ->where('available_end', '<', now())
            ->count();
        $total = Access::count();

        return view('livewire.admin.access-view', compact('heads', 'accesses', 'actives', 'blockeds', 'expired', 'total'));
    }
}
