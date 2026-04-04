<?php

namespace App\View\Components;

use Closure;
use Illuminate\Contracts\View\View;
use Illuminate\View\Component;

class confirmation extends Component
{
    public $title;
    public $message;
    public $confirmButtonText;
    public $cancelButtonText;
    public $type; // primary, danger, warning
    public $action; // url o route para enviar el formulario

    public function __construct(
        $title = 'Confirmación',
        $message = '¿Deseas continuar con esta acción?',
        $confirmButtonText = 'Confirmar',
        $cancelButtonText = 'Cancelar',
        $type = 'primary',
        $action = '#'
    ) {
        $this->title = $title;
        $this->message = $message;
        $this->confirmButtonText = $confirmButtonText;
        $this->cancelButtonText = $cancelButtonText;
        $this->type = $type;
        $this->action = $action;
    }
    public function render(): View|Closure|string
    {
        return view('components.confirmation');
    }
}
