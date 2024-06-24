
<x-layout>
    <x-slot:heading>
        Map Page
    </x-slot:heading>
    <h1>Map Page Content</h1>

    <x-maps-leaflet :centerPoint="['lat' => 46.45, 'long' => -63.30]" :zoomLevel="9.5" ></x-maps-leaflet>
{{--            <x-maps-marker :centerPoint="['lat' => 46.45, 'long' => -63.30]" :popup="'<b>Charlottetown</b>'"></x-maps-marker>--}}
{{--        <x-maps-marker :centerPoint="['lat' => 46.25, 'long' => -63.13]" :popup="'<b>Summerside</b>'"></x-maps-marker>--}}
</x-layout>

