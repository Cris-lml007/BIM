<?php

namespace App\Models;

use App\Enum\MembershipStatus;
use App\Enum\RoleProject;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProjectMembership extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'user_id',
        'role',
        'status',
        'started_at',
        'ended_at',
        'removed_by_user_id',
        'reason',
        'metadata',
    ];

    protected $casts = [
        'role' => RoleProject::class,
        'status' => MembershipStatus::class,
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function removedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'removed_by_user_id');
    }

    public function histories(): HasMany
    {
        return $this->hasMany(ProjectMembershipHistory::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', MembershipStatus::ACTIVE->value)
            ->whereNull('ended_at');
    }

    public function scopePending($query)
    {
        return $query->where('status', MembershipStatus::PENDING->value);
    }

    public function getIsActiveAttribute(): bool
    {
        return $this->status === MembershipStatus::ACTIVE && $this->ended_at === null;
    }
}
