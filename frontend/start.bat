@echo off
REM Quick start script for the Encourage Me frontend (Windows)
cd /d "%~dp0"

if not exist ".env" (
  copy .env.example .env
)

if not exist "node_modules" (
  npm install
)

echo Starting Encourage Me on http://localhost:5173 ...
npm run dev
