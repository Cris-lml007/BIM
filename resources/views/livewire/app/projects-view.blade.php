<div>
    {{-- Smile, breathe, and go slowly. - Thich Nhat Hanh --}}
    <x-slot name="header">
        <h1>Mis Proyectos</h1>
        <button data-bs-toggle="modal" data-bs-target="#modal-project" class="btn btn-primary"><i class="fa fa-plus"></i>
            Añadir Nuevo Proyecto</button>
    </x-slot>


    <div class="container">
        <x-card>
            <livewire:table :heads="$heads" wire:model.live="list">
                <livewire:slot name="title">
                    <h4><strong><a href="{{ route('app.projects') }}">Proyectos</a></strong></h4>
                </livewire:slot>

                @foreach ($data as $item)
                    <tr>
                        <td>{{ $item->name }}</td>
                        <td>{{ $item->owner->email }}</td>
                        <td>{{ $item->created_at }}</td>
                        <td>{{ $item->is_active == 1 ? 'Activo' : 'Bloqueado' }}</td>
                        <td>
                            <a href="{{ route('app.project', $item->id) }}" class="btn btn-primary"><i
                                    class="nf nf-fa-eye"></i></a>
                        </td>
                    </tr>
                @endforeach
            </livewire:table>
        </x-card>
    </div>

    <x-modal id="modal-project" title="Nuevo Proyecto" class="modal-lg">
        <livewire:app.projects-form></livewire:app.projects-form>
    </x-modal>
</div>
