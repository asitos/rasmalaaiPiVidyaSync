import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
import re
import os

# --- CONFIGURATION ---
README_PATH = "../asitos/README.md" 
SHEET_NAME = "bideo gaym"
WORKSHEET_NAME = "Ratings"
# ---------------------

def get_top_games():
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    creds = ServiceAccountCredentials.from_json_keyfile_name("credentials.json", scope)
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

def generate_markdown(games):
    md = "```text\n"
    md += f"{'[DATE]'.ljust(10)} {'[TITLE]'.ljust(42)} {'[RATING]'.ljust(9)} {'[TIME]'}\n"
    md += "-" * 70 + "\n"
    
    for game in games:
        date_str = str(game.get("date finished", ""))
        title = str(game.get("finished", ""))[:40] 
        rating = str(game.get("rating", ""))
        time = str(game.get("hours played", "")) + "h"
        
        md += f"{date_str.ljust(10)} {title.ljust(42)} {rating.ljust(9)} {time}\n"
    
    md += "```"
    return md

def update_readme(markdown_content):
    with open(README_PATH, 'r') as file:
        readme_data = file.read()

    pattern = r"(<!-- GAMES:START -->\n).*?(<!-- GAMES:END -->)"
    replacement = rf"\1{markdown_content}\n\2"
    
    new_readme = re.sub(pattern, replacement, readme_data, flags=re.DOTALL)

    with open(README_PATH, 'w') as file:
        file.write(new_readme)
    print("SUCCESS: README.md telemetry updated locally.")

if __name__ == "__main__":
    print("Fetching telemetry from Google Sheets...")
    top_games = get_top_games()
    
    print("Formatting terminal block...")
    markdown_block = generate_markdown(top_games)
    
    print("Injecting into README.md...")
    update_readme(markdown_block)
