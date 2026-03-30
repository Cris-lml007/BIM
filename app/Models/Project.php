<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{

    public $fillable = [
        'name',
        'description',
        'user_id'
    ];

    public function owner(){
        return $this->belongsTo(User::class,'user_id','id');
    }

    public function models(){
        return $this->hasMany(Model3D::class,'project_id','id');
    }
}
