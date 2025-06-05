import os
import json
from flask import Flask, render_template, jsonify, make_response, send_from_directory
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import logging

app = Flask(__name__)

# Configuration
GOOGLE_CRED_FILE = os.getenv('GOOGLE_CRED_JSON', 'credentials.json')
GOOGLE_SHEET_NAME = os.getenv('GOOGLE_SHEET_NAME', 'Locus Surveys Jobs')
GEOJSON_DIR = os.path.join(app.root_path, 'static', 'geojson')
JOB_GEOJSON_PATH = os.path.join(GEOJSON_DIR, 'job_data.geojson')
SCOPE = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/drive"
]

JOB_FIELDS = [
  ("job_number",       "Job Number"),
  ("client",           "Client"),
  ("location",         "Location"),
  ("road",             "Road"),
  ("civic",            "Civic"),
  ("address",          "Address"),
  ("pid",              "PID"),
  ("latitude",         "Latitude"),
  ("longitude",        "Longitude"),
  ("date_created",     "Date Created"),
  ("worksheet_created", "Worksheet Created"),
  ("preliminary_required", "Preliminary Required"),
  ("application_submitted", "Application Submitted"),
  ("preliminary_plan_completed", "Preliminary Plan Completed"),
  ("preliminary_submitted", "Preliminary Submitted"),
  ("preliminary_approved", "Preliminary Approved"),
  ("initial_fieldwork_completed", "Initial Fieldwork Completed"),
  ("plan_ready_for_check", "Plan Ready for Check"),
  ("survey_markers_set", "Survey Markers Set"),
  ("plan_to_be_registered", "Plan to be Registered"),
  ("plan_registered", "Plan Registered"),
  ("final_plan_submitted", "Final Plan Submitted"),
  ("invoiced",         "Invoiced"),
  ("paid",             "Paid"),
  ("method",           "Method"),
  ("employee",         "Employee"),
]

logger = logging.getLogger(__name__)

def build_feature_collection():
    """Fetch all worksheets and build a GeoJSON FeatureCollection."""
    creds = ServiceAccountCredentials.from_json_keyfile_name(GOOGLE_CRED_FILE, SCOPE)
    client = gspread.authorize(creds)
    sheet = client.open(GOOGLE_SHEET_NAME)

    features = []
    try:
        for ws in sheet.worksheets():
            for record in ws.get_all_records():
                try:
                    lat = float(record.get('Latitude', 0))
                    lon = float(record.get('Longitude', 0))
                except ValueError:
                    continue
                date_created = record.get('Date Created')
                if not date_created:
                    continue

                props = { out: record.get(inp, '') for out, inp in JOB_FIELDS }
                props.update({
                    "latitude":       lat,
                    "longitude":      lon,
                    "date_created":   date_created,
                    "address":        f"{props['civic']} {props['road']}, {props['location']}"
                })

                features.append({
                    "type":       "Feature",
                    "geometry":   {"type": "Point", "coordinates": [lon, lat]},
                    "properties": props
                })
    except Exception as e:
        logger.error("Failed to read %s: %s", ws.title, e)

    return {"type": "FeatureCollection", "features": features}

def update_geojson():
    """Write the jobs GeoJSON to disk once at startup."""
    fc = build_feature_collection()
    os.makedirs(GEOJSON_DIR, exist_ok=True)
    with open(JOB_GEOJSON_PATH, 'w') as f:
        json.dump(fc, f, indent=4)


@app.route('/static/geojson/<filename>')
def serve_geojson(filename):
    """Serve GeoJSON files with caching headers."""
    try:
        return send_from_directory(
            GEOJSON_DIR, 
            filename, 
            conditional=True,
            as_attachment=False
        )
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404

@app.route('/')
def index():
    return render_template('map.html')


if __name__ == '__main__':
    # Ensure data is generated before the first run
    update_geojson()
    app.run(debug=True)
