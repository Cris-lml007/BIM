<div>
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

    <x-modal id="modal-info" title="Usuario" class="modal-lg">
        <livewire:admin.users-form modal_name="modal-info">
        </livewire:admin.users-form>
    </x-modal>
</div>
