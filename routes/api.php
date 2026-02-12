<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TrackingController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/track/activity', [TrackingController::class, 'store']);
Route::get('/track/data', [TrackingController::class, 'data']);
Route::delete('/track/data/{id}', [TrackingController::class, 'destroy']);

