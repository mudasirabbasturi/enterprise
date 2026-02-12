<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class WorkScheduleController extends Controller
{
    public function Index()
    {
        return Inertia::render('Pages/WorkSchedule/Index');
    }
}
