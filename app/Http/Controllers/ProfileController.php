<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ProfileController extends Controller
{
    /**
     * Show the profile/settings page.
     */
    public function show()
    {
        return view('profile.show');
    }

    public function changePassword()
    {
        return view('profile.password');
    }
}
