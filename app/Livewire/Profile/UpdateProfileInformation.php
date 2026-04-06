<?php

namespace App\Livewire\Profile;

use Livewire\Component;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;

class UpdateProfileInformation extends Component
{
    public $name;
    public $email;
    public $phone;
    public $organization;

    public function mount()
    {
        $user = Auth::user();
        $this->name = $user->name;
        $this->email = $user->email;
        $this->phone = $user->phone;
        $this->organization = $user->organization;
    }

    public function updateProfileInformation()
    {
        $user = Auth::user();

        $validated = $this->validate([
            'phone' => ['required', 'numeric', 'digits:8'],
        ]);
        $user->forceFill($validated)->save();

        $this->js("
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Actualizado',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
        ");
    }

    public function render()
    {
        return view('livewire.profile.update-profile-information');
    }
}
