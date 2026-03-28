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

    public function changeStatus(Access $access)
    {
        $access->is_active = !$access->is_active;
        $access->save();
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
            'Estado' => 'is_active',
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

        $actives = Access::where('is_active', 1)->count();
        $blockeds = Access::where('is_active', 0)->count();
        $total = Access::count();

        return view('livewire.admin.access-view', compact('heads', 'accesses', 'actives', 'blockeds', 'total'));
    }
}
