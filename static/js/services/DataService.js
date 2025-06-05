export class DataService {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  async fetchJobs() {
    const res = await fetch(`${this.baseUrl}/jobs.geojson`);
    if (!res.ok) throw new Error(`Failed to fetch job data: ${res.status}`);
    return res.json();
  }

  async fetchMonuments() {
    const res = await fetch(`${this.baseUrl}/pei_control_monuments.geojson`);
    if (!res.ok) throw new Error(`Failed to fetch monuments: ${res.status}`);
    return res.json();
  }
}