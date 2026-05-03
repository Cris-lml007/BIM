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

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    public function models(){
        return $this->hasMany(Model3D::class,'project_id','id');
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'project_user')
            ->withPivot('role')
            ->withTimestamps();
    }

    /**
     * Relación con las invitaciones pendientes
     */
    public function pendingInvitations()
    {
        return $this->hasMany(ProjectInvitation::class)
            ->where('expires_at', '>', now());
    }

    /**
     * Relación con todas las invitaciones (incluyendo expiradas)
     */
    public function invitations()
    {
        return $this->hasMany(ProjectInvitation::class);
    }

    /**
     * Obtener el access del propietario del proyecto
     */
    public function ownerAccess()
    {
        return $this->owner->access;
    }

    /**
     * Obtener el número total de usuarios (miembros + invitaciones pendientes)
     */
    public function getTotalUsersCount(): int
    {
        $membersCount = $this->members()->count();
        $pendingInvitationsCount = $this->pendingInvitations()->count();

        return $membersCount + $pendingInvitationsCount;
    }
    

    /**
     * Verificar si se puede invitar más usuarios al proyecto
     */
    public function canInviteMoreUsers(): bool
    {
        $maxUsersAllowed = $this->ownerAccess()?->max_users;

        if (!$maxUsersAllowed) {
            return false;
        }

        $totalUsers = $this->getTotalUsersCount();

        return $totalUsers < $maxUsersAllowed;
    }

    /**
     * Obtener el número de cupos disponibles para invitar
     */
    public function getAvailableInvitationSlots(): int
    {
        $maxUsersAllowed = $this->ownerAccess()?->max_users ?? 0;
        $totalUsers = $this->getTotalUsersCount();

        return max(0, $maxUsersAllowed - $totalUsers);
    }

    /**
     * Obtener estadísticas de miembros del proyecto
     */
    public function getMembersStats(): array
    {
        $maxUsersAllowed = $this->ownerAccess()?->max_users ?? 0;
        $membersCount = $this->members()->count();
        $pendingInvitationsCount = $this->pendingInvitations()->count();

        $totalUsers = $membersCount + $pendingInvitationsCount;

        return [
            'current' => $membersCount,
            'pending_invitations' => $pendingInvitationsCount,
            'total_committed' => $totalUsers,
            'max' => $maxUsersAllowed,
            'available' => max(0, $maxUsersAllowed - $totalUsers),
            'is_full' => $maxUsersAllowed > 0 && $totalUsers >= $maxUsersAllowed
        ];
    }

    /**
     * Verificar si un email ya tiene invitación pendiente
     */
    public function hasPendingInvitationForEmail(string $email): bool
    {
        return $this->pendingInvitations()
            ->where('email', $email)
            ->exists();
    }

    /**
     * Verificar si un usuario ya es miembro o tiene invitación pendiente
     */
    public function isUserAlreadyInvitedOrMember(User $user): bool
    {
        // Verificar si ya es miembro
        if ($this->members()->where('user_id', $user->id)->exists()) {
            return true;
        }

        // Verificar si tiene invitación pendiente
        return $this->pendingInvitations()
            ->where('email', $user->email)
            ->exists();
    }
}
