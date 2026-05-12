<?php

namespace App\Livewire\App;

use App\Models\Project;
use App\Models\Document;
use App\Models\Model3D;
use App\Models\Anchor;
use App\Models\incident;
use App\Models\Comment;
use App\Models\ProjectMembership;
use App\Models\ProjectMembershipHistory;
use App\Models\ProjectInvitation;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Livewire\Attributes\On;
use Livewire\Component;

class ProjectsView extends Component
{

    public $is_avaliable = false;
    public $showOptions = true;
    

    public $list = [
        'search' => '',
        'sortField' => 'name',
        'sortDirection' => 'asc'
    ];


    #[On('refresh')]
    public function render()
    {
        $heads = [
            'Nombre' => 'name',
            'Descripción' => 'description',
            'Creado' => 'created_at',
            'Estado' => null,
        ];
        
        if ($this->showOptions) {
            $heads['Opciones'] = null;
        }
        $search = $this->list['search'];
        if ($search != '') {
            $data = Project::where(function (Builder $builder) {
                $builder->where('user_id', Auth::user()->id)
                    ->orWhereHas('members', function (Builder $builder) {
                        $builder->where('user_id', Auth::user()->id);
                    });
            })->where(function (Builder $builder) {
                $builder->where('name', 'like', '%' . $this->list['search'] . '%')
                    ->orWhere('created_at', 'like', '%' . $this->list['search'] . '%')
                    ->orWhereHas('owner', function (Builder $b) {
                        $b->where('email', 'like', '%' . $this->list['search'] . '%');
                    });
            })->orderBy($this->list['sortField'], $this->list['sortDirection'])
                ->paginate();
        } else {
            $data = Project::where('user_id', Auth::user()->id)
                ->orWhereHas('members', function (Builder $builder) {
                    $builder->where('user_id', Auth::user()->id);
                })->orderBy($this->list['sortField'], $this->list['sortDirection'])
                ->paginate();
        }

        $this->is_avaliable = Auth::user()->canCreateProject();
        
        return view('livewire.app.projects-view', compact(['heads', 'data']));
    }

    public function changeState($id)
    {
        $project = Project::find($id);
        if (!$project)
            return;

        $project->is_active = !$project->is_active;
        $project->save();

        
        $this->js("
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'info',
                title: 'Estado del proyecto actualizado',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
        ");
     
        
    }

    public function edit($id)
    {
        $this->dispatch('editProject', id: $id)->to(ProjectsForm::class);
        $this->js("$('#modal-project').modal('show')");
    }

    public function confirmDelete($id)
    {
        $this->js("
            Swal.fire({
                title: '¿Está seguro?',
                text: 'No podrá recuperar este proyecto!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, eliminar!',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    Livewire.dispatch('deleteConfirmed', { id: $id });
                }
            });
        ");
    }

    #[On('deleteConfirmed')]
    public function deleteConfirmed($id)
    {
        $project = Project::find($id);
        
        if (!$project) {
            $this->js("
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: 'Proyecto no encontrado',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
            ");
            return;
        }

        // Usar transacción para asegurar integridad de datos
        DB::transaction(function () use ($project) {
            // 1. Eliminar documentos y sus archivos
            Document::where('project_id', $project->id)->each(function ($document) {
                // Eliminar el archivo físico si existe
                if (file_exists(storage_path($document->path))) {
                    unlink(storage_path($document->path));
                }
                $document->delete();
            });

            // 2. Eliminar anclajes virtuales (a través de modelos 3D)
            $models = Model3D::where('project_id', $project->id)->get();
            foreach ($models as $model) {
                Anchor::where('model_id', $model->id)->delete();
                $model->delete();
            }

            // 3. Eliminar comentarios e incidencias
            $incidents = incident::where('project_id', $project->id)->get();
            foreach ($incidents as $incident) {
                Comment::where('incident_id', $incident->id)->delete();
                $incident->delete();
            }

            // 4. Eliminar miembros del proyecto
            ProjectMembership::where('project_id', $project->id)->delete();

            // 5. Eliminar historial de membresías
            ProjectMembershipHistory::where('project_id', $project->id)->delete();

            // 6. Eliminar invitaciones del proyecto
            ProjectInvitation::where('project_id', $project->id)->delete();

            // 7. Finalmente, eliminar el proyecto
            $project->delete();
        });

        $this->js("
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Proyecto y todas sus dependencias eliminadas',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
        ");

        $this->dispatch('refresh')->to(ProjectsView::class);
    }

    public $expanded = [];

}
