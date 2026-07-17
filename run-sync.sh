#!/bin/bash

# --- CONFIGURATION ---
DAEMON_DIR="/home/asitos/Projects/rasmalaaiPiVidyaSync"
REPO_DIR="../asitos/README.md"
# ---------------------

echo "[$(date)] starting rasmalaaiPiVidyaSync telemetry update..."

cd $REPO_DIR
git pull origin main

$DAEMON_DIR/venv/bin/python $DAEMON_DIR/sync.py

if [[ $(git status --porcelain) ]]; then
    echo "changes detected. pushing to github..."
    git add README.md
    git commit -m "chore: automated telemetry update"
    git push origin main
    echo "push successful."
else
    echo "no new telemetry data. exiting."
fi
