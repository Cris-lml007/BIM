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
            'phone' => ['nullable', 'string', 'max:255'],
        ]);

        $user->forceFill($validated)->save();

        session()->flash('status', 'profile-information-updated');
    }

    public function render()
    {
        return view('livewire.profile.update-profile-information');
    }
}
