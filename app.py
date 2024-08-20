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
                        "geometry": {"type": "Point", "coordinates": [longitude, latitude]},
                        "properties": {
                            "job_number": record.get('Job Number', ''),
                            "client": record.get('Client', ''),
                            "address": f"{record.get('Civic', '')} {record.get('Road', '')}, {record.get('Location', '')}",
                            "pid": record.get('PID', ''),
                            "date_created": date_created,
                            "initial_fieldwork_completed": record.get('Initial Fieldwork Completed', ''),
                            "survey_markers_set": record.get('Survey Markers Set', ''),
                            "final_plan_submitted": record.get('Final Plan Submitted', '')
                        }
                    }
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
