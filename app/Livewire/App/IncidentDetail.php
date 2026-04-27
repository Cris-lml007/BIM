<?php

namespace App\Livewire\App;

use App\Models\incident;
use Livewire\Attributes\On;
use Livewire\Component;
use Livewire\WithFileUploads;
use Str;
class IncidentDetail extends Component
{
     use WithFileUploads;
    public $comment;
    public $image;
    public $project;
    public $incident = [
        'title' => null,
        'description' => null,
        'priority' => null,
        'status' => null,
        'created_at' => null
    ];
    public function mount($project){
        $this->project = $project;

    }

    public function render()
    {
        return view('livewire.app.incident-detail');
    }
    #[On('getIncident')]
    public function getIncident($id){
        $this->incident = Incident::with([
            'comments' => function ($query) {
                $query->with(['user', 'attachments'])
                    ->orderBy('created_at', 'asc');
            }
        ])->find($id);
        $this->dispatch('scroll-bottom');

    }
    public function statusIncident($id){
        $incident = incident::find($id);
        $incident->status = $incident->status === 1 ? 0 : 1;
        $incident->save();
        $this->getIncident($id);
        $this->js("
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Estado de la incidencia actualizado',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
        ");
    }
    public function addComment($id)
{
    $this->validate([
        'comment' => 'nullable|string|max:255|required_without:image',
        'image'   => 'nullable|image|max:2048|required_without:comment',
    ]);

    $incident = Incident::find($id);

    $comment = $incident->comments()->create([
        'user_id' => auth()->id(),
        'comment' => $this->comment."",
    ]);

    if ($this->image) {

        $directory = "projects/" . $this->project->id . "/attachments";

        $extension = $this->image->getClientOriginalExtension();
        $fileName = Str::uuid() . '.' . $extension;

        $path = $this->image->storeAs($directory, $fileName, 'local');

        $comment->attachments()->create([
            'name' => $this->image->getClientOriginalName(),
            'file' => $fileName, 
            'type' => $this->image->getClientMimeType(),
            'path' => $path,
        ]);
    }

    $this->comment = '';
    $this->image = null;

    $this->getIncident($id);
    $this->dispatch('scroll-bottom');
}
    public function removeImage(){
        $this->image = null;
    }
}
