<?php

namespace App\View\Components;

use Closure;
use Illuminate\Contracts\View\View;
use Illuminate\View\Component;

class Button extends Component
{
    public $type;
    public $size;
    /**
     * Create a new component instance.
     */
    public function __construct($type = 'primary', $size = 'md')
    {
        $this->type = $type;
        $this->size = $size;
    }
    /**
     * Get the view / contents that represent the component.
     */
    public function render()
    {
        return view('components.button');
    }
}
