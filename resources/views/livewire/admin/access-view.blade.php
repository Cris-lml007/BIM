<div>
    <div class="row g-3 mb-3">
        <div class="col-md-4">
            <div class="card text-center bg-light shadow-sm rounded-4 py-3">
                <h3 class="fw-bold">{{ $actives }}</h3>
                <h6 class="mb-1 text-secondary">Accesos Activos</h6>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card text-center bg-light shadow-sm rounded-4 py-3">
                <h3 class="fw-bold">{{ $blockeds }}</h3>
                <h6 class="mb-1 text-secondary">Accesos Bloqueados</h6>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card text-center bg-light shadow-sm rounded-4 py-3">
                <h3 class="fw-bold">{{ $total }}</h3>
                <h6 class="mb-1 text-secondary">Total Accesos</h6>
            </div>
        </div>
    </div>

    <x-card>

        <livewire:table :heads="$heads" wire:model.live="actions">
            @foreach ($accesses as $item)
                <tr wire:key="{{ $item->id }}">
                    <td>{{ $item->id }}</td>
                    <td>{{ $item->user->name }} <br><small class="text-muted">{{ $item->user->email }}</small></td>
                    <td>{{ $item->max_projects }}</td>
                    <td>{{ $item->max_users }}</td>
                    <td>{{ $item->available }}</td>
                    <td>{{ $item->available_end }}</td>
                    <td>
                        <span @class(['badge', 'bg-success' => $item->is_active, 'bg-danger' => !$item->is_active])>
                            {{ $item->is_active ? 'Activo' : 'Inactivo' }}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-info" wire:click="getAccess({{ $item->id }})">
                            <i class="nf nf-fa-eye"></i>
                        </button>
                        <button wire:click="changeStatus({{ $item->id }})" @class(['btn btn-sm', 'btn-success' => $item->is_active, 'btn-secondary' => !$item->is_active])>
                            <i @class(['nf', 'nf-fa-toggle_on' => $item->is_active, 'nf-fa-toggle_off' => !$item->is_active])></i>
                        </button>
                    </td>
                </tr>
            @endforeach
            <x-slot name="paginate">
            </x-slot>
        </livewire:table>
    </x-card>

    <x-modal id="modal-access" title="Gestión de Acceso" class="modal-lg">
        <livewire:admin.access-form modal_name="modal-access" />
    </x-modal>
</div>