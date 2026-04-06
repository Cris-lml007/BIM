<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Attachment extends Model
{
    public $fillable = [
        'name',
        'file',
        'type',
        'path',
        'fileable_type',
        'fileable_id'
    ];

    public function fileable(){
        return $this->morphTo();
    }
}
