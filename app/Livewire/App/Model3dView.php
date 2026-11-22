<?php

namespace App\Livewire\App;

use App\Models\Model3D;
use App\Models\Project;
use Illuminate\Support\Facades\Storage;
use Livewire\Component;

class Model3dView extends Component
{
    public Project $project;


    public function mount(Project $project){
        $this->project = $project;
    }


    public function removeModel($id)
    {
        $model = Model3D::with([
            'model',
            'anchors',
            'incidents.comments.attachments',
        ])->findOrFail($id);

        // Eliminar archivos del modelo 3D
        if ($model->model) {
            $attachment = $model->model;

            Storage::delete($attachment->path . '/' . $attachment->file);

            $fragment = substr($attachment->file, 0, -4) . '.frag';

            Storage::delete($attachment->path . '/' . $fragment);

            Storage::delete(
                $attachment->path . '/thumbnails/' . $attachment->id . '.png'
            );

            $attachment->delete();
        }

        // Eliminar anclajes
        $model->anchors()->delete();

        // Eliminar incidencias, comentarios y archivos adjuntos
        foreach ($model->incidents as $incident) {

            foreach ($incident->comments as $comment) {

                // Eliminar archivos físicos
                foreach ($comment->attachments as $attachment) {
                    Storage::delete($attachment->path);
                }

                // Eliminar registros de attachments
                $comment->attachments()->delete();

                // Eliminar comentario
                $comment->delete();
            }

            // Eliminar incidencia
            $incident->delete();
        }

        // Eliminar modelo 3D
        $model->delete();

        return $this->js(
            'Swal.fire({
            icon: "success",
            title: "Modelo borrado con éxito"
            })'
        );
    }


    public function render()
    {
        $data = $this->project->models()->paginate();

        return view('livewire.app.model3d-view',compact(['data']));
    }
}
