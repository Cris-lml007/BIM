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

    public function members()
    {
        return $this->belongsToMany(User::class, 'project_user')
                    ->withPivot('role')
                    ->withTimestamps();
    }
}
