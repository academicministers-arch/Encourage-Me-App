@echo off
REM Quick start script for the Encourage Me backend (Windows)
cd /d "%~dp0"

if not exist ".venv" (
  python -m venv .venv
)

call .venv\Scripts\activate.bat
pip install -q -r requirements.txt

if not exist ".env" (
  copy .env.example .env
)

echo Starting Encourage Me API on http://localhost:8000 ...
uvicorn main:app --reload --port 8000
