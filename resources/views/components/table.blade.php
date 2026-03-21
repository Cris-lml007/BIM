<?php

use Livewire\Attibutes\Modelable;
use Livewire\Component;

new class extends Component
{
    public $heads;

    #[Modelable]
    public $search = '';

    public function mount($heads){
        $this->heads = $heads;
    }
};
?>

<div>
    {{-- Walk as if you are kissing the Earth with your feet. - Thich Nhat Hanh --}}
    <div class="d-flex justify-content-end mb-3">
        <div class="d-flex justify-content-end w-50 align-items-center">
            <span class="me-1">Buscar:</span>
            <input type="text" class="form-control w-50" placeholder="Ingrese texto" wire:model.live="search">
        </div>
    </div>
    <table class="table table-striped">
        <thead>
            @foreach ($heads as $item)
                <th>{{ $item }}</th>
            @endforeach
        </thead>
        <tbody>
            {{ $slot }}
        </tbody>
        <tfoot>
            {{ $slot['footer'] }}
        </tfoot>
    </table>
</div>
