import gspread
from oauth2client.service_account import ServiceAccountCredentials
import json

# Define the scope for the Google Sheets API
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]

# Authenticate using the credentials.json file (Service Account key)
credentials = ServiceAccountCredentials.from_json_keyfile_name("credentials.json", scope)

# Authorize the client
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
    for record in records:
        # Ensure both Latitude and Longitude are present and not empty
        latitude = record.get('Latitude')
        longitude = record.get('Longitude')

        # Proceed only if both latitude and longitude are valid (non-empty)
        if latitude and longitude:
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
                        "date_created": record.get('Date Created', ''),
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

# Save the GeoJSON to a file for future use
with open('job_data.geojson', 'w') as geojson_file:
    json.dump(geojson, geojson_file, indent=4)

print("GeoJSON data generated successfully!")