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

            // ['model' => 'Branch', 'type' => 'route', 'name' => 'View Branches'],
            // ['model' => 'Branch', 'type' => 'route', 'name' => 'Create Branch'],
            // ['model' => 'Branch', 'type' => 'route', 'name' => 'Update Branch'],
            // ['model' => 'Branch', 'type' => 'route', 'name' => 'Delete Branch'],

 
            // ['model' => 'Department', 'type' => 'route', 'name' => 'View Department'],
            // ['model' => 'Department', 'type' => 'route', 'name' => 'Create Department'],
            // ['model' => 'Department', 'type' => 'route', 'name' => 'Update Department'],
            // ['model' => 'Department', 'type' => 'route', 'name' => 'Delete Department'],

      
            // ['model' => 'Designation', 'type' => 'route', 'name' => 'View Designation'],
            // ['model' => 'Designation', 'type' => 'route', 'name' => 'Create Designation'],
            // ['model' => 'Designation', 'type' => 'route', 'name' => 'Update Designation'],
            // ['model' => 'Designation', 'type' => 'route', 'name' => 'Delete Designation'],


            // ['model' => 'Project', 'type' => 'route', 'name' => 'View Projects Data Table'],
            // ['model' => 'Project', 'type' => 'route', 'name' => 'View Single Project'],
            // ['model' => 'Project', 'type' => 'route', 'name' => 'Create Project'],
            // ['model' => 'Project', 'type' => 'route', 'name' => 'Update Project'],
            // ['model' => 'Project', 'type' => 'route', 'name' => 'Delete Project'],
            // ['model' => 'Project', 'type' => 'column', 'name' => 'Create Init Link'],
            // ['model' => 'Project', 'type' => 'column', 'name' => 'View Init Link'],
            // ['model' => 'Project', 'type' => 'column', 'name' => 'Update Init Link'],
            // ['model' => 'Project', 'type' => 'column', 'name' => 'Create Admin Notes'],
            // ['model' => 'Project', 'type' => 'column', 'name' => 'View Admin Notes'],
            // ['model' => 'Project', 'type' => 'column', 'name' => 'Update Admin Notes'],
            // ['model' => 'Project', 'type' => 'column', 'name' => 'Create Private Notes'],
            // ['model' => 'Project', 'type' => 'column', 'name' => 'View Private Notes'],
            // ['model' => 'Project', 'type' => 'column', 'name' => 'Update Private Notes'],
            // ['model' => 'Project', 'type' => 'column', 'name' => 'Create Total Budget'],
            // ['model' => 'Project', 'type' => 'column', 'name' => 'View Total Budget'],
            // ['model' => 'Project', 'type' => 'column', 'name' => 'Update Total Budget'],
            // ['model' => 'Project', 'type' => 'column', 'name' => 'Create Deduction Amount'],
            // ['model' => 'Project', 'type' => 'column', 'name' => 'View Deduction Amount'],
            // ['model' => 'Project', 'type' => 'column', 'name' => 'Update Deduction Amount'],

            // ['model' => 'Project', 'type' => 'column_status', 'name' => 'View All Projects'],
            // ['model' => 'Project', 'type' => 'column_status', 'name' => 'View Pending'],
            // ['model' => 'Project', 'type' => 'column_status', 'name' => 'View Takeoff On Progress'],
            // ['model' => 'Project', 'type' => 'column_status', 'name' => 'View Pricing On Progress'],
            // ['model' => 'Project', 'type' => 'column_status', 'name' => 'View Completed'],
            // ['model' => 'Project', 'type' => 'column_status', 'name' => 'View Revision'],
            // ['model' => 'Project', 'type' => 'column_status', 'name' => 'View Hold'],
            // ['model' => 'Project', 'type' => 'column_status', 'name' => 'View Deliver'],
            // ['model' => 'Project', 'type' => 'column_status', 'name' => 'View Cancelled'],

            // ['model' => 'Role', 'type' => 'route', 'name' => 'View Role'],
            // ['model' => 'Role', 'type' => 'route', 'name' => 'Create Role'],
            // ['model' => 'Role', 'type' => 'route', 'name' => 'Update Role'],
            // ['model' => 'Role', 'type' => 'route', 'name' => 'Delete Role'],

          
            // ['model' => 'Permission', 'type' => 'route', 'name' => 'View Permission'],
            // ['model' => 'Permission', 'type' => 'route', 'name' => 'Update Permission'],


            // ['model' => 'Client', 'type' => 'route', 'name' => 'View Client'],
            // ['model' => 'Client', 'type' => 'route', 'name' => 'Create Client'],
            // ['model' => 'Client', 'type' => 'route', 'name' => 'Update Client'],
            // ['model' => 'Client', 'type' => 'route', 'name' => 'Delete Client'],

       
            // ['model' => 'User', 'type' => 'route', 'name' => 'View User'],
            // ['model' => 'User', 'type' => 'route', 'name' => 'Create User'],
            // ['model' => 'User', 'type' => 'route', 'name' => 'Update User'],
            // ['model' => 'User', 'type' => 'route', 'name' => 'Delete User'],

     
            // ['model' => 'Media', 'type' => 'route', 'name' => 'View Media'],
            // ['model' => 'Media', 'type' => 'route', 'name' => 'Upload Media'],
            // ['model' => 'Media', 'type' => 'route', 'name' => 'Update Media'],
            // ['model' => 'Media', 'type' => 'route', 'name' => 'Delete Media'],

            // ['model' => 'Candidate', 'type' => 'route', 'name' => 'View Job Application'],
            // ['model' => 'Candidate', 'type' => 'route', 'name' => 'Edit Job Application'],

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
