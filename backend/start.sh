#!/usr/bin/env bash
# Quick start script for the Encourage Me backend (macOS/Linux).
set -e
cd "$(dirname "$0")"

if [ ! -d ".venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv .venv
fi

source .venv/bin/activate
pip install -q -r requirements.txt

if [ ! -f ".env" ]; then
  cp .env.example .env
fi

echo "Starting Encourage Me API on http://localhost:8000 ..."
uvicorn main:app --reload --port 8000
