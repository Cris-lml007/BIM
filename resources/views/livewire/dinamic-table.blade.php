<?php

use Livewire\Component;
use WithPagination;

new class extends Component {

    public $data = [];         // Datos a mostrar
    public $columns = [];      // Columnas detectadas
    public $search = '';       // Buscador
    public $perPage = 10;      // Filas por página
    public $sortColumn = null; // Columna para ordenar
    public $sortDirection = 'asc';

    protected $updatesQueryString = ['search', 'sortColumn', 'sortDirection', 'perPage'];
    public function mount($data)
    {
        $this->data = $data;

        // Detecta columnas automáticamente a partir de la primera fila
        if (!empty($data)) {
            $this->columns = array_keys((array) $data[0]);
        }
    }
    public function sortBy($column)
    {
        if ($this->sortColumn === $column) {
            $this->sortDirection = $this->sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            $this->sortColumn = $column;
            $this->sortDirection = 'asc';
        }
    }
};
?>

<div>
    {{-- You must be the change you wish to see in the world. - Mahatma Gandhi --}}
    <div class="card shadow-sm rounded-4">
        <div class="card-body">
            <div class="d-flex justify-content-between mb-3">
                <input type="text" class="form-control w-50" placeholder="Buscar..." wire:model.debounce.300ms="search">
                <select class="form-select w-auto" wire:model="perPage">
                    <option value="5">5 filas</option>
                    <option value="10">10 filas</option>
                    <option value="20">20 filas</option>
                </select>
            </div>

            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            @foreach($columns as $col)
                                <th wire:click="sortBy('{{ $col }}')" style="cursor: pointer;">
                                    {{ ucwords(str_replace('_', ' ', $col)) }}
                                    @if($sortColumn === $col)
                                        @if($sortDirection === 'asc') &uarr; @else &darr; @endif
                                    @endif
                                </th>
                            @endforeach
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($rows as $row)
                            <tr>
                                @foreach($columns as $col)
                                    <td>{{ $row[$col] }}</td>
                                @endforeach
                            </tr>
                        @empty
                            <tr>
                                <td colspan="{{ count($columns) }}" class="text-center text-secondary">No hay datos</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            {{-- Aquí puedes usar paginación real de Livewire si usas un Eloquent collection --}}
        </div>
    </div>
</div>