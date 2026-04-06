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
            'Propietario' => 'email',
            'Creado' => 'created_at',
            'Estado' => null,
            'Opciones' => null
        ];
        $search = $this->list['search'];
        if($search != ''){
            $data = Project::where(function(Builder $builder){
                $builder->where('user_id',Auth::user()->id)
                        ->orWhereHas('members',function(Builder $builder){
                            $builder->where('user_id',Auth::user()->id);
                        });
            })->where(function(Builder $builder){
                $builder->where('name','like','%'.$this->list['search'].'%')
                        ->orWhere('created_at','like','%'.$this->list['search'].'%')
                        ->orWhereHas('owner',function (Builder $b){
                            $b->where('email','like','%'.$this->list['search'].'%');
                        });
            })->orderBy($this->list['sortField'],$this->list['sortDirection'])
              ->paginate();
        }else{
            $data = Project::where('user_id',Auth::user()->id)
                ->orWhereHas('members',function(Builder $builder){
                    $builder->where('user_id',Auth::user()->id);
                })->orderBy($this->list['sortField'],$this->list['sortDirection'])
                  ->paginate();
        }

        $this->is_avaliable = Auth::user()->canCreateProject();
        return view('livewire.app.projects-view',compact(['heads','data']));
    }
}
