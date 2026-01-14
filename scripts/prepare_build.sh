#!/bin/bash
set -e

echo "=== Building Pyxelze Production Setup ==="
cd "$(dirname "$0")"

echo "[1/4] Cleaning roxify dist..."
cd Pyxelze/tools/roxify
if [ -d dist ]; then rm -rf dist; fi
if [ -d build ]; then rm -rf build; fi

echo "[2/4] Building roxify CLI..."
npm install
npm run build:exe

echo "[3/4] Returning to Pyxelze root..."
cd ../../..

echo "[4/4] Ready for Windows build"
echo "Transfer Pyxelze folder to Windows VM and run:"
echo "  cd Pyxelze"
echo "  build_production.cmd"
echo "  tools\\installer\\build_installer.cmd"

echo ""
echo "=== Build preparation complete ==="
