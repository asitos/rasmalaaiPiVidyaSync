# --- CONFIGURATION ---
PREFIX ?= /home/asitos/Projects/rasmalaaiPiVidyaSync
SYSTEMD_PATH = /etc/systemd/system
VENV_BIN = $(PREFIX)/venv/bin
# ---------------------

.PHONY: all env install test clean systemd-install

all: env

env:
	@echo "==> Building native virtual environment..."
	python3 -m venv $(PREFIX)/venv
	$(VENV_BIN)/pip install -r requirements.txt

test:
	@echo "==> Executing runtime engine simulation..."
	$(VENV_BIN)/python3 sync.py

systemd-install:
	@echo "==> Installing systemd service and timer units..."
	@sudo cp systemd/vidyad.service $(SYSTEMD_PATH)/
	@sudo cp systemd/vidyad.timer $(SYSTEMD_PATH)/
	@sudo systemctl daemon-reload
	@echo "==> Arming timer daemon..."
	@sudo systemctl enable --now vidyad.timer
	@sudo systemctl status vidyad.timer

clean:
	@echo "==> Purging environment runtime artifacts..."
	rm -rf $(PREFIX)/venv
	find . -type d -name "__pycache__" -exec rm -rf {} +
