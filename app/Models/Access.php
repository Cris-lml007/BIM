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
    /**
     * Relación con el usuario
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Verificar si el access está activo y vigente
     */
    public function isValid(): bool
    {
        return $this->is_active &&
            $this->available <= now() &&
            $this->available_end >= now();
    }

    /**
     * Verificar si el usuario puede invitar más usuarios
     */
    public function canInviteMoreUsers(int $currentMembersCount): bool
    {
        return $currentMembersCount < $this->max_users;
    }

    /**
     * Verificar si el usuario puede crear más proyectos
     */
    public function canCreateMoreProjects(int $currentProjectsCount): bool
    {
        return $currentProjectsCount < $this->max_projects;
    }
}
