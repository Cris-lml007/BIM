<?php

namespace App\Livewire\Admin;

use App\Enum\RoleSaas;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Livewire\Attributes\On;
use Livewire\Component;

class UsersForm extends Component
{

    public $name;
    public $email;
    public $phone;
    public $role;
    public $status;
    public $organization;
    public $password;
    public $password_confirmation;
    public User $user;

    public $page = false;
    public $modal_name = null;

    public function mount($modal_name = null,$id = null){
        $this->modal_name = $modal_name;
        if(User::find($id) != null){
            $this->user = User::find($id);
            $this->name = $this->user->name;
            $this->email = $this->user->email;
            $this->phone = $this->user->phone;
            $this->role = $this->user->role;
            $this->status = $this->user->is_active;
            $this->organization = $this->user->organization;

            $this->page = true;
        }else{
            $this->user = new User();
        }
    }

    #[On('getUser')]
    public function getUser($id){
        if(User::find($id) != null){
            $this->user = User::find($id);
            $this->name = $this->user->name;
            $this->email = $this->user->email;
            $this->phone = $this->user->phone;
            $this->role = $this->user->role;
            $this->status = $this->user->is_active;
            $this->organization = $this->user->organization;
        }else{
            $this->user = new User();
        }
    }

    public function generatePassword(){
        $this->password = Str::password(12);
        $this->js("navigator.clipboard.writeText(" . json_encode($this->password) . ").then(() => {Swal.fire({title:'Contraseña copiada',icon:'info'});});");
    }

    public function updatedPassword(){
        $this->validate([
            'password' => [ Password::min(8)->mixedCase()->numbers()->symbols(), 'confirmed']
        ]);
    }

    public function updatedPasswordConfirmation(){
        if($this->password != ''){
            $this->validate([
                'password' => [ Password::min(8)->mixedCase()->numbers()->symbols(), 'confirmed']
            ]);

        }else{
            $this->resetValidation('password');
        }
    }


    public function save(){

        $this->validate([
            'name' => 'required|string',
            'email' => ['required','email',Rule::unique('users','email')->ignore($this->user->id ?? null)],
            'phone' => 'required|integer|min_digits:8',
            'role' => ['required', Rule::enum(RoleSaas::class)],
            'status' => ['required','boolean'],
            'password' => [ Password::min(8)->mixedCase()->numbers()->symbols(), 'confirmed']
        ]);

        $this->user->name = $this->name;
        $this->user->email = $this->email;
        $this->user->phone = $this->phone;
        $this->user->role = $this->role;
        $this->user->is_active = $this->status;
        $this->user->organization = $this->organization;
        $this->user->password = $this->password;

        $id = $this->user->id;
        $this->user->save();

        if($id == null || !$this->page){
            if($id == null){
                $text = 'Usuario Creado';
            }else{
                $text = 'Usuario Actualizado';
            }
            $this->user = new User();
            $id = null;
            $this->js('closeModal');
            $this->js("Swal.fire({icon:'success',title: '$text',confirmButtonText: 'Entendido'})");
        }else{
            return $this->redirect(route('administration.users'));
        }
    }

    public function remove(){
    }

    public function render()
    {
        $roles = RoleSaas::cases();
        return view('livewire.admin.users-form',compact('roles'));
    }
}
