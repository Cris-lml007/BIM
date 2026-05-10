<?php

namespace App\Livewire\App;

use App\Models\Anchor;
use App\Models\Project;
use Livewire\Component;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class AnchorsView extends Component
{

    public $list = [
        'search' => '',
        'sortField' => 'id',
        'sortDirection' => 'asc'
    ];

    public Project $project;

    public function mount(Project $project){
        $this->project = $project;
    }

    public function getAnchor($id){
        $this->dispatch('getAnchor',$id)->to(AnchorForm::class);
    }


    public function render()
    {
        $heads = [
            'Nombre' => 'name',
            'Creado' => 'created_at',
            'Estado' => null,
            'Opciones' => null
        ];
        $data = Anchor::all();
        return view('livewire.app.anchors-view',compact(['heads','data']));
    }
}
