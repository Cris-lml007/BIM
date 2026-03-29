<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Project;

class MembersController extends Controller
{
    public function show(Project $project)
    {
        return view('admin.project-members', ['project' => $project]);
    }
}
