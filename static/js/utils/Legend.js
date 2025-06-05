export class Legend {
  /**
   * @param {string} title  Heading text for the legend
   * @param {Array<{ className: string, label: string }>} items
   *   Array of legend items: CSS class for color swatch + label.
   * @param {string} position  Leaflet control position (e.g. 'bottomright')
   */
  constructor(
    title = 'Job Status',
    items = [
      { className: 'legend-red',    label: 'Project Created' },
      { className: 'legend-orange', label: 'Fieldwork Completed' },
      { className: 'legend-yellow', label: 'Survey Markers Set' },
      { className: 'legend-green',  label: 'Final Plan Submitted' }
    ],
    position = 'bottomright'
  ) {
    this.title    = title;
    this.items    = items;
    this.position = position;
  }

  /**
   * Adds the legend control to the given Leaflet map.
   * @param {L.Map} map
   * @returns {L.Control}  The legend control instance
   */
  addTo(map) {
    const ctrl = L.control({ position: this.position });
    ctrl.onAdd = () => {
      const container = L.DomUtil.create('div', 'info legend');
      let html = `<h4>${this.title}</h4>`;
      this.items.forEach(item => {
        html += `
          <div class="legend-item">
            <span class="legend-circle ${item.className}"></span>
            ${item.label}
          </div>`;
      });
      container.innerHTML = html;
      return container;
    };
    ctrl.addTo(map);
    return ctrl;
  }
}