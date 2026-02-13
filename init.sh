#!/usr/bin/env bash
set -euo pipefail

echo "OpenClack Initialization Script"
echo "================================"

# Kill any previous Electron instances
echo "Cleaning up previous instances..."
pkill -f "electron.*OpenClack" 2>/dev/null || true
pkill -f "vite.*5173" 2>/dev/null || true
sleep 2

# Install dependencies if node_modules is missing or package.json changed
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo "Dependencies already installed, skipping..."
fi

# Build main process
echo "Building main process..."
npm run build:main

# Start Vite dev server in background
echo "Starting Vite dev server..."
npm run dev:renderer > /dev/null 2>&1 &
VITE_PID=$!

# Wait for Vite dev server to be ready
echo "Waiting for dev server to be ready..."
for i in $(seq 1 30); do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "✓ Vite dev server ready on http://localhost:5173 (PID: $VITE_PID)"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "ERROR: Vite dev server failed to start within 30 seconds"
        kill $VITE_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

# Start Electron app
echo "Starting Electron app..."
NODE_ENV=development npm start &
ELECTRON_PID=$!

echo ""
echo "================================"
echo "✓ OpenClack is running!"
echo "  - Vite Dev Server: http://localhost:5173 (PID: $VITE_PID)"
echo "  - Electron App: (PID: $ELECTRON_PID)"
echo ""
echo "To stop:"
echo "  pkill -f 'electron.*OpenClack'"
echo "  pkill -f 'vite.*5173'"
echo "================================"
