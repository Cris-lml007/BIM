<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Project;

class MembersController extends Controller
{
    public function show(Project $project)
    {
    return view('admin.project-members', ['project' => $project, 'roleMember' => $this->getRoleMember($project)]);
    }
    public function getRoleMember(Project $project)
    {
        $user = auth()->user();

        $userInProject = Project::roleMemberProject($user->id, $project->id);
        if ($userInProject ==  null) { //es el dueño
            $idOwnerProject = Project::where('user_id', $user->id)->selectRaw('user_id')->first();
            if ($idOwnerProject) {
                return 1; // 'owner';
            }
            return 0; //'no_member';            
        }
        //es invitado
        return $userInProject->role; 
    }

}
