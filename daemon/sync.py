import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
import json
import os
import urllib.request
import urllib.parse

# --- CONFIGURATION ---
SHEET_NAME = "bideo gaym"
WORKSHEET_NAME = "Ratings"
RAWG_API_KEY = "97eff15a8bd14a98b1f140ae1843e639" 
OUTPUT_JSON_PATH = os.path.join(os.path.dirname(__file__), "../telemetry.json")
# ---------------------

def get_rawg_cover_url(game_title):
    """Queries the RAWG.io REST API to extract high-res game cover art."""
    try:
        encoded_title = urllib.parse.quote(game_title)
        url = f"https://api.rawg.io/api/games?key={RAWG_API_KEY}&search={encoded_title}&page_size=1"
        
        req = urllib.request.Request(url, headers={'User-Agent': 'rasmalaaiPiVidyaSync-Daemon'})
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode())
            results = res_data.get("results", [])
            if results and results[0].get("background_image"):
                return results[0]["background_image"]
    except Exception as e:
        print(f"WARNING: Failed to fetch art for '{game_title}': {e}")
    
    return "https://images.unsplash.com/photo-1538481199705-c710c4e965fc"

def get_top_games():
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    creds = ServiceAccountCredentials.from_json_keyfile_name(
        os.path.join(os.path.dirname(__file__), "..", "credentials.json"), scope
    )
    client = gspread.authorize(creds)

    sheet = client.open(SHEET_NAME).worksheet(WORKSHEET_NAME)
    raw_data = sheet.get_all_values()

    header_index = 0
    for i, row in enumerate(raw_data):
        row_strings = [str(cell).strip().lower() for cell in row]
        if "date finished" in row_strings:
            header_index = i
            break
            
    headers = [str(h).strip().lower() for h in raw_data[header_index]]
    records = [dict(zip(headers, row)) for row in raw_data[header_index + 1:]]

    valid_games = []
    for row in records:
        date_str = str(row.get("date finished", "")).strip()
        if date_str:
            try:
                parsed_date = datetime.strptime(date_str, "%d/%m/%y")
                row['parsed_date'] = parsed_date
                valid_games.append(row)
            except ValueError:
                continue 

    valid_games.sort(key=lambda x: x['parsed_date'], reverse=True)
    return valid_games[:4]

if __name__ == "__main__":
    print("Fetching sheet logs from Google Cloud...")
    top_games = get_top_games()
    
    telemetry_payload = []
    
    print("Syncing cover art vectors from RAWG.io...")
    for game in top_games:
        title = str(game.get("finished", "")).strip()
        date_str = str(game.get("date finished", "")).strip()
        rating = str(game.get("rating", "")).strip()
        time_played = str(game.get("hours played", "")).strip() + "h"
        
        print(f"  -> resolving artifacts for: {title}")
        cover_url = get_rawg_cover_url(title)
        
        telemetry_payload.append({
            "title": title,
            "date": date_str,
            "rating": rating,
            "time": time_played,
            "cover_url": cover_url
        })
        
    print(f"Writing state compilation to {OUTPUT_JSON_PATH}...")
    with open(OUTPUT_JSON_PATH, 'w') as f:
        json.dump(telemetry_payload, f, indent=2)
        
    print("SUCCESS: State machine synchronization sequence completed.")
