<div>
    <livewire:table :heads="$heads" wire:model.live="actions">
    @foreach ($data as $item)
    <tr wire:key="{{$item->id}}">
        <td>{{ $item->id }}</td>
        <td>{{ $item->name }}</td>
        <td>{{ $item->organization }}</td>
        <td>{{ $item->phone }}</td>
        <td>{{ $item->email }}</td>
        <td></td>
    </tr>
    @endforeach
    <livewire:slot name="paginate">
        {{ $data->links() }}
    </livewire:slot>
    </livewire:table>
</div>
