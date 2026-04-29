<?php

namespace App\Livewire\Admin;

use App\Models\Access;
use App\Models\Project;
use App\Models\User;
use Illuminate\Console\Contracts\NewLineAware;
use Livewire\Attributes\On;
use Livewire\Component;

class AccessFormUpdate extends Component
{
    public $user;
    public $user_id;
    public $max_projects;
    public $max_space;
    public $unit_space = [
        1 => 'MB',
        2 => 'GB'
    ];
    public $unit = 1;
    public $max_users;
    public $is_active = true;
    public $available;
    public $available_end;
    public Access $access;

    public $modal_name = null;

    public function mount($modal_name = null, $id = null)
    {

        $this->available = now()->format('Y-m-d');
        $this->modal_name = $modal_name;
        if ($id && ($access = Access::find($id))) {
            $this->setAccess($access);
        } else {
            $this->access = new Access();
        }
    }

    #[On('getAccess')]
    public function getAccess($id)
    {
        $access = Access::find($id);
        $this->setAccess($access);
    }

    private function setAccess(Access $access)
    {
        $this->access = $access;
        $this->user_id = $access->user_id;
        $this->user = User::find($access->user_id);
       
        $this->max_projects = $access->max_projects;
        $this->max_users = $access->max_users;
        $this->max_space = $access->max_storage;

        $this->is_active = $access->is_active;
        $this->available = $access->available ? date('Y-m-d', strtotime($access->available)) : null;
        $this->available_end = $access->available_end ? date('Y-m-d', strtotime($access->available_end)) : null;
    }

    public function save()
    {
        $this->validate([
            'user_id' => 'required|exists:users,id',
            'max_projects' => 'required|integer|min:1',
            'max_users' => 'required|integer|min:1',
            'max_space' => 'required|integer|min:1',
            'unit' => 'required|integer',
            'is_active' => 'required|boolean',
            'available_end' => 'required|date|after_or_equal:available',
        ]);
    
        if( ($this->max_projects < $this->access->max_projects) || ($this->max_users < $this->access->max_users) || ($this->max_space < $this->access->max_storage))
        {           
            $projects = Project::where('user_id', $this->access->user_id)
                ->withCount(['members', 'invitations'])
                ->with('documents')
                ->get();
            
            $totalProjectsActual = $projects->count();
                
            if($this->max_projects < $totalProjectsActual){
                $this->js("
                    Swal.fire({
                        icon: 'error',
                        title: 'No se puede reducir el límite',
                        html: 'El usuario tiene <b>$totalProjectsActual</b> proyectos actualmente.',
                        confirmButtonText: 'Entendido'
                    });
                ");
                return;
            }
            
            $totalUsers = $projects->sum('members_count') + $projects->sum('invitations_count');
            if($this->max_users < $totalUsers/$totalProjectsActual){
                $this->js("
                    Swal.fire({
                        icon: 'error',
                        title: 'No se puede reducir el límite',
                        html: 'El usuario ya tiene mas invitados actualmente.',
                        confirmButtonText: 'Entendido'
                    });
                ");
                return;
            }

            $totalStorageUsed = $projects->flatMap->documents->sum('size');
            if($this->unit == 1){
                $totalStorageUsedMB = $totalStorageUsed / 1024 / 1024;
                if($this->max_space < $totalStorageUsedMB / $totalProjectsActual){
                    $totalStorageUsed = round($totalStorageUsedMB, 2);
                    $this->js("
                        Swal.fire({
                            icon: 'error',
                            title: 'No se puede reducir el límite',
                            html: 'El usuario está utilizando actualmente $totalStorageUsed MB.',
                            confirmButtonText: 'Entendido'
                        });
                    ");
                return;
                }
            }else if($this->unit == 2){
                $totalStorageUsedMB = $totalStorageUsed / 1024 / 1024;
                if($this->max_space*1024 < $totalStorageUsedMB / $totalProjectsActual){
                    $totalStorageUsed = round($totalStorageUsedMB, 2);
                    $this->js("
                        Swal.fire({
                            icon: 'error',
                            title: 'No se puede reducir el límite',
                            html: 'El usuario está utilizando actualmente $totalStorageUsed MB.',
                            confirmButtonText: 'Entendido'
                        });
                    ");
                return;
                }            
            }
            
        }

        $this->access->max_projects = $this->max_projects;

        $this->access->max_users = $this->max_users;
        $this->access->available = $this->available;
        $this->access->available_end = $this->available_end;
            
        $this->access->max_storage = $this->unit == 1
            ? round($this->max_space, 1) // MB
            : round($this->max_space * 1024, 1); // GB → MB

        $this->access->save();
        $this->dispatch( 'updateAccess')->to('admin.access-view');
        
        $this->resetForm();
        $this->js('closeModal');
    }

    public function render()
    {
        return view('livewire.admin.access-form-update');
    }
    public function resetForm()
    {
        $this->access = new Access();
        $this->reset(['user_id', 'max_projects', 'max_users', 'max_space', 'unit', 'is_active', 'available', 'available_end']);
        $this->unit = 1;
        $this->available = now()->format('Y-m-d');
        $this->is_active = true;
    }

}
