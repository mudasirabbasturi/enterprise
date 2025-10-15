<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            ['model' => 'Branch', 'type' => 'route', 'name' => 'View Branches'],
            ['model' => 'Branch', 'type' => 'route', 'name' => 'Create Branch'],
            ['model' => 'Branch', 'type' => 'route', 'name' => 'Update Branch'],
            ['model' => 'Branch', 'type' => 'route', 'name' => 'Delete Branch'],
            ['model' => 'Department', 'type' => 'route', 'name' => 'View Department'],
            ['model' => 'Department', 'type' => 'route', 'name' => 'Create Department'],
            ['model' => 'Department', 'type' => 'route', 'name' => 'Update Department'],
            ['model' => 'Department', 'type' => 'route', 'name' => 'Delete Department'],
            ['model' => 'Designation', 'type' => 'route', 'name' => 'View Designation'],
            ['model' => 'Designation', 'type' => 'route', 'name' => 'Create Designation'],
            ['model' => 'Designation', 'type' => 'route', 'name' => 'Update Designation'],
            ['model' => 'Designation', 'type' => 'route', 'name' => 'Delete Designation'],
            ['model' => 'Project', 'type' => 'route', 'name' => 'View Projects'],
            ['model' => 'Project', 'type' => 'route', 'name' => 'Create Project'],
            ['model' => 'Project', 'type' => 'route', 'name' => 'Update Project'],
            ['model' => 'Project', 'type' => 'route', 'name' => 'Delete Project'],
            ['model' => 'Project', 'type' => 'route', 'name' => 'View All Projects'],
            ['model' => 'Project', 'type' => 'route', 'name' => 'View Pending Projects'],
            ['model' => 'Project', 'type' => 'route', 'name' => 'View Takeoff On Progress Projects'],
            ['model' => 'Project', 'type' => 'route', 'name' => 'View Pricing On Progress Projects'],
            ['model' => 'Project', 'type' => 'route', 'name' => 'View Completed Projects'],
            ['model' => 'Project', 'type' => 'route', 'name' => 'View Hold Projects'],
            ['model' => 'Project', 'type' => 'route', 'name' => 'View Revision Projects'],
            ['model' => 'Project', 'type' => 'route', 'name' => 'View Cancelled Projects'],
            ['model' => 'Project', 'type' => 'route', 'name' => 'View Deliver Projects'],
            // Columns 
            ['model' => 'Project', 'type' => 'column', 'name' => 'Add Project Title'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Update Project Title'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Add Project Address'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Update Project Address'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'View Client Admin'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Add Client Admin'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Update Client Admin'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'View Client Personal'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Add Project Client'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Update Project Client'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Add Project Pricing'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Update Project Pricing'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Add Project Area'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Update Project Area'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Add Construction Type'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Update Construction Type'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Add LineItems Pricing'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Update LineItems Pricing'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Add Floor Number'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Update Floor Number'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Add Main Scope'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Update Main Scope'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Add Scope Details'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Update Scope Details'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Add Project Template'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Update Project Template'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'View Initial Link(onside)'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Add Initial Link'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Update Initial Link'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'View Final Link(offside)'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Add Final Link'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Update Final Link'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'View Admin Notes'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Add Admin Notes'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Update Admin Notes'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Add Estimator Notes'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Update Estimator Notes'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Add ClientAdmin Notes'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Update ClientAdmin Notes'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'View Budget'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Add Budget'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Update Budget'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'View Deduction'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Add Deduction'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Update Deduction'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Add Due Date'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Update Due Date'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Add Project Points'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Update Project Points'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'View Personal Points'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'View All Points'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Add Project Status'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Update Project Status'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Add Project Source'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Update Project Source'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Add Preview Status'],
            ['model' => 'Project', 'type' => 'column', 'name' => 'Update Preview Status'],
            ['model' => 'Role', 'type' => 'route', 'name' => 'View Role'],
            ['model' => 'Role', 'type' => 'route', 'name' => 'Create Role'],
            ['model' => 'Role', 'type' => 'route', 'name' => 'Update Role'],
            ['model' => 'Role', 'type' => 'route', 'name' => 'Delete Role'],
            ['model' => 'Permission', 'type' => 'route', 'name' => 'View Permission'],
            ['model' => 'Permission', 'type' => 'route', 'name' => 'Update Permission'],
            ['model' => 'Client', 'type' => 'route', 'name' => 'View Client'],
            ['model' => 'Client', 'type' => 'route', 'name' => 'Create Client'],
            ['model' => 'Client', 'type' => 'route', 'name' => 'Update Client'],
            ['model' => 'Client', 'type' => 'route', 'name' => 'Delete Client'],
            ['model' => 'User', 'type' => 'route', 'name' => 'View User'],
            ['model' => 'User', 'type' => 'route', 'name' => 'Create User'],
            ['model' => 'User', 'type' => 'route', 'name' => 'Update User'],
            ['model' => 'User', 'type' => 'route', 'name' => 'Delete User'],
            ['model' => 'Media', 'type' => 'route', 'name' => 'View Media'],
            ['model' => 'Media', 'type' => 'route', 'name' => 'Upload Media'],
            ['model' => 'Media', 'type' => 'route', 'name' => 'Update Media'],
            ['model' => 'Media', 'type' => 'route', 'name' => 'Delete Media'],
            ['model' => 'Candidate', 'type' => 'route', 'name' => 'View Job Application'],
            ['model' => 'Candidate', 'type' => 'route', 'name' => 'Edit Job Application'],
            ['model' => 'ProjectTeamMember', 'type' => 'route', 'name' => 'View Project Team'],
            ['model' => 'ProjectTeamMember', 'type' => 'route', 'name' => 'View Score Details'],
            ['model' => 'ProjectTeamMember', 'type' => 'route', 'name' => 'View Personal Score Details'],
            ['model' => 'ProjectTeamMember', 'type' => 'route', 'name' => 'Add/Update Score'],
        ];

        foreach ($permissions as $perm) {
            DB::table('permissions')->updateOrInsert(
                [
                    'model' => $perm['model'],
                    'type' => $perm['type'],
                    'name' => $perm['name'],
                ],
                [
                    'notes' => 'Permission for ' . $perm['name'],
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }
}
