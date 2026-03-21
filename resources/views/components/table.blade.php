<?php

use Livewire\Attributes\Modelable;
use Livewire\Component;

new class extends Component
{
    public $heads;

    // pass 3 variables: search, sort field, sort direction
    #[Modelable]
    public $list = [];

    public $search = '';

    public $sortField = null;

    public $sortDirection = 'asc';

    public function mount($heads){
        $this->heads = $heads;
        $this->sortField = $this->list['sortField'];
        $this->sortDirection = $this->list['sortDirection'];
    }

    public function sortBy($field){
        if($this->sortField == $field){
            $this->sortDirection = $this->sortDirection == 'asc' ? 'desc' : 'asc';
            $this->list['sortDirection'] = $this->sortDirection;
        }else{
            $this->sortField = $field;
            $this->sortDirection = 'asc';
            $this->list['sortField'] = $field;
            $this->list['sortDirection'] = 'asc';
        }
    }

    public function updatedSearch(){
        $this->list['search'] = $this->search;
    }

};
?>

<div>
    <div class="d-flex justify-content-end mb-3">
        <div class="d-flex justify-content-end w-50 align-items-center">
            <span class="me-1">Buscar:</span>
            <input wire:key="table-1" type="text" class="form-control w-50" placeholder="Ingrese texto" wire:model.live="search">
        </div>
    </div>
    <table class="table table-striped">
        <thead>
            @foreach ($heads as $label => $item)
            <th @if($item != null) style="cursor: pointer;" wire:click="sortBy('{{ $item }}')" @endif>
                <div class="d-flex justify-content-between align-items-center">
                    {{ $label }} @if($item != null) <i @class(['nf','nf-fa-arrow_down_a_z','nf-fa-arrow_down_z_a' => ($sortField == $item && $sortDirection == 'desc'),'text-secondary' => $sortField != $item, 'text-dark' => $sortField == $item])></i> @endif
                </div>
            </th>
            @endforeach
        </thead>
        <tbody>
            {{ $slot }}
        </tbody>
        <tfoot>
            {{ $slot['footer'] }}
        </tfoot>
    </table>
    <div class="d-flex justify-content-end">
        {{ $slot['paginate'] }}
    </div>
</div>
