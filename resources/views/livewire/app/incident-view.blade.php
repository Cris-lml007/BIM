<div>
    <div class="row g-3 mb-3">

        <div class="col-md-4">
            <div class="card text-center shadow-sm rounded-4 py-3 border-start border-1">
                <h3 class="fw-bold text-danger">{{ $stats['abiertas'] }}</h3>
                <h6 class="mb-1 text-secondary">Incidencias Abiertas</h6>
            </div>
        </div>

        <div class="col-md-4">
            <div class="card text-center shadow-sm rounded-4 py-3 border-start border-1">
                <h3 class="fw-bold text-success">{{ $stats['cerradas'] }}</h3>
                <h6 class="mb-1 text-secondary">Cerradas</h6>
            </div>
        </div>

        <div class="col-md-4">
            <div class="card text-center shadow-sm rounded-4 py-3 border-start border-1">
                <h3 class="fw-bold text-dark">{{ $stats['criticas'] }}</h3>
                <h6 class="mb-1 text-secondary">Críticas</h6>
            </div>
        </div>

    </div>

    <livewire:table :heads="$heads" wire:model.live="actions" icon="nf nf-cod-issue_reopened text-primary"
        title="Incidentes">
        @foreach ($incidents as $item)
            <tr wire:key="{{ $item->id }}">
                <td>{{ $item->id }}</td>
                <td>{{ $item->title }}</td>


                <td>
                    <span @class([
                        'badge',
                        'bg-success' => $item->priority === 1,
                        'bg-warning' => $item->priority === 2,
                        'bg-danger' => $item->priority === 3,
                    ])>
                        {{ $item->priority === 1 ? 'Baja' : ($item->priority === 2 ? 'Media' : 'Alta') }}
                    </span>
                </td>
                <td>
                    <span @class([
                        'badge',
                        'bg-success' => $item->status === 1,
                        'bg-danger' => $item->status === 0,
                    ])>
                        {{ $item->status === 1 ? 'Abierta' : 'Cerrada' }}

                </td>
                <td>
                    {{ \Carbon\Carbon::parse($item->created_at)->translatedFormat('d M Y : H:m:s') }}

                </td>

                <td>
                    <button class="btn btn-sm btn-primary" wire:click="getIncident({{ $item->id }})">
                        <i class="nf nf-fa-eye"></i>
                    </button>
                    <button wire:click="delete({{ $item->id }})" class="btn btn-sm btn-danger">
                        <i class='nf nf-fa-trash'></i>
                    </button>
                </td>
            </tr>
        @endforeach
        <x-slot name="paginate">
        </x-slot>
    </livewire:table>

    <x-modal id="modal-incident-detail" title="Detalles de la incidencia" class="modal-lg">
        <livewire:app.incident-detail modal_name="modal-incident-detail" :project="$project" />
    </x-modal>
</div>
