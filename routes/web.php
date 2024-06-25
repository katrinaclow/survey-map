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
    // Fetch GeoJSON data from Google Drive or any other storage
    $filename = 'jobData.geojson';
    $rawData = Storage::cloud()->get('jobData.geojson');
    $geoJsonData = json_decode($rawData, true); // Convert JSON string to PHP array

    return view('map', [
        'geoJsonData' => $geoJsonData,
    ]);
});

Route::get('get', function () {
    $filename = 'jobData.geojson';
    $file = Gdrive::get('jobData.geojson');
    $rawData = Storage::cloud()->get('jobData.geojson');

    return response($rawData, 200)
        ->header('Content-Type', 'application/json') // Set Content-Type to GeoJSON
        ->header('Content-Disposition', "attachment; filename=\"$filename\"");
});
