<?php

use Livewire\Component;

new class extends Component {
    public $open = false;
    public $view = null;
    public $data = [];
    public $title = '';
    public $textBtnSave = 'Guardar';
    public $isSave = false;
    protected $listeners = ['openModal', 'closeModal'];

    public function openModal($view, $data = [], $title = '', $textBtnSave = '', $isSave = false)
    {
        $this->view = $view;
        $this->data = $data;
        $this->title = $title;
        $this->open = true;
        $this->textBtnSave = $textBtnSave;
        $this->isSave = $isSave;
    }
    public function closeModal()
    {
        $this->reset(['open', 'view', 'data', 'title']);
    }
};
?>

<div>

    @if($open)
        <!-- Fondo -->
        <div class="modal-backdrop fade show"></div>

        <!-- Modal -->
        <div class="modal d-block" tabindex="-1" wire:keydown.escape="closeModal">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">

                    <!-- Header -->
                    <div class="modal-header p-3">
                        <h5 class="modal-title">
                            {{ $title }}
                        </h5>
                        <button class="btn-close" wire:click="closeModal"></button>
                    </div>

                    <!-- Body dinámico -->
                    <div class="modal-body p-5">
                        @if($view)
                            @include($view, $data)
                        @endif
                    </div>

                    <!-- Footer opcional -->
                    <div class="modal-footer">
                        <x-button type="secondary" wire:click="closeModal">
                            Cerrar
                        </x-button>
                        @if($isSave)
                            <x-button type="primary">
                                {{ $textBtnSave }}
                            </x-button>
                        @endif
                    </div>

                </div>
            </div>
        </div>
    @endif
</div>