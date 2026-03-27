<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Model3D extends Model
{
    public $fillable = [
        'name',
        'description',
        'project_id',
        'user_id'
    ];
}
