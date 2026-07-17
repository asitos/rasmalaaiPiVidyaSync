# rasmalaaiPiVidyaSync 

a zero-maintenance, bare-metal telemetry daemon built for the rasmalaaiPi ecosystem. 

it bridges an offline google sheets database with github's api, autonomously parsing game completion data, formatting it into a monospace terminal ui, and managing git state to inject real-time updates directly into my github profile `README.md`.

i had a lot of video game data lying around for more than 2 years, figured making use of it by displaying it on my profile would give me some sense of productivity instead of being autistically fixated on logging everything for reasons i dont know. ![spreadsheet here](https://docs.google.com/spreadsheets/d/1W9je3_pr-Pd608ET2m4Zm-GTyg7kLzrdRGCktyuXpXk/edit?usp=sharing).

## systems architecture

the project completely bypasses cloud runners (like github actions) in favor of a localized, natively hosted linux daemon. 

- **host environment:** raspberry pi 3b+ (arm64)
- **execution engine:** python3 (gspread, oauth2) wrapped in bash
- **automation:** native `systemd` timers (cron replacement)
- **data pipeline:** google sheets api -> regex payload injection -> automated git push

## deployment pipeline

the daemon is designed to run in a strict, isolated environment to prevent pacman dependency conflicts on arch/debian systems.

```bash
# 1. clone and isolate
git clone [https://github.com/asitos/rasmalaaiPiVidyaSync.git](https://github.com/asitos/rasmalaaiPVidyaiSync.git)
cd rasmalaaiPiVidyaSync
python -m venv venv

# for bash, change to activate.fish for a fish shell
source venv/bin/activate 

# 2. install dependencies
pip install -r requirements.txt

# 3. provide google cloud credentials
# place your service account key at the root: ./credentials.json
```

## systemd integration

to run invisibly, the bash wrapper is handed off to the linux kernel's init system.

1. service file (/etc/systemd/system/vidyad.service)
```ini
[Unit]
Description=rasmalaaiPiVidyaSync GitHub Telemetry
After=network.target

[Service]
Type=oneshot
User=asitos
ExecStart=/path/to/rasmalaaiPiVidyaSync/run_sync.sh

```

2. arming the daemon
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now vidyad.timer
```

## security & state management
* **headless git operations:** script autonomously handles `git pull`, `git add`, `git commit`, and `git push` via ssh keys, checking the ``--porcelain`` status to prevent empty commits.

* **secret management:** google cloud service account keys (`credentials.json`) are strictly ignored via `.gitignore` and handled locally on the pi.

* **fault tolerance:** native `gspread` header arrays are bypassed in favor of raw 2d array mapping to prevent index crashing on phantom google sheets columns.

