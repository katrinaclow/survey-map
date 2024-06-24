<?php

use Illuminate\Support\Facades\Route;
use Yaza\LaravelGoogleDriveStorage\Gdrive;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return view('index');
});

Route::get('/about', function () {
    return view('about');
});

Route::get('/contact', function () {
    return view('contact');
});

Route::get('/map', function () {
    return view('map');
});

Route::get('get', function() {
    $data = Gdrive::get('jobData.geojson');

    return response($data->file, 200)
        ->header('Content-Type', $data->ext);
});
