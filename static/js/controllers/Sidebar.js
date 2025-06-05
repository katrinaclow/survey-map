export class Sidebar {
  constructor(sidebarId, backdropId) {
    this.el       = document.getElementById(sidebarId);
    this.backdrop = document.getElementById(backdropId);
    this.details  = this.el.querySelector('#job-details');
    this.backdrop.addEventListener('click', () => this.hide());
  }

  show(p) {
    this.details.innerHTML = `
      <p><strong>Job Number:</strong> ${p.job_number}</p>
      <p><strong>Client:</strong> ${p.client}</p>
      <p><strong>Location:</strong> ${p.location}</p>
      <p><strong>Road:</strong> ${p.road}</p>
      <p><strong>Civic:</strong> ${p.civic}</p>
      <p><strong>Address:</strong> ${p.address}</p>
      <p><strong>PID:</strong> ${p.pid}</p>
      <p><strong>Latitude:</strong> ${p.latitude}</p>
      <p><strong>Longitude:</strong> ${p.longitude}</p>
      <p><strong>Date Created:</strong> ${p.date_created}</p>
      <p><strong>Worksheet Created:</strong> ${p.worksheet_created}</p>
      <p><strong>Preliminary Required:</strong> ${p.preliminary_required}</p>
      <p><strong>Application Submitted:</strong> ${p.application_submitted}</p>
      <p><strong>Preliminary Plan Completed:</strong> ${p.preliminary_plan_completed}</p>
      <p><strong>Preliminary Submitted:</strong> ${p.preliminary_submitted}</p>
      <p><strong>Preliminary Approved:</strong> ${p.preliminary_approved}</p>
      <p><strong>Initial Fieldwork Completed:</strong> ${p.initial_fieldwork_completed}</p>
      <p><strong>Plan Ready for Check:</strong> ${p.plan_ready_for_check}</p>
      <p><strong>Survey Markers Set:</strong> ${p.survey_markers_set}</p>
      <p><strong>Plan to be Registered:</strong> ${p.plan_to_be_registered}</p>
      <p><strong>Plan Registered:</strong> ${p.plan_registered}</p>
      <p><strong>Final Plan Submitted:</strong> ${p.final_plan_submitted}</p>
      <p><strong>Invoiced:</strong> ${p.invoiced}</p>
      <p><strong>Paid:</strong> ${p.paid}</p>
      <p><strong>Method:</strong> ${p.method}</p>
      <p><strong>Employee:</strong> ${p.employee}</p>
    `;
    this.el.classList.add('visible');
    this.backdrop.classList.add('visible');
  }

  hide() {
    this.el.classList.remove('visible');
    this.backdrop.classList.remove('visible');
  }
}