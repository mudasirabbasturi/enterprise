<?php 

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\DesignationController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\CandidateController;
use App\Http\Controllers\LegalPageController;
use App\Http\Controllers\ProjectTestController;
use App\Http\Controllers\Api\TrackingController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\UserShiftScheduleController;
use App\Http\Controllers\UserAllowedIpController;
use App\Http\Controllers\UserAttendanceController;
use App\Http\Controllers\WorkScheduleController;
use App\Http\Controllers\LeaveTypeController;
use App\Http\Controllers\LeavePolicyController;
use App\Http\Controllers\LeaveBalanceController;
use App\Http\Controllers\LeaveRequestController;
use App\Http\Controllers\HolidayController;

use Illuminate\Support\Facades\DB;


/**
 * Public Routes
 */
Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
Route::post('/login', [LoginController::class, 'login'])->name('login.post');
Route::post('/logout', [LoginController::class, 'logout'])->name('logout.post');
Route::middleware(['auth'])->group(function () {

    /** HomeController */
    Route::get('/', [HomeController::class, 'Index'])->name('home.index');
    /** UserController */
    Route::get('/user', [UserController::class, 'Index'])->name('user.index');
    Route::post('/user/store', [UserController::class, 'Store'])->name('user.store');
    Route::get('/user/view/{id}', [UserController::class, 'View'])->name('user.view');    
    Route::put('/user/update/{id}', [UserController::class, 'Update'])->name('user.update');
    Route::delete('/user/destroy/{id}', [UserController::class, 'Destroy'])->name('user.destroy');
    Route::put('/user/column/update/{id}', [UserController::class, 'UserColumnUpdate'])->name('user.column.update');
    Route::get('/user/profile/{id}', [UserController::class, 'Profile'])->name('user.profile');

     /** MediaController */
    Route::get('/media/{userId}', [MediaController::class, 'Index'])->name('media.index');
    Route::post('/media/upload', [MediaController::class, 'Upload'])->name('media.upload');
    Route::delete('/media/delete/{id}', [MediaController::class, 'Destroy'])->name('media.destroy');
    
    /** ClientController */
    Route::get('/client', [ClientController::class, 'Index'])->name('client.index');
    Route::post('/client/store', [ClientController::class, 'Store'])->name('client.store');
    Route::get('/client/view/{id}', [ClientController::class, 'View'])->name('client.view');    
    Route::put('/client/update/{id}', [ClientController::class, 'Update'])->name('client.update');
    Route::delete('/client/destroy/{id}', [ClientController::class, 'Destroy'])->name('client.destroy');

    /** BranchController */
    Route::get('/branch', [BranchController::class, 'Index'])->name('branch.index');
    Route::post('/branch/store', [BranchController::class, 'Store'])->name('branch.store');
    Route::get('/branch/view/{id}', [BranchController::class, 'View'])->name('branch.view');    
    Route::put('/branch/update/{id}', [BranchController::class, 'Update'])->name('branch.update');
    Route::delete('/branch/destroy/{id}', [BranchController::class, 'Destroy'])->name('branch.destroy');

    /** DepartmentController */
    Route::get('/department', [DepartmentController::class, 'Index'])->name('department.index');
    Route::post('/department/store', [DepartmentController::class, 'Store'])->name('department.store');
    Route::get('/department/view/{id}', [DepartmentController::class, 'View'])->name('department.view');    
    Route::put('/department/update/{id}', [DepartmentController::class, 'Update'])->name('department.update');
    Route::delete('/department/destroy/{id}', [DepartmentController::class, 'Destroy'])->name('department.destroy');

    /** DesignationController */
    Route::get('/designation', [DesignationController::class, 'Index'])->name('designation.index');
    Route::post('/designation/store', [DesignationController::class, 'Store'])->name('designation.store');
    Route::get('/designation/view/{id}', [DesignationController::class, 'View'])->name('designation.view');
    Route::put('/designation/update/{id}', [DesignationController::class, 'Update'])->name('designation.update');
    Route::delete('/designation/destroy/{id}', [DesignationController::class, 'Destroy'])->name('designation.destroy');

    /** ProjectController */
    Route::get('/project', [ProjectController::class, 'Index'])->name('project.index');
    Route::post('/project/store', [ProjectController::class, 'Store'])->name('project.store');
    Route::get('/project/view/{id}', [ProjectController::class, 'View'])->name('project.view');
    Route::put('/project/update/{id}', [ProjectController::class, 'Update'])->name('project.update');
    Route::delete('/project/destroy/{id}', [ProjectController::class, 'Destroy'])->name('project.destroy');
    Route::get('/project/{status}', [ProjectController::class, 'Status'])->name('project.status');
    Route::get('/project/self/{status}', [ProjectController::class, 'SelfStatus'])->name('project.self.status');
    Route::put('/project/column/update/{id}', [ProjectController::class, 'ProjectColumnUpdate'])->name('project.column.update');
    Route::get('/project-report', [ProjectController::class, 'ProjectReport'])->name('project.report');
    Route::get('/project-report/chart', [ProjectController::class, 'ProjectReportChart'])->name('project.report.chart');
    Route::get('/project-count/chart', [ProjectController::class, 'ProjectCountChart'])->name('project.count.chart');

    Route::put('/project/bulk/update', [ProjectController::class, 'BulkUpdate'])
        ->name('project.bulk.update');


    // Team Member 
    Route::post('/project/team-member/join/{ProjectId}', [ProjectController::class, 'JoinProject'])->name('JoinProject');
    Route::put('/project/team-member/update/{TeamMemberId}', [ProjectController::class, 'EditJoinProject'])->name('EditJoinProject');
    Route::delete('/project/team-member/delete/{TeamMemberId}', [ProjectController::class, 'DeleteJoinProject'])->name('DeleteJoinProject');
    Route::put('/project/team-member/score/{TeamMemberId}', [ProjectController::class, 'AddEditScore'])->name('AddEditScore');
    Route::put('/project/{project}/team-members/scores', [ProjectController::class, 'BulkUpdateScores'])->name('project.bulkUpdateScores');

    /** RoleController */
    Route::get('/role', [RoleController::class, 'Index'])->name('role.index');
    Route::post('/role/store', [RoleController::class, 'Store'])->name('role.store');
    Route::get('/role/view/{id}', [RoleController::class, 'View'])->name('role.view');
    Route::put('/role/update/{id}', [RoleController::class, 'Update'])->name('role.update');
    Route::delete('/role/destroy/{id}', [RoleController::class, 'Destroy'])->name('role.destroy');

    /** PermissionController */
    Route::get('/permission', [PermissionController::class, 'Index'])->name('permission.index');
    Route::post('/permission/store', [PermissionController::class, 'Store'])->name('permission.store');
    Route::get('/permission/view/{id}', [PermissionController::class, 'View'])->name('permission.view');
    Route::put('/permission/update/{id}', [PermissionController::class, 'Update'])->name('permission.update');
    Route::delete('/permission/destroy/{id}', [PermissionController::class, 'Destroy'])->name('permission.destroy');

    /** CandidateController */
    Route::get('/application/candidates', [CandidateController::class, 'Index'])->name('application.index');
    Route::put('/application/candidates/{id}', [CandidateController::class, 'GenerateJobLetter'])->name('generate.jobletter');
    Route::put('/application/stats/{id}', [CandidateController::class, 'Stats'])->name('job_letter.stats');
    Route::delete('/application/destroy/{id}', [CandidateController::class, 'Destroy'])->name('candidate.destroy');

    Route::get('/privacy-policy', [LegalPageController::class, 'privacy'])
        ->name('privacy.policy');

    Route::get('/terms-conditions', [LegalPageController::class, 'terms'])
        ->name('terms.conditions');
        
// Test page routes
Route::get('/projects/test', [ProjectTestController::class, 'index'])->name('projects.test');
Route::prefix('api/test')->group(function () {
    Route::post('/more-projects', [ProjectTestController::class, 'getMoreProjects']);
    Route::post('/team-members', [ProjectTestController::class, 'getTeamMembers']);
});

    Route::get('/user-tracking', [TrackingController::class, 'index'])->name('user.tracking');

    /** Work Schedule Routes */
    /** Work Schedule Routes */
    Route::get('/schedule', [WorkScheduleController::class, 'Index'])->name('work-schedule.index');
    
    // Shifts
    Route::get('/schedule/shifts', [ShiftController::class, 'Index'])->name('shifts.index');
    Route::post('/schedule/shifts/store', [ShiftController::class, 'Store'])->name('shifts.store');
    Route::put('/schedule/shifts/update/{id}', [ShiftController::class, 'Update'])->name('shifts.update');
    Route::delete('/schedule/shifts/destroy/{id}', [ShiftController::class, 'Destroy'])->name('shifts.destroy');

    // User Schedules
    Route::get('/schedule/users-schedules', [UserShiftScheduleController::class, 'Index'])->name('users-schedules.index');
    Route::post('/schedule/users-schedules/store', [UserShiftScheduleController::class, 'Store'])->name('users-schedules.store');
    Route::post('/schedule/users-schedules/bulk-store', [UserShiftScheduleController::class, 'BulkStore'])->name('users-schedules.bulk-store');
    Route::delete('/schedule/users-schedules/bulk-destroy', [UserShiftScheduleController::class, 'BulkDestroy'])->name('users-schedules.bulk-destroy');
    Route::put('/schedule/users-schedules/update/{id}', [UserShiftScheduleController::class, 'Update'])->name('users-schedules.update');
    Route::delete('/schedule/users-schedules/destroy/{id}', [UserShiftScheduleController::class, 'Destroy'])->name('users-schedules.destroy');

    // Allowed IPs
    Route::get('/schedule/allowed-ips', [UserAllowedIpController::class, 'Index'])->name('allowed-ips.index');
    Route::post('/schedule/allowed-ips/store', [UserAllowedIpController::class, 'Store'])->name('allowed-ips.store');
    Route::put('/schedule/allowed-ips/update/{id}', [UserAllowedIpController::class, 'Update'])->name('allowed-ips.update');
    Route::delete('/schedule/allowed-ips/destroy/{id}', [UserAllowedIpController::class, 'Destroy'])->name('allowed-ips.destroy');

    // User Attendance
    Route::get('/schedule/my-attendance', [UserAttendanceController::class, 'MyAttendance'])->name('my-attendance.index');
    Route::get('/schedule/users-attendance', [UserAttendanceController::class, 'Index'])->name('users-attendance.index');
    Route::post('/schedule/users-attendance/store', [UserAttendanceController::class, 'Store'])->name('users-attendance.store');
    Route::put('/schedule/users-attendance/update/{id}', [UserAttendanceController::class, 'Update'])->name('users-attendance.update');
    Route::delete('/schedule/users-attendance/destroy/{id}', [UserAttendanceController::class, 'Destroy'])->name('users-attendance.destroy');

    /** Leave Management Routes */
    // Leave Types
    Route::get('/leave/types', [LeaveTypeController::class, 'Index'])->name('leave-types.index');
    Route::post('/leave/types/store', [LeaveTypeController::class, 'Store'])->name('leave-types.store');
    Route::put('/leave/types/update/{id}', [LeaveTypeController::class, 'Update'])->name('leave-types.update');
    Route::delete('/leave/types/destroy/{id}', [LeaveTypeController::class, 'Destroy'])->name('leave-types.destroy');
    Route::delete('/leave/types/bulk-destroy', [LeaveTypeController::class, 'BulkDestroy'])->name('leave-types.bulk-destroy');

    // Leave Policies
    Route::get('/leave/policies', [LeavePolicyController::class, 'Index'])->name('leave-policies.index');
    Route::post('/leave/policies/store', [LeavePolicyController::class, 'Store'])->name('leave-policies.store');
    Route::put('/leave/policies/update/{id}', [LeavePolicyController::class, 'Update'])->name('leave-policies.update');
    Route::delete('/leave/policies/destroy/{id}', [LeavePolicyController::class, 'Destroy'])->name('leave-policies.destroy');
    Route::delete('/leave/policies/bulk-destroy', [LeavePolicyController::class, 'BulkDestroy'])->name('leave-policies.bulk-destroy');

    // Leave Balances
    Route::get('/leave/balances', [LeaveBalanceController::class, 'Index'])->name('leave-balances.index');
    Route::post('/leave/balances/store', [LeaveBalanceController::class, 'Store'])->name('leave-balances.store');
    Route::put('/leave/balances/update/{id}', [LeaveBalanceController::class, 'Update'])->name('leave-balances.update');
    Route::delete('/leave/balances/destroy/{id}', [LeaveBalanceController::class, 'Destroy'])->name('leave-balances.destroy');
    Route::delete('/leave/balances/bulk-destroy', [LeaveBalanceController::class, 'BulkDestroy'])->name('leave-balances.bulk-destroy');

    // Leave Requests
    Route::get('/leave/requests', [LeaveRequestController::class, 'Index'])->name('leave-requests.index');
    Route::post('/leave/requests/store', [LeaveRequestController::class, 'Store'])->name('leave-requests.store');
    Route::put('/leave/requests/update/{id}', [LeaveRequestController::class, 'Update'])->name('leave-requests.update');
    Route::delete('/leave/requests/destroy/{id}', [LeaveRequestController::class, 'Destroy'])->name('leave-requests.destroy');
    Route::post('/leave/requests/status/{id}', [LeaveRequestController::class, 'UpdateStatus'])->name('leave-requests.status');
    Route::delete('/leave/requests/bulk-destroy', [LeaveRequestController::class, 'BulkDestroy'])->name('leave-requests.bulk-destroy');

    // Holidays
    Route::get('/leave/holidays', [HolidayController::class, 'Index'])->name('holidays.index');
    Route::post('/leave/holidays/store', [HolidayController::class, 'Store'])->name('holidays.store');
    Route::put('/leave/holidays/update/{id}', [HolidayController::class, 'Update'])->name('holidays.update');
    Route::delete('/leave/holidays/destroy/{id}', [HolidayController::class, 'Destroy'])->name('holidays.destroy');
    Route::delete('/leave/holidays/bulk-destroy', [HolidayController::class, 'BulkDestroy'])->name('holidays.bulk-destroy');

    // Personal Leave Management
    Route::get('/my-leave-balances', [LeaveBalanceController::class, 'MyBalances'])->name('my-leave-balances.index');
    Route::get('/my-leave-requests', [LeaveRequestController::class, 'MyRequests'])->name('my-leave-requests.index');


});


Route::get('/job/apply',[CandidateController::class, 'applicationForm'])->name('application.form');
Route::post('/job/apply',[CandidateController::class, 'submitApplicationForm'])->name('submit.application.form');