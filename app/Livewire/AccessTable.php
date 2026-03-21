<?php

namespace App\Livewire;

use Livewire\Component;
use Livewire\WithPagination;

class AccessTable extends Component
{
    use WithPagination;

    // Conectado por el #[Modelable] del componente table
    public $list = [
        'search' => '',
        'sortField' => 'user',
        'sortDirection' => 'asc'
    ];

    public function render()
    {
        // Datos de ejemplo simulados 
        // Normalmente esto se cambia por $data = Access::query();
        $data = collect([
            ['id' => 1, 'user' => 'Juan', 'available' => 'juan@mail.com', 'max_projects' => 10, 'max_users' => 3],
            ['id' => 2, 'user' => 'Maria', 'available' => 'maria@mail.com', 'max_projects' => 10, 'max_users' => 5],
            ['id' => 3, 'user' => 'Carlos', 'available' => 'carlos@mail.com', 'max_projects' => 5, 'max_users' => 2],
            ['id' => 4, 'user' => 'Ana', 'available' => 'ana@mail.com', 'max_projects' => 12, 'max_users' => 4],
            ['id' => 5, 'user' => 'Pedro', 'available' => 'pedro@mail.com', 'max_projects' => 8, 'max_users' => 3],
            ['id' => 6, 'user' => 'Lucia', 'available' => 'lucia@mail.com', 'max_projects' => 2, 'max_users' => 1],
            ['id' => 7, 'user' => 'Miguel', 'available' => 'miguel@mail.com', 'max_projects' => 15, 'max_users' => 8],
        ]);

        // Buscador
        if (!empty($this->list['search'])) {
            $search = strtolower($this->list['search']);
            $data = $data->filter(function ($item) use ($search) {
                return str_contains(strtolower($item['user']), $search) ||
                    str_contains(strtolower($item['available']), $search);
            });
        }

        // Ordenamiento
        if (!empty($this->list['sortField'])) {
            if ($this->list['sortDirection'] === 'asc') {
                $data = $data->sortBy($this->list['sortField']);
            } else {
                $data = $data->sortByDesc($this->list['sortField']);
            }
        }

        // Paginación 
        $perPage = 3;
        $page = $this->getPage();
        $paginator = new \Illuminate\Pagination\LengthAwarePaginator(
            $data->forPage($page, $perPage),
            $data->count(),
            $perPage,
            $page,
            ['path' => \Illuminate\Pagination\Paginator::resolveCurrentPath()]
        );

        // Estructura de cabeceras asociativa (Title => database_field_name)
        $heads = [
            'Usuario' => 'user',
            'Disponible' => 'available',
            'Max. Projectos' => 'max_projects',
            'Max. Usuarios' => 'max_users',
            'Acciones' => null
        ];

        return view('livewire.access-table', [
            'data' => $paginator,
            'heads' => $heads
        ]);
    }
}
