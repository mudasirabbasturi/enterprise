<?php 

use Illuminate\Support\Facades\Route;
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
use App\Http\Controllers\JobLetterController;

/**
 * Public Routes
 */
Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
Route::post('/login', [LoginController::class, 'login'])->name('login.post');
Route::post('/logout', [LoginController::class, 'logout'])->name('logout.post');
Route::middleware(['auth'])->group(function () {
    
    Route::get('/', function () {
        return Inertia('Home');
    });

    /** UserController */
    Route::get('/user', [UserController::class, 'Index'])->name('user.index');
    Route::post('/user/store', [UserController::class, 'Store'])->name('user.store');
    Route::get('/user/view/{id}', [UserController::class, 'View'])->name('user.view');    
    Route::put('/user/update/{id}', [UserController::class, 'Update'])->name('user.update');
    Route::delete('/user/destroy/{id}', [UserController::class, 'Destroy'])->name('user.destroy');

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

    /** JobLetterController */
    Route::get('/application/job-letter', [JobLetterController::class, 'Index'])->name('letter.index');

    // Route::get('/routes', function () {
    //     $routes = collect(Route::getRoutes())
    //         ->filter(function ($route) {
    //             return $route->getName() !== null
    //                 && $route->getActionName() !== 'Closure'
    //                 && !in_array($route->getName(), ['login.index', 'login.post', 'logout.post']);;
    //         })
    //         ->map(function ($route) {
    //             return [
    //                 'uri' => $route->uri(),
    //                 'method' => $route->methods(),
    //                 'name' => $route->getName(),
    //                 'action' => $route->getActionName(),
    //                 'middleware' => $route->middleware(),
    //             ];
    //         });

    //     return response()->json($routes);
    // });

});