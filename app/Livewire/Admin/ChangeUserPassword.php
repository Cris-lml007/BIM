<?php

namespace App\Livewire\Admin;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Livewire\Attributes\On;
use Livewire\Component;

class ChangeUserPassword extends Component
{
    public $user_id;
    public $password;
    public $password_confirmation;
    public $modal_name;

    public function mount($modal_name = 'modal-password')
    {
        $this->modal_name = $modal_name;
    }

    #[On('setUserId')]
    public function setUserId($id)
    {
        $this->user_id = is_array($id) ? $id['id'] : $id;
        $this->reset(['password', 'password_confirmation']);
        $this->resetValidation();
    }

    public function save()
    {
        $this->validate([
            'password' => ['required', 'string', Password::min(8)->mixedCase()->numbers()->symbols(), 'confirmed'],
        ]);

        $user = User::findOrFail($this->user_id);
        $user->password = Hash::make($this->password);
        $user->save();

        $this->reset(['password', 'password_confirmation']);
        $this->js("Swal.fire({icon:'success',title: 'Contraseña actualizada',confirmButtonText: 'Entendido'})");
        $this->js("$('#$this->modal_name').modal('hide')");
    }

    public function render()
    {
        return view('livewire.admin.change-user-password');
    }
}
