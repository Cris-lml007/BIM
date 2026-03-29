<?php

use App\Models\Model3D;
use Livewire\Component;

new class extends Component
{

    public Model3D $model;

    public function mount($id){
        $this->model = Model3D::find($id);
    }
};
