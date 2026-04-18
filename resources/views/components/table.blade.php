<?php

use Livewire\Attributes\Modelable;
use Livewire\Component;

new class extends Component {
    public $heads;
    public $messageSearch;

    // pass 3 variables: search, sort field, sort direction

    #[Modelable]
    public $list = [];
    public $search = '';
    public $sortField = null;

    public $sortDirection = 'asc';
    public $icon;
    public $title;
    public $footer;
    public function mount($heads, $icon = '', $title = '', $footer = '', $messageSearch = 'Buscar...')
    {
        $this->icon = $icon;
        $this->title = $title;
        $this->footer = $footer;
        $this->heads = $heads;
        $this->messageSearch = $messageSearch;
        $this->sortField = $this->list['sortField'];
        $this->sortDirection = $this->list['sortDirection'];
    }

    public function sortBy($field)
    {
        if ($this->sortField == $field) {
            $this->sortDirection = $this->sortDirection == 'asc' ? 'desc' : 'asc';
            $this->list['sortDirection'] = $this->sortDirection;
        } else {
            $this->sortField = $field;
            $this->sortDirection = 'asc';
            $this->list['sortField'] = $field;
            $this->list['sortDirection'] = 'asc';
        }
    }

    public function updatedSearch()
    {
        $this->list['search'] = $this->search;
    }
};
?>

<div>
    <div class="card shadow-sm rounded-4 p-1">
        <div class="card-header border-0 bg-white pt-3">
            <div class="row g-2 align-items-center">
                <div class="col-md-8">
                    <h6 class="fw-bold mb-0">
                        <i class="{{ $icon }}"></i>
                        {{ $title }}
                    </h6>
                </div>
                <div class="col-md-4">
                    <div class="input-group input-group-sm">
                        <span class="input-group-text bg-light border-end-0">
                            <i class="fas fa-search text-muted"></i>
                        </span>
                        <input type="text" wire:model.live="search" class="form-control border-start-0 bg-light"
                            placeholder="{{ $messageSearch }}">
                    </div>
                </div>
            </div>
        </div>

        <div class="card-body p-0">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        @foreach ($heads as $label => $item)
                            <th style="cursor:pointer;" class="user-select-none"
                                @if ($item != null) style="cursor: pointer;" wire:click="sortBy('{{ $item }}')" @endif>
                                <div class="d-flex justify-content-between align-items-center">
                                    {{ $label }} @if ($item != null)
                                        <i @class([
                                        
                                            'fas',
                                            'fa-sort',
                                            'fa-sort' => $sortField == $item && $sortDirection == 'desc',
                                            'text-secondary' => $sortField != $item,
                                            'text-dark' => $sortField == $item,
                                        ])></i>
                                    @endif
                                </div>
                            </th>
                        @endforeach
                    </thead>

                    <tbody>
                        {{ $slot }}
                    </tbody>
                </table>
            </div>

            <div class="px-3 py-2 border-top">
                <small class="text-muted">
                    {{ $footer }}

                </small>
            </div>
        </div>
        <div class="d-flex justify-content-end">
            {{ $slot['paginate'] }}
        </div>
    </div>

</div>
