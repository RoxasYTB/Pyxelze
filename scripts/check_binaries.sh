#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 DIR [DIR...]"; exit 1
fi

SUSPECT=0

for DIR in "$@"; do
  if [ ! -d "$DIR" ]; then
    echo "Skipping missing dir: $DIR"; continue
  fi
  echo "Scanning directory: $DIR"
  shopt -s nullglob
  for f in "$DIR"/*.exe "$DIR"/*.dll; do
    [ -f "$f" ] || continue
    echo "\n-- File: $f"
    sha256sum "$f" | awk '{print "SHA256: " $1}'
    file "$f"
    size=$(stat -c%s "$f")
    echo "Size: $size bytes"

    if command -v strings >/dev/null 2>&1; then
      if strings "$f" | tr '[:upper:]' '[:lower:]' | grep -q "upx"; then
        echo "!! Warning: contains 'UPX' marker (likely packed with UPX)"; SUSPECT=1
      fi
      if strings "$f" | grep -qi "packed"; then
        echo "!! Warning: strings contain 'packed'"; SUSPECT=1
      fi
    fi

    # Check for overlay (simple heuristic: file size larger than sum of sections sizes is complex; fallback to checking for executable overlay by searching for large trailing nulls)
    # Simple heuristic: grep for PE header and measure distance to EOF is unreliable here; skip complex checks.

    # Check for version information (Windows resource metadata)
    if command -v rsrcdump >/dev/null 2>&1; then
      if ! rsrcdump "$f" | grep -qi "ProductName"; then
        echo "!! Warning: no ProductName in resources (version info missing)"; SUSPECT=1
      fi
    else
      echo "Note: 'rsrcdump' not installed; skipping detailed version/resource checks"
    fi

    # Strings heuristic for suspicious patterns
    if strings "$f" | tr '[:upper:]' '[:lower:]' | egrep -i "(suspicious|vtk|packer|obfus|shellcode|suspiciousbehavior|inject)" >/dev/null 2>&1; then
      echo "!! Warning: suspicious keywords detected in strings"; SUSPECT=1
    fi

    # Additional heuristic: embedded absolute source paths (e.g., /home/.. or C:\Users\) indicate a development build with debug info
    if strings "$f" | egrep -i "/home/|c:\\users\\" >/dev/null 2>&1; then
      echo "!! Warning: binary contains absolute source paths (development debug info). Rebuild with release profile and strip debug symbols (e.g., cargo --release and strip), and consider setting 'panic = \"abort\"' to reduce panic messages."; SUSPECT=1
    fi

  done
  shopt -u nullglob
done

if [ $SUSPECT -ne 0 ]; then
  echo "\nScan complete: suspicious patterns found. Investigate the flagged files above."; exit 2
else
  echo "\nScan complete: no obvious packer/malicious markers found."; exit 0
fi
