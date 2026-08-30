import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
import json
import os
import urllib.request
import urllib.parse
import base64

# --- CONFIGURATION ---
SHEET_NAME = "bideo gaym"
WORKSHEET_NAME = "Ratings"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_JSON_PATH = os.path.join(BASE_DIR, "api", "telemetry.json")

def get_rawg_api_key():
    try:
        with open(os.path.join(BASE_DIR, "rawgapi.txt"), "r") as f:
            return f.read().strip()
    except Exception:
        print("WARNING: rawgapi.txt not found. Artwork fetching will fail.")
        return ""

RAWG_API_KEY = get_rawg_api_key()
# ---------------------

def get_base64_image(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'rasmalaaiPiVidyaSync-Daemon'})
        with urllib.request.urlopen(req, timeout=10) as response:
            image_data = response.read()
            mime = "image/jpeg"
            if url.lower().endswith(".png"):
                mime = "image/png"
            elif url.lower().endswith(".webp"):
                mime = "image/webp"
            b64 = base64.b64encode(image_data).decode('utf-8')
            return f"data:{mime};base64,{b64}"
    except Exception as e:
        print(f"WARNING: Failed to fetch image data from '{url}': {e}")
        return None

def get_rawg_cover_url(game_title):
    if not RAWG_API_KEY:
        return None
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
    return None

def get_games_data():
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    creds_path = os.path.join(BASE_DIR, "credentials.json")
    if not os.path.exists(creds_path):
        print("ERROR: credentials.json not found.")
        return [], None

    try:
        creds = ServiceAccountCredentials.from_json_keyfile_name(creds_path, scope)
        client = gspread.authorize(creds)
        sheet = client.open(SHEET_NAME).worksheet(WORKSHEET_NAME)
        raw_data = sheet.get_all_values()
    except Exception as e:
        print(f"ERROR: Failed to connect to Google Sheets: {e}")
        return [], None

    if not raw_data:
        return [], None

    header_index = 0
    for i, row in enumerate(raw_data):
        row_strings = [str(cell).strip().lower() for cell in row]
        if "date finished" in row_strings:
            header_index = i
            break
            
    headers = [str(h).strip().lower() for h in raw_data[header_index]]
    records = [dict(zip(headers, row)) for row in raw_data[header_index + 1:]]

    valid_games = []
    currently_playing = None
    
    for row in records:
        title = str(row.get(headers[0], "")).strip() # "finished " is usually header 0
        if not title or title.lower() in ["incomplete / unfinished", "in playlist"]:
            continue
            
        date_str = str(row.get("date finished", "")).strip()
        rolled = str(row.get("rolled credits?", "")).strip().lower()
        
        # Currently playing heuristic: No date finished, and credits not rolled
        if not date_str and rolled == "no" and not currently_playing:
            # We just take the first one that fits this description
            currently_playing = row
            
        if date_str:
            try:
                parsed_date = datetime.strptime(date_str, "%d/%m/%y")
                row['parsed_date'] = parsed_date
                valid_games.append(row)
            except ValueError:
                continue 

    valid_games.sort(key=lambda x: x['parsed_date'], reverse=True)
    return valid_games[:6], currently_playing

def resolve_game(game, existing_data):
    if not game:
        return None
        
    title = str(game.get(list(game.keys())[0], "")).strip()
    date_str = str(game.get("date finished", "")).strip()
    rating = str(game.get("rating", "")).strip()
    time_played = str(game.get("hours played", "")).strip() + "h"
    
    print(f"  -> resolving artifacts for: {title}")
    cover_url = get_rawg_cover_url(title)
    cover_b64 = None
    if cover_url:
        cover_b64 = get_base64_image(cover_url)
        
    if not cover_b64:
        # Try to fallback to existing data
        fallback = next((g for g in existing_data if g.get("title") == title and g.get("cover_url", "").startswith("data:")), None)
        if fallback:
            cover_b64 = fallback["cover_url"]
            print(f"  -> used cached artwork for: {title}")
        else:
            cover_b64 = "https://images.unsplash.com/photo-1538481199705-c710c4e965fc"
    
    return {
        "title": title,
        "date": date_str,
        "rating": rating,
        "time": time_played,
        "cover_url": cover_b64
    }

if __name__ == "__main__":
    print("Fetching sheet logs from Google Cloud...")
    top_games, current_game = get_games_data()
    
    existing_data = []
    if os.path.exists(OUTPUT_JSON_PATH):
        try:
            with open(OUTPUT_JSON_PATH, 'r') as f:
                data = json.load(f)
                existing_data = data.get("games", [])
                if data.get("current"):
                    existing_data.append(data["current"])
        except:
            pass

    print("Syncing cover art vectors from RAWG.io...")
    
    payload = {
        "games": [],
        "current": None
    }
    
    if current_game:
        print("Processing Currently Playing...")
        payload["current"] = resolve_game(current_game, existing_data)
        
    print("Processing Recently Played...")
    for game in top_games:
        payload["games"].append(resolve_game(game, existing_data))
        
    print(f"Writing state compilation atomically to {OUTPUT_JSON_PATH}...")
    tmp_path = OUTPUT_JSON_PATH + ".tmp"
    with open(tmp_path, 'w') as f:
        json.dump(payload, f, indent=2)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp_path, OUTPUT_JSON_PATH)
        
    print("SUCCESS: State machine synchronization sequence completed.")
