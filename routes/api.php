<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TrackingController;

use App\Http\Controllers\Api\ProjectChatController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\ClientController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);


Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/chat-user-list', [ProjectChatController::class, 'chatUserList'])
        ->name('chat.user.list');

    Route::get('/chat-project-list', [ProjectChatController::class, 'chatProjectList'])
        ->name('chat.project.list');

    Route::get('/chat-project-messages/{project_id}', [ProjectChatController::class, 'getProjectChatMessages'])
        ->name('chat.project.messages');

    Route::post('/chat-project-send-message', [ProjectChatController::class, 'sendProjectMessage'])
        ->name('chat.project.send.message');

    Route::delete('/chat-project-message/{id}', [ProjectChatController::class, 'deleteProjectMessage'])
        ->name('chat.project.message.delete');

    // project
    Route::post('/projects', [ProjectController::class, 'Create']);
    Route::get('/project-view/{id}', [ProjectController::class, 'View'])->name('project.view');
    Route::get('/project-edit/{id}', [ProjectController::class, 'Edit'])->name('project.edit');
    Route::put('/project-update/{id}', [ProjectController::class, 'Update'])->name('project.update');
    Route::get('project/column/{id}', [ProjectController::class, 'Column'])->name('project.column');
    Route::put('/project/column/update/{id}', [ProjectController::class, 'ColumnUpdate'])->name('project.column.update');
    Route::post('/project/team-member/join/{ProjectId}', [ProjectController::class, 'JoinProject'])->name('JoinProject');
    Route::put('/project/team-member/update/{TeamMemberId}', [ProjectController::class, 'EditJoinProject'])->name('EditJoinProject');
    Route::delete('/project/team-member/delete/{TeamMemberId}', [ProjectController::class, 'DeleteJoinProject'])->name('DeleteJoinProject');
    
    // client
    Route::get('/client', [ClientController::class, 'Index'])->name('client.index');

});


Route::post('/track/screenshot', [TrackingController::class, 'storeScreenshot']);
Route::get('/track/screenshots', [TrackingController::class, 'getScreenshots']);
Route::get('/track/users', [TrackingController::class, 'getAllUsers']);
Route::post('/track/check-in', [TrackingController::class, 'checkIn']);
Route::post('/track/check-out', [TrackingController::class, 'checkOut']);
Route::post('/track/screenshots/delete', [TrackingController::class, 'destroyScreenshots']);
Route::post('/track/screenshot/trigger', [TrackingController::class, 'triggerScreenshot']);
Route::get('/track/screenshot/pending/{user_id}', [TrackingController::class, 'checkPendingScreenshot']);
Route::get('/track/attendance/status/{user_id}', [TrackingController::class, 'getAttendanceStatus']);
Route::get('/track/active-status/{user_id}', [TrackingController::class, 'getActiveStatus']);
Route::get('/track/settings', [TrackingController::class, 'getTrackerSettings']);
Route::post('/track/settings/update', [TrackingController::class, 'updateTrackerSettings']);
Route::post('/track/toggle-permission', [TrackingController::class, 'toggleUserPermission']);
Route::post('/track/toggle-logout-restriction', [TrackingController::class, 'toggleLogoutRestriction']);
Route::post('/track/update-status', [TrackingController::class, 'updateStatus']);
Route::post('/track/activity', [TrackingController::class, 'storeActivity']);
Route::get('/track/activity/stats', [TrackingController::class, 'getActivityStats']);
Route::get('/track/screenshots/latest-all', [TrackingController::class, 'getLatestAllUsersScreenshots']);
Route::post('/track/ping', [TrackingController::class, 'pingTrackers']);
