<?php

namespace App\Livewire\App;

use App\Models\Project;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
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
        Project::destroy($id);
        $this->js("
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Proyecto eliminado',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
        ");
        $this->dispatch('refresh')->to(ProjectsView::class);
    }

    public $expanded = [];

}
