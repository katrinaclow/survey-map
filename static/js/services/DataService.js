export class DataService {
  constructor(baseUrl = '/static/geojson') {
    this.baseUrl = baseUrl;
  }

  async fetchJobs() {
    const res = await fetch(`${this.baseUrl}/job_data.geojson`);
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }

  async fetchMonuments() {
    const res = await fetch(`${this.baseUrl}/pei_control_monuments.geojson`);
    if (!res.ok) throw new Error(`Failed to fetch monuments: ${res.status}`);
    return res.json();
  }
}