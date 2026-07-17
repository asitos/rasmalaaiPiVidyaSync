#!/bin/bash

# --- CONFIGURATION ---
BASE_DIR="/home/asitos/Projects/rasmalaaiPiVidyaSync"
REPO_DIR="/home/asitos/Projects/rasmalaaiPiVidyaSync" 
# ---------------------

echo "[$(date)] initiating telemetry aggregation sequence..."

cd $REPO_DIR
git pull origin main

$BASE_DIR/daemon/venv/bin/python $BASE_DIR/daemon/sync.py

if [[ $(git status --porcelain telemetry.json) ]]; then
    echo "State shift detected. Committing telemetry payload..."
    git add telemetry.json
    git commit -m "chore(telemetry): automated database state compilation"
    git push origin main
    echo "Push completed successfully."
else
    echo "State stable. No compilation changes detected."
fi
