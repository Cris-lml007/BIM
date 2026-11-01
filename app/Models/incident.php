<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class incident extends Model
{
    protected $fillable = [
        'title',
        'description',
        'priority',
        'status',
        'user_id',
        'model',
        'x',
        'y',
        'z',
        'project_id',
        'normal_x',
        'normal_y',
        'normal_z'
    ];
    public function comments(){
        return $this->hasMany(Comment::class);
    }
}
