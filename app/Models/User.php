<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

use App\Enum\MembershipStatus;
use App\Enum\RoleSaas;
use App\Models\ProjectMembership;
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

    /**
     * Relación con los proyectos donde el usuario es miembro (activos)
     */
    public function projects()
    {
        return $this->belongsToMany(Project::class, 'project_memberships')
            ->withPivot(['role', 'status', 'started_at', 'ended_at', 'removed_by_user_id', 'reason', 'metadata'])
            ->where('project_memberships.status', MembershipStatus::ACTIVE->value)
            ->whereNull('project_memberships.ended_at')
            ->withTimestamps();
    }

    /**
     * Relación con el access del usuario
     */
    public function access()
    {
        return $this->hasOne(Access::class);
    }

    public function projectMemberships()
    {
        return $this->hasMany(ProjectMembership::class);
    }

    public function activeProjectMemberships()
    {
        return $this->hasMany(ProjectMembership::class)
            ->where('status', MembershipStatus::ACTIVE->value)
            ->whereNull('ended_at');
    }

    public function membershipProjects()
    {
        return $this->belongsToMany(Project::class, 'project_memberships')
            ->withPivot(['role', 'status', 'started_at', 'ended_at', 'removed_by_user_id', 'reason', 'metadata'])
            ->withTimestamps();
    }
    /**
     * Verificar si el usuario puede crear un nuevo proyecto
     */
    public function canCreateProject(): bool
    {
        if (!$this->access) {
            return false;
        }
        
        $maxProjectsAllowed = $this->access->max_projects ?? 0;
        $currentProjectsCount = $this->projectsOwner()->count();

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

    /**
     * Obtener el conteo de usuarios miembros en los proyectos del usuario
     */
    public function getMembersCount(): int
    {
        return User::distinct()
            ->join('project_memberships', 'users.id', '=', 'project_memberships.user_id')
            ->join('projects', 'project_memberships.project_id', '=', 'projects.id')
            ->where('projects.user_id', $this->id)
            ->where('project_memberships.status', MembershipStatus::ACTIVE->value)
            ->whereNull('project_memberships.ended_at')
            ->count('users.id');
    }

    /**
     * Obtener el conteo de usuarios dentro del acceso (incluyendo al usuario titular)
     */
    public function getAccessUsersCount(): int
    {
        return $this->getMembersCount() + 1; // +1 para incluir al usuario titular
    }

    /**
     * Obtener el almacenamiento usado en MB por los proyectos del usuario
     */
    public function getStorageUsedMB(): float
    {
        $projects = $this->projectsOwner()->pluck('id');
        
        if ($projects->isEmpty()) {
            return 0;
        }

        // Sumar el tamaño de todos los documentos en los proyectos del usuario
        $storageBytes = Document::whereIn('project_id', $projects)
            ->sum('size') ?? 0;

        // Convertir a MB (el campo 'size' se asume que está en bytes)
        return round($storageBytes / (1024 * 1024), 2);
    }
    public function projectBlockedCount(): int
    {
        return $this->projectsOwner()->where('is_active', false)->count();
    }
}
