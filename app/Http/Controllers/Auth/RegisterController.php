<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Foundation\Auth\RegistersUsers;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\ProjectInvitation;
class RegisterController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Register Controller
    |--------------------------------------------------------------------------
    |
    | This controller handles the registration of new users as well as their
    | validation and creation. By default this controller uses a trait to
    | provide this functionality without requiring any additional code.
    |
    */

    use RegistersUsers;

    /**
     * Where to redirect users after registration.
     *
     * @var string
     */
    protected $redirectTo = '/home';

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('guest');
    }

    /**
     * Get a validator for an incoming registration request.
     *
     * @return \Illuminate\Contracts\Validation\Validator
     */
    protected function validator(array $data)
    {
        return Validator::make($data, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'phone' => ['required', 'string', 'min:8'],
            'organization' => ['required', 'string']
        ]);
    }

    /**
     * Create a new user instance after a valid registration.
     *
     * @return User
     */
    protected function create(array $data)
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'phone' => $data['phone'],
            'organization' => $data['organization']
        ]);

        // 👇 Aquí enganchamos la invitación
        if (session('invitation_token')) {
            $invitation = ProjectInvitation::where('token', session('invitation_token'))
                ->where('status', 'pending')
                ->where('email', $user->email) // seguridad: email debe coincidir
                ->first();

            if ($invitation && !$invitation->isExpired()) {
                $invitation->project->members()->syncWithoutDetaching([
                    $user->id => ['role' => $invitation->role]
                ]);

                $invitation->update(['status' => 'accepted']);
                session()->forget('invitation_token');

                // Redirigir al proyecto después del registro
                $this->redirectTo = route('projects.show', $invitation->project_id);
            }
        }
        return $user;
    }
}
