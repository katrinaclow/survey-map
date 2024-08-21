// Initialize the map and set its view to your desired location
const initializeMap = () => {
    return L.map('map').setView([46.45, -63.30], 9);
};

const map = initializeMap();

// Add ArcGIS Basemap instead of OpenStreetMap
const baseLayers = {
    "ArcGIS Topographic": L.esri.basemapLayer("Topographic").addTo(map), // ArcGIS Topographic Basemap
    "ArcGIS Satellite": L.esri.basemapLayer("Imagery"), // ArcGIS Satellite Basemap
    "ArcGIS Streets": L.esri.basemapLayer("Streets") // ArcGIS Streets Basemap
};


const controlLayers = L.control.layers(baseLayers, {}, {
    position: 'topright',
    collapsed: false
}).addTo(map);

// Layer groups for each year and completed jobs
const yearLayers = {};
const completedJobsLayer = L.layerGroup();
const markers = [];


// Function to generate popup content for a job marker
const generatePopupContent = (properties) => {
    return `
        <h1>${properties.job_number}</h1>
        <p><strong>Client:</strong> ${properties.client}</p>
        <p><strong>Address:</strong> ${properties.address}</p>
        <p><strong>PID:</strong> ${properties.pid}</p>
        <p><strong>Fieldwork Completed:</strong> ${properties.initial_fieldwork_completed || " "}</p>
        <p><strong>Survey Markers Set:</strong> ${properties.survey_markers_set || " "}</p>
        <p><strong>Final Plan Submitted:</strong> ${properties.final_plan_submitted || " "}</p>
        <p><strong>Date Created:</strong> ${properties.date_created}</p>
        <button class="details-btn" onclick="showDetails(${JSON.stringify(properties)})">Additional Details</button>
    `;
};

// Function to check completion status
const isJobCompleted = (status) => {
    return ["yes", "y", "na"].includes((status || "").toLowerCase());
};

// Function to add a marker to the corresponding year layer or completed jobs layer
const addMarkerToLayer = (feature, latlng) => {
    let marker;

    // Determine the marker color based on the status
    let color = "#ff0000";  // Default to red (project created)

    if (isJobCompleted(feature.properties.final_plan_submitted)) {
        color = "#008000";  // Green (final plan submitted)
    } else if (isJobCompleted(feature.properties.survey_markers_set)) {
        color = "#ffd700";  // Yellow (survey markers set)
    } else if (isJobCompleted(feature.properties.initial_fieldwork_completed)) {
        color = "#ffa500";  // Orange (fieldwork completed)
    }

    marker = L.circleMarker(latlng, {
        radius: 10,
        fillColor: color,
        color: "#000000",  // Keep the border color black
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
    }).bindPopup(generatePopupContent(feature.properties));

    // If the job is completed (final plan submitted), add to the completed jobs layer
    if (isJobCompleted(feature.properties.final_plan_submitted)) {
        completedJobsLayer.addLayer(marker);
    }

    // Add the marker to the appropriate year layer
    const jobYear = new Date(feature.properties.date_created).getFullYear();

    if (!yearLayers[jobYear]) {
        yearLayers[jobYear] = L.markerClusterGroup({
            maxClusterRadius: 40,
            disableClusteringAtZoom: 12
        });
        controlLayers.addOverlay(yearLayers[jobYear], ` ${jobYear}`);
    }

    yearLayers[jobYear].addLayer(marker);

    // Add the marker to the search index
    markers.push({ marker, properties: feature.properties });

    return marker;
};


// Function to load GeoJSON data
const loadGeoJsonData = () => {
    fetch("/static/geojson/job_data.geojson")
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, {
                pointToLayer: addMarkerToLayer
            });

            controlLayers.addOverlay(completedJobsLayer, "Completed Jobs");
            const searchControl = new L.Control.Search({
                layer: L.featureGroup([completedJobsLayer, ...Object.values(yearLayers)]),
                propertyName: 'job_number',
                marker: false,
                initial: false,
                zoom: 10,
                moveToLocation: function (latlng, title, map) {
                    map.setView(latlng, this._zoom);
                },
                textPlaceholder: "Search for Job Number..."
            });

            map.addControl(searchControl);
        })
        .catch(error => console.error("Error loading GeoJSON data:", error));
};

loadGeoJsonData();


// Function to load monument data and filter for intact monuments
const loadMonumentData = () => {
    fetch("/static/geojson/pei_control_monuments.geojson")
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch monuments GeoJSON: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            const monumentsLayer = L.layerGroup(); // Layer for monuments

            L.geoJSON(data, {
                pointToLayer: (feature, latlng) => {
                    // Check if the monument's status is 'Intact'
                    if (feature.properties.status && feature.properties.status.toLowerCase() === 'intact') {
                        const {monument, status, nad83_lat, nad83_long, nad83_e, nad83_n} = feature.properties;

                        // Display monument information along with geographical coordinates and NAD data
                        const popupContent = `
                            <strong>Monument:</strong> ${monument}<br>
                            <strong>Status:</strong> ${status}<br>
                            <strong>Latitude:</strong> ${latlng.lat.toFixed(6)}<br>
                            <strong>Longitude:</strong> ${latlng.lng.toFixed(6)}<br>
                            <strong>NAD83 Latitude:</strong> ${nad83_lat || 'N/A'}<br>
                            <strong>NAD83 Longitude:</strong> ${nad83_long || 'N/A'}<br>
                            <strong>NAD83 E:</strong> ${nad83_e || 'N/A'}<br>
                            <strong>NAD83 N:</strong> ${nad83_n || 'N/A'}
                        `;

                        return L.circleMarker(latlng, {
                            radius: 4,
                            fillColor: "#00bfff",  // Light blue color for intact monuments
                            color: "#000",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.8
                        }).bindPopup(popupContent);
                    }
                }
            }).addTo(monumentsLayer);

            controlLayers.addOverlay(monumentsLayer, "Monuments");
        })
        .catch(error => console.error("Error loading monument data:", error));
};

// Load monument data
loadMonumentData();

function createLegend() {
    const legend = L.control({ position: 'bottomright' });

    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend');
        div.innerHTML += '<h4>Job Status</h4>';
        div.innerHTML += '<div class="legend-item"><span class="legend-circle legend-red"></span>Project Created</div>';
        div.innerHTML += '<div class="legend-item"><span class="legend-circle legend-orange"></span>Fieldwork Completed</div>';
        div.innerHTML += '<div class="legend-item"><span class="legend-circle legend-yellow"></span>Survey Markers Set</div>';
        div.innerHTML += '<div class="legend-item"><span class="legend-circle legend-green"></span>Final Plan Submitted</div>';
        return div;
    };

    legend.addTo(map);
}

createLegend();


// Add a scale bar to the map
L.control.scale({ position: 'bottomleft' }).addTo(map);


