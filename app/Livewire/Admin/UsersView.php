<?php

namespace App\Livewire\Admin;

use App\Enum\RoleSaas;
use App\Models\User;
use Livewire\Component;

class UsersView extends Component
{

    public $actions = [
        'search' => '',
        'sortField' => 'id',
        'sortDirection' => 'asc'
    ];



    public function changeStatus(User $user){
        $user->is_active = !$user->is_active;
        $user->save();
    }


    public function render()
    {
        $heads = [
            'ID' => 'id',
            'Nombre' => 'name',
            'Organización' => 'organization',
            'Celular' => 'phone',
            'Email' => 'email',
            'Rol' => null,
            'Opciones' => null
        ];

        $search = $this->actions['search'];

        if($search != '' || $search != null){
            $data = User::where('id','like','%'.$search.'%')
                ->orWhere('name','like','%'.$search.'%')
                ->orWhere('organization','like','%'.$search.'%')
                ->orWhere('phone','like','%'.$search.'%')
                ->orWhere('email','like','%'.$search.'%')
                ->orderBy($this->actions['sortField'],$this->actions['sortDirection'])
                ->paginate();
        }else{
            $data = User::orderBy($this->actions['sortField'],$this->actions['sortDirection'])
                ->paginate();
        }

        $title = 'Nuevo Usuario';
        $roles = RoleSaas::cases();

        return view('livewire.admin.users-view',compact(['heads','data','title','roles']));
    }
}
