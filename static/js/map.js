// Initialize the map and set its view to your desired location
const initializeMap = () => {
    return L.map('map').setView([46.45, -63.30], 9);
};

const map = initializeMap();

// Define base map layers
const baseLayers = {
    "Basic": L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map),
    "Topographical": L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: 'Map data &copy; OpenStreetMap contributors, SRTM | Style: OpenTopoMap',
    }),
    "Satellite": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri",
    }),
};

const controlLayers = L.control.layers(baseLayers, {}, {
    position: 'topright',
    collapsed: false
}).addTo(map);

// Layer groups for each year and completed jobs
const yearLayers = {};
const completedJobsLayer = L.layerGroup(); // Completed jobs layer group
const markers = []; // Array to hold markers for search functionality

// Define custom completed icon
const createCompletedIcon = () => {
    return L.icon({
        iconUrl: "https://clipart-library.com/images_k/red-check-mark-transparent-background/red-check-mark-transparent-background-22.png",
        iconSize: [20, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, -8]
    });
};

const completedIcon = createCompletedIcon();

// Function to generate popup content for a job marker
const generatePopupContent = (properties) => {
    return `
            <h1>${properties.job_number}</h1>
            <p><strong>Client:</strong> ${properties.client}</p>
            <p><strong>Address:</strong> ${properties.address}</p>
            <p><strong>PID:</strong> ${properties.pid}</p>
            <p><strong>Fieldwork Completed:</strong> ${properties.initial_fieldwork_completed || "N/A"}</p>
            <p><strong>Survey Markers Set:</strong> ${properties.survey_markers_set || "N/A"}</p>
            <p><strong>Final Plan Submitted:</strong> ${properties.final_plan_submitted || "N/A"}</p>
            <p><strong>Date Created:</strong> ${properties.date_created}</p>
        `;
};

// Function to check completion status
const isJobCompleted = (status) => {
    return ["yes", "y", "na"].includes((status || "").toLowerCase());
};

// Function to add a marker to the corresponding year layer or completed jobs layer
const addMarkerToLayer = (feature, latlng) => {
    let marker;

    // Check if the job is completed and use the custom icon
    if (isJobCompleted(feature.properties.final_plan_submitted)) {
        marker = L.marker(latlng, {icon: completedIcon}).bindPopup(generatePopupContent(feature.properties));
        completedJobsLayer.addLayer(marker);  // Add to completed jobs layer
    } else {
        marker = L.circleMarker(latlng, {
            radius: 8,
            fillColor: "#ff0000",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        }).bindPopup(generatePopupContent(feature.properties));

        const jobYear = new Date(feature.properties.date_created).getFullYear();

        if (!yearLayers[jobYear]) {
            yearLayers[jobYear] = L.markerClusterGroup({
                maxClusterRadius: 40,
                disableClusteringAtZoom: 40
            });
            controlLayers.addOverlay(yearLayers[jobYear], `Jobs from ${jobYear}`);
        }

        yearLayers[jobYear].addLayer(marker);
    }

    // Add marker to search index
    markers.push({
        marker: marker,
        properties: feature.properties
    });

    return marker;
};

// Function to load GeoJSON data
const loadGeoJsonData = () => {
    fetch("/static/job_data.geojson")
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch GeoJSON: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            L.geoJSON(data, {
                pointToLayer: addMarkerToLayer
            });
            controlLayers.addOverlay(completedJobsLayer, "Completed Jobs");


            // Initialize Leaflet Search Control to search across all layers
            const searchControl = new L.Control.Search({
                layer: L.featureGroup([completedJobsLayer, ...Object.values(yearLayers)]),  // Combine all layers into a feature group
                propertyName: 'job_number',  // Property to search on
                marker: false,
                initial: false,
                zoom: 10,
                moveToLocation: function (latlng, title, map) {
                    map.setView(latlng, this._zoom);  // Zoom to marker location
                },
                textPlaceholder: "Search for Job Number..."
            });


            map.addControl(searchControl);

            // Add markers to search index across all layers
            markers.forEach(({marker, properties}) => {
                searchControl.index.addMarker(marker, properties.job_number);
            });
        })
        .catch(error => console.error("Error loading GeoJSON data:", error));
};

// Load GeoJSON data for year layers and completed jobs
loadGeoJsonData();

// Function to load monument data
const loadMonumentData = () => {
    fetch("/static/pei_control_monuments.geojson")
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch monuments GeoJSON: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            const monumentsLayer = L.layerGroup();
            L.geoJSON(data, {
                pointToLayer: (feature, latlng) => L.circleMarker(latlng, {
                    radius: 4,
                    fillColor: "#00bfff",
                    color: "#000",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8,
                })
            }).addTo(monumentsLayer);
            controlLayers.addOverlay(monumentsLayer, "Monuments");
        })
        .catch(error => console.error("Error loading monument data:", error));
};

// Load monument data
loadMonumentData();

