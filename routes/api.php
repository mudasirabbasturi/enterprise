<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TrackingController;

Route::post('/login', [AuthController::class, 'login']);
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
Route::post('/track/update-status', [TrackingController::class, 'updateStatus']);

