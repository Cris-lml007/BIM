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
            @php
            @endphp
            <a class="btn btn-primary" href="{{ route('administration.users.form',$item->id) }}"><i class="nf nf-fa-eye"></i></a>
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
</div>
