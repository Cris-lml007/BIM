<div class="card">
    <div class="card-body">
        <livewire:table :messageSearch="'Buscar acceso'" :data="$data" :heads="$heads" wire:model.live="list">
            @foreach ($data as $item)
                <tr>
                    <td>{{ $item['user'] }}</td>
                    <td>{{ $item['available'] }}</td>
                    <td>{{ $item['max_projects'] }}</td>
                    <td>{{ $item['max_users'] }}</td>
                    <td class="d-flex gap-2">
                        <x-button type="primary" size="sm" onclick="Livewire.dispatch('openModal', {
                                                    view: 'access.modals.access-view',
                                                    data: {},
                                                    title: 'Información del acceso',
                                                    })" type="primary"><i class="fas fa-eye"></i>
                        </x-button>

                        <x-button type="secondary" size="sm"><i class="fas fa-edit"></i></x-button>
                        <x-button type="tertiary" size="sm" data-bs-toggle="modal" data-bs-target="#confirmationModal"><i
                                class="fas fa-lock"></i></x-button>
                    </td>
                </tr>
            @endforeach

            <x-slot name="paginate">
                <div class="mt-3">

                </div>
            </x-slot>
        </livewire:table>
    </div>
</div>