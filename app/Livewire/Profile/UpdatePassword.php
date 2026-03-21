<?php

namespace App\Livewire\Profile;

use Livewire\Component;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;

class UpdatePassword extends Component
{
    public $current_password;
    public $password;
    public $password_confirmation;

    public function updatePassword()
    {
        $validated = $this->validate([
            'current_password' => ['required', 'string', 'current_password'],
            'password' => ['required', 'string', Password::defaults(), 'confirmed'],
        ]);

        $user = Auth::user();

        $user->forceFill([
            'password' => Hash::make($validated['password']),
        ])->save();

        $this->reset(['current_password', 'password', 'password_confirmation']);

        session()->flash('status', 'password-updated');
    }

    public function render()
    {
        return view('livewire.profile.update-password');
    }
}
