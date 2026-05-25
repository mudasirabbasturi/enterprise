<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Would you like the install button to appear on all pages?
      Set true/false
    |--------------------------------------------------------------------------
    */

    'install-button' => true,

    /*
    |--------------------------------------------------------------------------
    | PWA Manifest Configuration
    |--------------------------------------------------------------------------
    |  php artisan erag:update-manifest
    */

    'manifest' => [
        'name' => 'Enterprise',
        'short_name' => 'ERP',
        'background_color' => '#3E4093',
        'display' => 'fullscreen',
        'description' => 'Enterprise Resource Planning By Bidwinneres Soluctions',
        'theme_color' => '#3E4093',
        'icons' => [
            [
                'src' => 'uploads/images/bidwinner-logo.jpg',
                'sizes' => '512x512',
                'type' => 'image/jpeg',
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Debug Configuration
    |--------------------------------------------------------------------------
    | Toggles the application's debug mode based on the environment variable
    */

    'debug' => env('APP_DEBUG', false),

    /*
    |--------------------------------------------------------------------------
    | Livewire Integration
    |--------------------------------------------------------------------------
    | Set to true if you're using Livewire in your application to enable
    | Livewire-specific PWA optimizations or features.
    */

    'livewire-app' => false,
];
