import {DataService} from "../services/DataService.js";
import {Sidebar} from "./Sidebar.js";
import {MarkerFactory} from "../utils/MarkerFactory.js";
import {Legend} from "../utils/Legend.js";

export class MapController {
	constructor(mapId) {
		// map + base layers
		this.map = L.map(mapId).setView([46.45, -63.3], 9);
		this.baseLayers = {
			Topographic: L.esri.basemapLayer("Topographic").addTo(this.map),
			Satellite: L.esri.basemapLayer("Imagery"),
			Streets: L.esri.basemapLayer("Streets"),
		};
		this.controlLayers = L.control
			.layers(this.baseLayers, {}, {position: "topright", collapsed: false})
			.addTo(this.map);

		// containers
		this.yearLayers = {};
		this.completedLayer = L.layerGroup();
		this.markers = [];

		// services & UI
		this.dataService = new DataService();
		this.sidebar = new Sidebar("job-info-sidebar", "sidebar-backdrop");
	}

	async init() {
		await this.loadJobData();
		await this.loadMonumentData();
		this.createLegend();
		L.control.scale({position: "bottomleft"}).addTo(this.map);
		new Legend().addTo(this.map);
	}

	async loadJobData() {
		try {
			const data = await this.dataService.fetchJobs();
			L.geoJSON(data, {
				pointToLayer: (feat, latlng) => this._addJobMarker(feat, latlng),
			});
			this.controlLayers.addOverlay(this.completedLayer, "Completed Jobs");

			const searchControl = new L.Control.Search({
				layer: L.featureGroup([
					this.completedLayer,
					...Object.values(this.yearLayers),
				]),
				propertyName: "job_number",
				marker: false,
				initial: false,
				zoom: 10,
				moveToLocation: (latlng) => this.map.setView(latlng, 10),
				textPlaceholder: "Search for Job Number...",
			});
			this.map.addControl(searchControl);
		} catch (err) {
			console.error("Error loading job data:", err);
		}
	}

	_addJobMarker(feature, latlng) {
		const p = feature.properties;
		const marker = MarkerFactory.createJobMarker(p, latlng, this.sidebar);

		if (MarkerFactory.isJobCompleted(p.final_plan_submitted)) {
			this.completedLayer.addLayer(marker);
		}

		const year = new Date(p.date_created).getFullYear();
		if (!this.yearLayers[year]) {
			this.yearLayers[year] = L.markerClusterGroup({
				maxClusterRadius: 40,
				disableClusteringAtZoom: 12,
			});
			this.controlLayers.addOverlay(this.yearLayers[year], ` ${year}`);
		}
		this.yearLayers[year].addLayer(marker);

		this.markers.push({marker, props: p});
		return marker;
	}

	async loadMonumentData() {
		try {
			const data = await this.dataService.fetchMonuments();
			const monLayer = L.layerGroup();

			L.geoJSON(data, {
				pointToLayer: (feat, latlng) =>
					MarkerFactory.createMonumentMarker(feat.properties, latlng),
			}).addTo(monLayer);

			this.controlLayers.addOverlay(monLayer, "Monuments");
		} catch (err) {
			console.error("Error loading monument data:", err);
		}
	}

	createLegend() {
		const legend = L.control({position: "bottomright"});
		legend.onAdd = () => {
			const div = L.DomUtil.create("div", "info legend");
			div.innerHTML = `
        <h4>Job Status</h4>
        <div class="legend-item">
          <span class="legend-circle legend-red"></span>Project Created
        </div>
        <div class="legend-item">
          <span class="legend-circle legend-orange"></span>Fieldwork Completed
        </div>
        <div class="legend-item">
          <span class="legend-circle legend-yellow"></span>Survey Markers Set
        </div>
        <div class="legend-item">
          <span class="legend-circle legend-green"></span>Final Plan Submitted
        </div>
      `;
			return div;
		};
		legend.addTo(this.map);
	}
}
