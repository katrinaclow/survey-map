from flask import Flask, render_template
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import json

app = Flask(__name__)

# Use a flag to check if the job data has been updated
data_updated = False


@app.before_request
def update_geojson_once():
    global data_updated
    if not data_updated:
        update_geojson()
        data_updated = True  # Ensure it only runs once


def update_geojson():
    # Google Sheets API Setup
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    credentials = ServiceAccountCredentials.from_json_keyfile_name("credentials.json", scope)
    client = gspread.authorize(credentials)

    # Open the spreadsheet by name
    spreadsheet = client.open("Locus Surveys Jobs")

    # Initialize the GeoJSON structure
    geojson = {
        "type": "FeatureCollection",
        "features": []
    }

    # Iterate over each worksheet (tab)
    worksheets = spreadsheet.worksheets()
    for worksheet in worksheets:
        records = worksheet.get_all_records()

        # Create a GeoJSON Feature for each record with valid latitude and longitude
        # Create a GeoJSON Feature for each record with valid latitude, longitude, and date_created
        for record in records:
            latitude = record.get('Latitude')
            longitude = record.get('Longitude')
            date_created = record.get('Date Created')

            # Proceed only if latitude, longitude, and date_created are valid (non-empty)
            if latitude and longitude and date_created:
                try:
                    # Convert latitude and longitude to float
                    latitude = float(latitude)
                    longitude = float(longitude)

                    # Construct the GeoJSON feature
                    feature = {
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [longitude, latitude]  # GeoJSON uses [longitude, latitude]
                        },
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

                    # Append the feature to the GeoJSON feature collection
                    geojson["features"].append(feature)

                except ValueError:
                    # Skip the record if latitude/longitude conversion to float fails
                    continue

    with open('static/job_data.geojson', 'w') as geojson_file:
        json.dump(geojson, geojson_file, indent=4)


@app.route('/')
def index():
    return render_template('map.html')


if __name__ == '__main__':
    app.run(debug=True)
