from flask import Flask, render_template
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import json

app = Flask(__name__)

data_updated = False

@app.before_request
def update_geojson_once():
    global data_updated
    if not data_updated:
        update_geojson()
        data_updated = True

def update_geojson():
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    credentials = ServiceAccountCredentials.from_json_keyfile_name("credentials.json", scope)
    client = gspread.authorize(credentials)

    spreadsheet = client.open("Locus Surveys Jobs")
    geojson = {"type": "FeatureCollection", "features": []}

    worksheets = spreadsheet.worksheets()
    for worksheet in worksheets:
        records = worksheet.get_all_records()

        for record in records:
            latitude = record.get('Latitude')
            longitude = record.get('Longitude')
            date_created = record.get('Date Created')

            if latitude and longitude and date_created:
                try:
                    latitude = float(latitude)
                    longitude = float(longitude)
                    feature = {
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [longitude, latitude]  # GeoJSON uses [longitude, latitude]
                        },
                        "properties": {
                            "job_number": record.get('Job Number', ''),
                            "client": record.get('Client', ''),
                            "location": record.get('Location', ''),
                            "road": record.get('Road', ''),
                            "civic": record.get('Civic', ''),
                            "address": f"{record.get('Civic', '')} {record.get('Road', '')}, {record.get('Location', '')}",
                            "pid": record.get('PID', ''),
                            "latitude": latitude,
                            "longitude": longitude,
                            "date_created": date_created,
                            "worksheet_created": record.get('Worksheet Created', ''),
                            "preliminary_required": record.get('Preliminary Required', ''),
                            "application_submitted": record.get('Application Submitted', ''),
                            "preliminary_plan_completed": record.get('Preliminary Plan Completed', ''),
                            "preliminary_submitted": record.get('Preliminary Submitted', ''),
                            "preliminary_approved": record.get('Preliminary Approved', ''),
                            "initial_fieldwork_completed": record.get('Initial Fieldwork Completed', ''),
                            "plan_ready_for_check": record.get('Plan Ready for Check', ''),
                            "survey_markers_set": record.get('Survey Markers Set', ''),
                            "plan_to_be_registered": record.get('Plan to be Registered', ''),
                            "plan_registered": record.get('Plan Registered', ''),
                            "final_plan_submitted": record.get('Final Plan Submitted', ''),
                            "invoiced": record.get('Invoiced', ''),
                            "paid": record.get('Paid', ''),
                            "method": record.get('Method', ''),
                            "employee": record.get('Employee', '')
                        }
                    }

                    # Append the feature to the GeoJSON feature collection
                    geojson["features"].append(feature)

                except ValueError:
                    continue

    with open('static/geojson/job_data.geojson', 'w') as geojson_file:
        json.dump(geojson, geojson_file, indent=4)

@app.route('/')
def index():
    return render_template('map.html')

if __name__ == '__main__':
    app.run(debug=True)
