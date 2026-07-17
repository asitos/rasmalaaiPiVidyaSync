# rasmalaaiPiVidyaSync 

a zero-maintenance, bare-metal telemetry daemon built for the rasmalaaiPi ecosystem. 

it bridges an offline google sheets database with github's api, autonomously parsing game completion data, formatting it into a monospace terminal ui, and managing git state to inject real-time updates directly into my github profile `README.md`.

i had a lot of video game data lying around for more than 2 years, figured making use of it by displaying it on my profile would give me some sense of productivity instead of being autistically fixated on logging everything for reasons i dont know. ![spreadsheet here](https://docs.google.com/spreadsheets/d/1W9je3_pr-Pd608ET2m4Zm-GTyg7kLzrdRGCktyuXpXk/edit?usp=sharing).

## systems architecture

the project completely bypasses cloud runners (like github actions) in favor of a localized, natively hosted linux daemon. 

- **host environment:** raspberry pi 3b+ (arm64)
- **execution engine:** python3 (gspread, oauth2) wrapped in bash
- **automation:** native `systemd` timers (cron replacement)
- **data pipeline:** google sheets api -> raw 2d-matrix parsing -> regex payload injection -> automated git push
- **ci/cd layer:** isolated github action runner to enforce linting and static syntax compilation checks

## deployment pipeline

the daemon is designed to run in a strict, isolated environment to prevent pacman dependency conflicts on arch/debian systems.

```bash
git clone [https://github.com/asitos/rasmalaaiPiVidyaSync.git](https://github.com/asitos/rasmalaaiPVidyaiSync.git)
cd rasmalaaiPiVidyaSync
python -m venv venv

make env
make test
```

## systemd integration

to run invisibly, the bash wrapper is handed off to the linux kernel's init system.

1. service file (/etc/systemd/system/vidyad.service)
```ini
[Unit]
Description=rasmalaaiPiVidyaSync github telemetry
After=network.target

[Service]
Type=oneshot
User=asitos
ExecStart=/path/to/rasmalaaiPiVidyaSync/run_sync.sh

```

2. automated target deployment
```bash
sudo make systemd-install
```

## security & state management

- **headless git execution**: script tracks the repository state using `--porcelain` arguments to evaluate dirty work trees natively before initiating upstream updates.

- **secret abstraction**: token payloads (`credentials.json`) are hard-isolated out of version tracking via strict workspace `.gitignore` rules.

- **fault tolerance**: internal `gspread` headers are bypassed entirely in favor of native multi-dimensional indexing to handle empty or duplicate google sheet data boundaries.
