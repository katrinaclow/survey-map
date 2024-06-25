<x-layout>
    <x-slot name="heading">
        Map Page
    </x-slot>

    @php $markerCoordinates = []; @endphp
    @foreach($geoJsonData['features'] as $feature)
        @php
            $jobNumber = $feature['properties']['jobNumber'];
            $client = $feature['properties']['client'];
            $location = $feature['properties']['location'];
            $pid = $feature['properties']['pid'];
            $lat = $feature['properties']['latitude'];
            $long = $feature['properties']['longitude'];

            // Add marker coordinates to the array
            $markerCoordinates[] = ['lat' => $long, 'long' => $lat];
        @endphp
    @endforeach

    <x-maps-leaflet :centerPoint="['lat' =>46.45, 'long' => -63.30]" :zoomLevel="9.5"
                    :markers="$markerCoordinates"></x-maps-leaflet>
</x-layout>
