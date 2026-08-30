#!/bin/bash

# --- CONFIGURATION ---
BASE_DIR="/home/asitos/Projects/rasmalaaiPiVidyaSync"
REPO_DIR="/home/asitos/Projects/rasmalaaiPiVidyaSync" 
# ---------------------

echo "[$(date)] initiating telemetry aggregation sequence..."

cd $REPO_DIR
git pull origin main

# Check if venv exists, otherwise use system python or something?
# The prompt's run_sync.sh used $BASE_DIR/daemon/venv/bin/python
if [ -f "$BASE_DIR/daemon/venv/bin/python" ]; then
    PYTHON_BIN="$BASE_DIR/daemon/venv/bin/python"
elif [ -f "$BASE_DIR/venv/bin/python" ]; then
    PYTHON_BIN="$BASE_DIR/venv/bin/python"
else
    PYTHON_BIN="python3"
fi

$PYTHON_BIN $BASE_DIR/daemon/sync.py

if [[ $(git status --porcelain api/telemetry.json) ]]; then
    echo "State shift detected. Committing telemetry payload..."
    git add api/telemetry.json
    
    # If the old root telemetry.json exists and is tracked, remove it
    if [ -f "telemetry.json" ]; then
        git rm --cached telemetry.json 2>/dev/null || true
        rm telemetry.json
    fi
    
    git commit -m "chore(telemetry): automated database state compilation"
    git push origin main
    echo "Push completed successfully."
else
    echo "State stable. No compilation changes detected."
fi
