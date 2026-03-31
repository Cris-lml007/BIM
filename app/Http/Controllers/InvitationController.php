<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

use App\Models\ProjectInvitation;

class InvitationController extends Controller
{
    public function accept(string $token)
    {
        $invitation = ProjectInvitation::where('token', $token)
            ->where('expires_at', '>', now())
            ->first();


        if (!$invitation) {
            return redirect()->route('invitations.expired');
        }
        // Guardar token en sesión para usarlo después del registro
        session(['invitation_token' => $token]);
        session(['invitation_email' => $invitation->email]);
        session(['invitation_project' => $invitation->project_id]);

        // Redirigir al registro con email precargado
        return redirect()->route('register');
    }
}
