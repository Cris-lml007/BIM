<?php

namespace App\Policies;

use App\Enum\RoleProject;
use App\Enum\Status;
use App\Models\Project;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Database\Eloquent\Builder;

class ProjectPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Project $project): bool
    {
        return Project::where('id',$project->id)->where(function(Builder $q) use ($user){
            $q->where('user_id',$user->id)->orWhereHas('members',function(Builder $builder) use ($user){
                $builder->where('user_id',$user->id)->where('is_active',Status::ACTIVE);
            });
        })->exists();
        // return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->canCreateProject();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Project $project): bool
    {
        return $project->owner()->where('user_id',$user->id)->orWhereHas('members',function(Builder $builder) use ($user){
            $builder->where('user_id',$user->id)->where('role',RoleProject::CONSTRUCTION_MANAGER);
        })->exists();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Project $project): bool
    {
        return $project->owner()->where('user_id',$user->id)->exists();
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Project $project): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Project $project): bool
    {
        return false;
    }
}
