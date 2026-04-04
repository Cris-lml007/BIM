<div>
    <div class="row g-3 mb-3">
        <div class="col-md-4">
            <div class="card text-center bg-light shadow-sm rounded-4 py-3">
                <h3 class="fw-bold">{{ $actives }}</h3>
                <h6 class="mb-1 text-secondary">Usuarios Activos</h6>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card text-center bg-light shadow-sm rounded-4 py-3">
                <h3 class="fw-bold">{{ $blockeds }}</h3>
                <h6 class="mb-1 text-secondary">Usuarios Bloquados</h6>
            </div>
        </div>

        <div class="col-md-4">
            <div class="card text-center bg-light shadow-sm rounded-4 py-3">
                <h3 class="fw-bold">{{ $total }}</h3>
                <h6 class="mb-1 text-secondary">Total Usuarios</h6>
            </div>
        </div>
    </div>

    <x-card>
        <livewire:table :heads="$heads" wire:model.live="actions">
        @foreach ($data as $item)
        <tr wire:key="{{ $item->id }}">
            <td>{{ $item->id }}</td>
            <td>{{ $item->name }}</td>
            <td>{{ $item->organization }}</td>
            <td>{{ $item->phone }}</td>
            <td>{{ $item->email }}</td>
            <td>{{ __('messages.'.$item->role->name) }}</td>
            <td>
                <button class="btn btn-primary" wire:click="getUser({{ $item->id }})"><i class="nf nf-fa-eye"></i></button>
                <button wire:click="changeStatus({{ $item->id }})" @class(['btn','btn-success' => ($item->is_active == 1), 'btn-secondary' => ($item->is_active == 0)])>
                    <i @class(['nf','nf-fa-toggle_on' => ($item->is_active == 1),'nf-fa-toggle_off' => ($item->is_active == 0) ])></i>
                </button>
            </td>
        </tr>
        @endforeach
        <livewire:slot name="paginate">
        {{ $data->links() }}
        </livewire:slot>
        </livewire:table>
    </x-card>


    <x-modal id="modal-info" title="Usuario" class="modal-lg">
        <livewire:admin.users-form modal_name="modal-info">
        </livewire:admin.users-form>
    </x-modal>
</div>
