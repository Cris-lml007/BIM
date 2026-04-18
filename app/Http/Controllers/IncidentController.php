<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;

class IncidentController extends Controller
{
    public function show(Project $project)
    {

        return view('app.incident', ['project' => $project]);
    }
}
