<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AdministrationController extends Controller
{
    public function users(){
        return view('admin.users-view');
    }
}
