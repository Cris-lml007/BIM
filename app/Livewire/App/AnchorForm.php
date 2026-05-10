<?php

namespace App\Livewire\App;

use App\Models\Anchor;
use App\Models\Project;
use Livewire\Attributes\On;
use Livewire\Component;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class AnchorForm extends Component
{

    public $name;
    public $create_at;
    public $by;
    public $status;
    public $model;
    public $qr;
    public $model_id = '#';
    public $project_id = '#';

    #[On('getAnchor')]
    public function getAnchor($id){
        $a = Anchor::find($id);
        $this->name = $a->title;
        $this->by = $a->user->name;
        $this->model = $a->model->name;
        $this->model_id = $a->model_id;
        $this->create_at = $a->create_at;
        $this->qr =  "data:image/svg+xml;base64,".base64_encode(QrCode::generate($a->hash));
        $this->project_id = $a->model->project_id;
    }



    public function render()
    {
        return view('livewire.app.anchor-form');
    }
}
