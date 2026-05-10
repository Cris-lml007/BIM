<?php

namespace App\Services;

use App\Enum\MembershipStatus;
use App\Enum\RoleProject;
use App\Models\Project;
use App\Models\ProjectMembership;
use App\Models\ProjectMembershipHistory;
use App\Models\User;
use Illuminate\Support\Carbon;

class ProjectMembershipService
{
    public function addMember(Project $project, User $user, RoleProject $role, User $actor): ProjectMembership
    {
        $membership = ProjectMembership::create([
            'project_id' => $project->id,
            'user_id' => $user->id,
            'role' => $role,
            'status' => MembershipStatus::ACTIVE,
            'started_at' => Carbon::now(),
        ]);

        $this->recordHistory(
            $membership,
            'joined',
            null,
            $role,
            null,
            MembershipStatus::ACTIVE,
            $actor,
            ['source' => 'manual']
        );

        return $membership;
    }

    public function removeMember(ProjectMembership $membership, MembershipStatus $status, ?User $actor = null, ?string $reason = null): ProjectMembership
    {
        $oldStatus = $membership->status;

        $membership->update([
            'status' => $status,
            'ended_at' => Carbon::now(),
            'removed_by_user_id' => $actor?->id,
            'reason' => $reason,
        ]);

        $this->recordHistory(
            $membership,
            'removed',
            $membership->role,
            $membership->role,
            $oldStatus,
            $status,
            $actor,
            ['reason' => $reason]
        );

        return $membership;
    }

    public function changeRole(ProjectMembership $membership, RoleProject $role, User $actor): ProjectMembership
    {
        $oldRole = $membership->role;

        $membership->update([
            'role' => $role,
        ]);

        $this->recordHistory(
            $membership,
            'role_changed',
            $oldRole,
            $role,
            $membership->status,
            $membership->status,
            $actor,
            []
        );

        return $membership;
    }

    protected function recordHistory(
        ProjectMembership $membership,
        string $eventType,
        ?RoleProject $oldRole,
        ?RoleProject $newRole,
        ?MembershipStatus $oldStatus,
        ?MembershipStatus $newStatus,
        ?User $actor,
        array $metadata = []
    ): ProjectMembershipHistory {
        return $membership->histories()->create([
            'project_id' => $membership->project_id,
            'user_id' => $membership->user_id,
            'event_type' => $eventType,
            'old_role' => $oldRole?->value,
            'new_role' => $newRole?->value,
            'old_status' => $oldStatus?->value,
            'new_status' => $newStatus?->value,
            'performed_by_user_id' => $actor?->id,
            'performed_at' => Carbon::now(),
            'metadata' => $metadata,
        ]);
    }
}
