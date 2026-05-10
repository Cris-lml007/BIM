<div>
    <div>
        <livewire:table :heads="$heads" wire:model.live="list">
            @foreach ($data as $item)
                <tr>
                    <td>{{ $item->title }}</td>
                    <td>{{ $item->created_at }}</td>
                    <td>{{ $item->is_active == 1 ? 'Activo' : 'Deshabilitado' }}</td>
                    <td>
                        <a wire:click="getAnchor({{ $item->id }})" data-bs-toggle="modal" data-bs-target="#modal-qr"
                            class="btn btn-sm btn-primary"><i class="fa fa-eye"></i></a>
                        <a href="" class="btn btn-sm btn-danger"><i class="fa fa-trash"></i></a>
                    </td>
                </tr>
            @endforeach
        </livewire:table>
    </div>

    @island
    <x-modal id="modal-qr" title="Anclaje Virtual" :project="$project->id">
            <livewire:app.anchor-form></livewire:app.anchor-form>
        </x-modal>
    @endisland
</div>
