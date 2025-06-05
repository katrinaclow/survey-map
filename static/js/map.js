// Initialize map
const map = L.map("map").setView([46.45, -63.3], 9);

// Base layers
const baseLayers = {
	Topographic: L.esri.basemapLayer("Topographic").addTo(map),
	Satellite: L.esri.basemapLayer("Imagery"),
	Streets: L.esri.basemapLayer("Streets"),
};

// Layer control
const controlLayers = L.control
	.layers(baseLayers, {}, {position: "topright", collapsed: false})
	.addTo(map);

// Containers for markers
const yearLayers = {};
const completedJobsLayer = L.layerGroup();
const markers = [];

// Helpers
function isJobCompleted(status) {
	return ["yes", "y", "na"].includes((status || "").toLowerCase());
}

function getMarkerColor(p) {
	if (isJobCompleted(p.final_plan_submitted)) return "#008000";
	if (isJobCompleted(p.survey_markers_set)) return "#ffd700";
	if (isJobCompleted(p.initial_fieldwork_completed)) return "#ffa500";
	return "#ff0000";
}

function generatePopupContent(p) {
	return `
    <h1>${p.job_number}</h1>
    <p><strong>Client:</strong> ${p.client}</p>
    <p><strong>Address:</strong> ${p.address}</p>
    <p><strong>PID:</strong> ${p.pid}</p>
    <p><strong>Fieldwork Completed:</strong> ${
			p.initial_fieldwork_completed || " "
		}</p>
    <p><strong>Survey Markers Set:</strong> ${p.survey_markers_set || " "}</p>
    <p><strong>Final Plan Submitted:</strong> ${
			p.final_plan_submitted || " "
		}</p>
    <p><strong>Date Created:</strong> ${p.date_created}</p>
    <button class="details-btn">Additional Details</button>
  `;
}

// Sidebar
let selectedJobDetails = {};
function showDetails() {
	const sb = document.getElementById("job-info-sidebar");
	const bd = document.getElementById("sidebar-backdrop");
	const ct = document.getElementById("job-details");
	ct.innerHTML = `
    <p><strong>Job Number:</strong> ${selectedJobDetails.job_number}</p>
    <p><strong>Client:</strong> ${selectedJobDetails.client}</p>
    <p><strong>Location:</strong> ${selectedJobDetails.location}</p>
    <p><strong>Road:</strong> ${selectedJobDetails.road}</p>
    <p><strong>Civic:</strong> ${selectedJobDetails.civic}</p>
    <p><strong>Address:</strong> ${selectedJobDetails.address}</p>
    <p><strong>PID:</strong> ${selectedJobDetails.pid}</p>
    <p><strong>Latitude:</strong> ${selectedJobDetails.latitude}</p>
    <p><strong>Longitude:</strong> ${selectedJobDetails.longitude}</p>
    <p><strong>Date Created:</strong> ${selectedJobDetails.date_created}</p>
    <p><strong>Worksheet Created:</strong> ${selectedJobDetails.worksheet_created}</p>
    <p><strong>Preliminary Required:</strong> ${selectedJobDetails.preliminary_required}</p>
    <p><strong>Application Submitted:</strong> ${selectedJobDetails.application_submitted}</p>
    <p><strong>Preliminary Plan Completed:</strong> ${selectedJobDetails.preliminary_plan_completed}</p>
    <p><strong>Preliminary Submitted:</strong> ${selectedJobDetails.preliminary_submitted}</p>
    <p><strong>Preliminary Approved:</strong> ${selectedJobDetails.preliminary_approved}</p>
    <p><strong>Initial Fieldwork Completed:</strong> ${selectedJobDetails.initial_fieldwork_completed}</p>
    <p><strong>Plan Ready for Check:</strong> ${selectedJobDetails.plan_ready_for_check}</p>
    <p><strong>Survey Markers Set:</strong> ${selectedJobDetails.survey_markers_set}</p>
    <p><strong>Plan to be Registered:</strong> ${selectedJobDetails.plan_to_be_registered}</p>
    <p><strong>Plan Registered:</strong> ${selectedJobDetails.plan_registered}</p>
    <p><strong>Final Plan Submitted:</strong> ${selectedJobDetails.final_plan_submitted}</p>
    <p><strong>Invoiced:</strong> ${selectedJobDetails.invoiced}</p>
    <p><strong>Paid:</strong> ${selectedJobDetails.paid}</p>
    <p><strong>Method:</strong> ${selectedJobDetails.method}</p>
    <p><strong>Employee:</strong> ${selectedJobDetails.employee}</p>
  `;
	sb.classList.add("visible");
	bd.classList.add("visible");
}

function hideSidebar() {
	document.getElementById("job-info-sidebar").classList.remove("visible");
	document.getElementById("sidebar-backdrop").classList.remove("visible");
}
document
	.getElementById("sidebar-backdrop")
	.addEventListener("click", hideSidebar);

// Add markers
function addMarkerToLayer(feature, latlng) {
	const p = feature.properties;
	const marker = L.circleMarker(latlng, {
		radius: 10,
		color: "#000",
		weight: 2,
		opacity: 1,
		fillColor: getMarkerColor(p),
		fillOpacity: 0.8,
	}).bindPopup(generatePopupContent(p));

	marker.on("click", () => {
		selectedJobDetails = p;
		showDetails();
	});

	if (isJobCompleted(p.final_plan_submitted)) {
		completedJobsLayer.addLayer(marker);
	}

	const year = new Date(p.date_created).getFullYear();
	if (!yearLayers[year]) {
		yearLayers[year] = L.markerClusterGroup({
			maxClusterRadius: 40,
			disableClusteringAtZoom: 12,
		});
		controlLayers.addOverlay(yearLayers[year], ` ${year}`);
	}
	yearLayers[year].addLayer(marker);

	markers.push({marker, properties: p});
	return marker;
}

// Load job data
async function loadGeoJsonData() {
	try {
		const res = await fetch("/static/geojson/job_data.geojson");
		const data = await res.json();
		L.geoJSON(data, {pointToLayer: addMarkerToLayer});
		controlLayers.addOverlay(completedJobsLayer, "Completed Jobs");
		const searchControl = new L.Control.Search({
			layer: L.featureGroup([completedJobsLayer, ...Object.values(yearLayers)]),
			propertyName: "job_number",
			marker: false,
			initial: false,
			zoom: 10,
			moveToLocation: (latlng) => map.setView(latlng, 10),
			textPlaceholder: "Search for Job Number...",
		});
		map.addControl(searchControl);
	} catch (err) {
		console.error("Error loading job data:", err);
	}
}

// Load monument data
async function loadMonumentData() {
	try {
		const res = await fetch("/static/geojson/pei_control_monuments.geojson");
		if (!res.ok) throw new Error(`Status ${res.status}`);
		const data = await res.json();
		const monLayer = L.layerGroup();
		L.geoJSON(data, {
			pointToLayer: (feat, latlng) => {
				if (feat.properties.status?.toLowerCase() === "intact") {
					const {monument, status, nad83_lat, nad83_long, nad83_e, nad83_n} =
						feat.properties;
					const popup = `
            <strong>Monument:</strong> ${monument}<br>
            <strong>Status:</strong> ${status}<br>
            <strong>Latitude:</strong> ${latlng.lat.toFixed(6)}<br>
            <strong>Longitude:</strong> ${latlng.lng.toFixed(6)}<br>
            <strong>NAD83 Lat:</strong> ${nad83_lat || "N/A"}<br>
            <strong>NAD83 Long:</strong> ${nad83_long || "N/A"}<br>
            <strong>NAD83 E:</strong> ${nad83_e || "N/A"}<br>
            <strong>NAD83 N:</strong> ${nad83_n || "N/A"}
          `;
					return L.circleMarker(latlng, {
						radius: 4,
						fillColor: "#00bfff",
						color: "#000",
						weight: 1,
						opacity: 1,
						fillOpacity: 0.8,
					}).bindPopup(popup);
				}
			},
		}).addTo(monLayer);
		controlLayers.addOverlay(monLayer, "Monuments");
	} catch (err) {
		console.error("Error loading monument data:", err);
	}
}

// Legend
function createLegend() {
	const legend = L.control({position: "bottomright"});
	legend.onAdd = () => {
		const div = L.DomUtil.create("div", "info legend");
		div.innerHTML = `
      <h4>Job Status</h4>
      <div class="legend-item"><span class="legend-circle legend-red"></span>Project Created</div>
      <div class="legend-item"><span class="legend-circle legend-orange"></span>Fieldwork Completed</div>
      <div class="legend-item"><span class="legend-circle legend-yellow"></span>Survey Markers Set</div>
      <div class="legend-item"><span class="legend-circle legend-green"></span>Final Plan Submitted</div>
    `;
		return div;
	};
	legend.addTo(map);
}

// Initialize
loadGeoJsonData();
loadMonumentData();
createLegend();
L.control.scale({position: "bottomleft"}).addTo(map);
