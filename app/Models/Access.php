<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Access extends Model
{
    protected $fillable = [
        'user_id',
        'max_projects',
        'max_users',
        'is_active',
        'available',
        'available_end',
    ];
    
    protected $casts = [
        'is_active' => 'boolean',
        'available' => 'date',
        'available_end' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
