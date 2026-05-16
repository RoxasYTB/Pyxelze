#!/bin/bash

# Script to create .icns file from iconset on macOS
set -e

ICONSET_DIR="resources/icons/pyxelze.iconset"
ICNS_FILE="resources/icons/pyxelze.icns"

echo "Creating .icns file from iconset..."

# Check if iconset exists
if [ ! -d "$ICONSET_DIR" ]; then
    echo "Error: Iconset directory not found: $ICONSET_DIR"
    exit 1
fi

# Create .icns file using iconutil (macOS only)
if command -v iconutil &> /dev/null; then
    iconutil -c icns "$ICONSET_DIR" -o "$ICNS_FILE"
    echo "Created: $ICNS_FILE"
else
    echo "Error: iconutil not available. This script must run on macOS."
    exit 1
fi

# Verify the file was created
if [ -f "$ICNS_FILE" ]; then
    echo "✅ .icns file created successfully"
    ls -lh "$ICNS_FILE"
else
    echo "❌ Failed to create .icns file"
    exit 1
fi
