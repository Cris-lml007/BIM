<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

use App\Enum\RoleSaas;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'organization'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => RoleSaas::class
        ];
    }

    public function projectsOwner(){
        return $this->hasMany(Project::class,'user_id','id');
    }

    public function projects()
    {
        return $this->belongsToMany(Project::class, 'project_user')
            ->withPivot('role')
            ->withTimestamps();
    }

    /**
     * Relación con el access del usuario
     */
    public function access()
    {
        return $this->hasOne(Access::class);
    }
    /**
     * Relación con los proyectos donde el usuario es miembro
     */
    public function memberProjects()
    {
        return $this->belongsToMany(Project::class, 'project_user')
            ->withPivot('role')
            ->withTimestamps();
    }
    /**
     * Verificar si el usuario puede crear un nuevo proyecto
     */
    public function canCreateProject(): bool
    {
        $maxProjectsAllowed = $this->access?->max_projects ?? 0;
        $currentProjectsCount = $this->projects()->count();

        return $currentProjectsCount < $maxProjectsAllowed;
    }

    /**
     * Obtener estadísticas de proyectos del usuario
     */
    public function getProjectsStats(): array
    {
        $maxProjectsAllowed = $this->access?->max_projects ?? 0;
        $currentProjectsCount = $this->projects()->count();

        return [
            'current' => $currentProjectsCount,
            'max' => $maxProjectsAllowed,
            'available' => max(0, $maxProjectsAllowed - $currentProjectsCount),
            'can_create' => $currentProjectsCount < $maxProjectsAllowed
        ];
    }
}
