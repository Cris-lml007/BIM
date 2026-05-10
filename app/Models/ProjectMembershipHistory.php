<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectMembershipHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_membership_id',
        'project_id',
        'user_id',
        'event_type',
        'old_role',
        'new_role',
        'old_status',
        'new_status',
        'performed_by_user_id',
        'performed_at',
        'metadata',
    ];

    protected $casts = [
        'performed_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function membership(): BelongsTo
    {
        return $this->belongsTo(ProjectMembership::class, 'project_membership_id');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by_user_id');
    }
}
