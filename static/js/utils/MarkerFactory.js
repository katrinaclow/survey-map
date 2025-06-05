export class MarkerFactory {
  static isJobCompleted(status) {
    return ['yes','y','na'].includes((status||'').toLowerCase());
  }

  static getColor(p) {
    if (MarkerFactory.isJobCompleted(p.final_plan_submitted))        return '#008000';
    if (MarkerFactory.isJobCompleted(p.survey_markers_set))          return '#ffd700';
    if (MarkerFactory.isJobCompleted(p.initial_fieldwork_completed)) return '#ffa500';
    return '#ff0000';
  }

  static getJobPopupHtml(p) {
    return `
      <h1>${p.job_number}</h1>
      <p><strong>Client:</strong> ${p.client}</p>
      <p><strong>Address:</strong> ${p.address}</p>
      <p><strong>PID:</strong> ${p.pid}</p>
      <p><strong>Fieldwork Completed:</strong> ${p.initial_fieldwork_completed||' '}</p>
      <p><strong>Survey Markers Set:</strong> ${p.survey_markers_set||' '}</p>
      <p><strong>Final Plan Submitted:</strong> ${p.final_plan_submitted||' '}</p>
      <p><strong>Date Created:</strong> ${p.date_created}</p>
      <button class="details-btn">Additional Details</button>
    `;
  }

  static createJobMarker(p, latlng, sidebar) {
    const marker = L.circleMarker(latlng, {
      radius:       10,
      color:        '#000',
      weight:       2,
      opacity:      1,
      fillColor:    MarkerFactory.getColor(p),
      fillOpacity:  0.8
    }).bindPopup(MarkerFactory.getJobPopupHtml(p));

    marker.on('click', () => sidebar.show(p));
    return marker;
  }

  static createMonumentMarker(props, latlng) {
    if (props.status?.toLowerCase() !== 'intact') return;
    const popup = `
      <strong>Monument:</strong> ${props.monument}<br>
      <strong>Status:</strong> ${props.status}<br>
      <strong>Latitude:</strong> ${latlng.lat.toFixed(6)}<br>
      <strong>Longitude:</strong> ${latlng.lng.toFixed(6)}<br>
      <strong>NAD83 Lat:</strong> ${props.nad83_lat || 'N/A'}<br>
      <strong>NAD83 Long:</strong> ${props.nad83_long||'N/A'}<br>
      <strong>NAD83 E:</strong> ${props.nad83_e || 'N/A'}<br>
      <strong>NAD83 N:</strong> ${props.nad83_n || 'N/A'}
    `;
    return L.circleMarker(latlng, {
      radius:      4,
      fillColor:   '#00bfff',
      color:       '#000',
      weight:      1,
      opacity:     1,
      fillOpacity: 0.8
    }).bindPopup(popup);
  }
}