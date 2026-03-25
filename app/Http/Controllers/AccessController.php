<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AccessController extends Controller
{
    public function show()
    {
        return view('admin.access-view');
    }
}
