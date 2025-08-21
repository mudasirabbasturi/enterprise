<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ProjectPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('Project', 'View Projects Data Table');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Project $project): bool
    {
        return $user->hasPermission('Project', 'View Single Project');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission('Project', 'Create Project');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Project $project): bool
    {
        return $user->hasPermission('Project', 'Update Project');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Project $project): bool
    {
        return $user->hasPermission('Project', 'Delete Project');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Project $project): bool
    {
        return $user->hasPermission('Project', 'Update Project');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Project $project): bool
    {
        return $user->hasPermission('Project', 'Delete Project');
    }

    /**
     * Determine whether the user can view init link field.
     */
    public function viewInitLink(User $user): bool
    {
        return $user->hasPermission('Project', 'View Init Link');
    }

    /**
     * Determine whether the user can create/update init link field.
     */
    public function updateInitLink(User $user): bool
    {
        return $user->hasPermission('Project', 'Create Init Link') || 
               $user->hasPermission('Project', 'Update Init Link');
    }

    /**
     * Determine whether the user can view admin notes field.
     */
    public function viewAdminNotes(User $user): bool
    {
        return $user->hasPermission('Project', 'View Admin Notes');
    }

    /**
     * Determine whether the user can create/update admin notes field.
     */
    public function updateAdminNotes(User $user): bool
    {
        return $user->hasPermission('Project', 'Create Admin Notes') || 
               $user->hasPermission('Project', 'Update Admin Notes');
    }

    /**
     * Determine whether the user can view private notes field.
     */
    public function viewPrivateNotes(User $user): bool
    {
        return $user->hasPermission('Project', 'View Private Notes');
    }

    /**
     * Determine whether the user can create/update private notes field.
     */
    public function updatePrivateNotes(User $user): bool
    {
        return $user->hasPermission('Project', 'Create Private Notes') || 
               $user->hasPermission('Project', 'Update Private Notes');
    }

    /**
     * Determine whether the user can view total budget field.
     */
    public function viewTotalBudget(User $user): bool
    {
        return $user->hasPermission('Project', 'View Total Budget');
    }

    /**
     * Determine whether the user can create/update total budget field.
     */
    public function updateTotalBudget(User $user): bool
    {
        return $user->hasPermission('Project', 'Create Total Budget') || 
               $user->hasPermission('Project', 'Update Total Budget');
    }

    /**
     * Determine whether the user can view deduction amount field.
     */
    public function viewDeductionAmount(User $user): bool
    {
        return $user->hasPermission('Project', 'View Deduction Amount');
    }

    /**
     * Determine whether the user can create/update deduction amount field.
     */
    public function updateDeductionAmount(User $user): bool
    {
        return $user->hasPermission('Project', 'Create Deduction Amount') || 
               $user->hasPermission('Project', 'Update Deduction Amount');
    }
}
