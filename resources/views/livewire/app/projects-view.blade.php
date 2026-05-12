<div>
    {{-- Smile, breathe, and go slowly. - Thich Nhat Hanh --}}
    <x-slot name="header">
        <h1>Mis Proyectos</h1>
        <button data-bs-toggle="modal" data-bs-target="#modal-project" class="btn btn-primary"><i class="fa fa-plus"></i>
            Nuevo Proyecto</button>
    </x-slot>



    <div class="container">
        <livewire:table :heads="$heads" wire:model.live="list" title="Mis Proyectos"
            icon="fas fa-folder-open text-primary" message-search="Buscar Proyecto...">
            @foreach ($data as $item)
                <tr>
                    <td>{{ Str::upper($item->name) }}</td>
                    <td>
                        @if (strlen($item->description) < 15)
                            {{ $item->description }}
                        @else
                            {{ substr($item->description, 0, 15) }}...
                        @endif
                    </td>
                    <td>
                        {{ $item->created_at->translatedFormat('d M Y - H:i') }}</td>

                    </td>

                    <td>
                        <span class="badge {{ $item->is_active == 1 ? 'bg-success' : 'bg-danger' }} text-white">
                            {{ $item->is_active == 1 ? 'Activo' : 'Bloqueado' }}

                        </span>
                    </td>
                    @if ($showOptions)
                        <td class="text-center">
                            <a href="{{ route('app.project', $item->id) }}" class="btn btn-sm btn-primary"><i
                                    class="nf nf-fa-eye"></i></a>

                            <button wire:click="changeState({{ $item->id }})"
                                class="btn btn-sm {{ $item->is_active ? 'btn-success' : 'btn-danger' }}">
                                <i class="{{ $item->is_active ? 'nf nf-fa-unlock' : 'nf nf-fa-lock' }}"></i>
                            </button>

                            <button wire:click="edit({{ $item->id }})" class="btn btn-sm btn-warning">
                                <i class="fas fa-edit"></i>
                            </button>


                            <button wire:click="confirmDelete({{ $item->id }})" class="btn btn-sm btn-danger">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    @endif

                </tr>
            @endforeach
        </livewire:table>
    </div>


    <x-modal id="modal-project" title="Proyecto" class="modal-md">
        <livewire:app.projects-form wire:key="projects-form"></livewire:app.projects-form>
    </x-modal>
</div>
