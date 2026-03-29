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
            ->where('status', 'pending')
            ->firstOrFail();

        if ($invitation->isExpired()) {
            $invitation->update(['status' => 'expired']);
            abort(410, 'La invitación ha expirado.');
        }

        // ¿Ya tiene cuenta?
        $user = User::where('email', $invitation->email)->first();

        if ($user) {
            // Caso A: ya tiene cuenta → unirlo directo
            Auth::login($user);

            $invitation->project->members()->syncWithoutDetaching([
                $user->id => ['role' => $invitation->role]
            ]);

            $invitation->update(['status' => 'accepted']);

            return redirect()->route('projects.show', $invitation->project_id)
                ->with('success', '¡Bienvenido al proyecto!');
        }

        // Caso B: no tiene cuenta → mandarlo a registro con token en sesión
        session(['invitation_token' => $token]);

        return redirect()->route('register')
            ->with('info', 'Crea tu cuenta para unirte al proyecto.');
    }
}
