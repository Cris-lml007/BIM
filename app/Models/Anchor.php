<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Anchor extends Model
{

    public $fillable = [
        'model_id',
        'user_id',
        'hash',
        'x',
        'y',
        'z',
        'title'
    ];


    public function model(){
        return $this->belongsTo(Model3D::class,'model_id','id');
    }
}
