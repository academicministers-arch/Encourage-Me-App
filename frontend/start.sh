#!/usr/bin/env bash
# Quick start script for the Encourage Me frontend (macOS/Linux).
set -e
cd "$(dirname "$0")"

if [ ! -f ".env" ]; then
  cp .env.example .env
fi

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Starting Encourage Me on http://localhost:5173 ..."
npm run dev
