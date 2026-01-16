#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

PUBLISH_DIR="$ROOT_DIR/publish_with_native"
OUT_DIR="$ROOT_DIR/release"
ISCC_PATH="${ISCC_PATH:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --publish-dir|-p)
      PUBLISH_DIR="$2"; shift 2;;
    --out-dir|-o)
      OUT_DIR="$2"; shift 2;;
    --iscc-path)
      ISCC_PATH="$2"; shift 2;;
    --help|-h)
      echo "Usage: $0 [--publish-dir DIR] [--out-dir DIR] [--iscc-path PATH]"; exit 0;;
    *)
      echo "Unknown option: $1"; exit 1;;
  esac
done

if [ ! -d "$PUBLISH_DIR" ]; then
  echo "ERROR: Publish dir not found: $PUBLISH_DIR"; exit 1
fi

mkdir -p "$OUT_DIR"

if [[ "${OS:-}" == "Windows_NT" || -n "${WINDIR:-}" ]]; then
  echo "Detected Windows environment. Running tools/installer/build_installer.cmd"
  pushd "$ROOT_DIR/tools/installer" >/dev/null
  cmd.exe /c build_installer.cmd "$PUBLISH_DIR"
  popd >/dev/null
  echo "Installer build finished (Windows)."
  exit 0
fi

if ! command -v wine >/dev/null 2>&1; then
  echo "wine not found and not on Windows. To build the installer, run tools/installer/build_installer.cmd on Windows or install wine and Inno Setup in a wine prefix." ; exit 1
fi

if [ -z "$ISCC_PATH" ]; then
  if [ -f "$HOME/.wine/drive_c/Program Files (x86)/Inno Setup 6/ISCC.exe" ]; then
    ISCC_PATH="$HOME/.wine/drive_c/Program Files (x86)/Inno Setup 6/ISCC.exe"
  elif [ -f "$HOME/.wine/drive_c/Program Files/Inno Setup 6/ISCC.exe" ]; then
    ISCC_PATH="$HOME/.wine/drive_c/Program Files/Inno Setup 6/ISCC.exe"
  fi
fi

if [ -z "$ISCC_PATH" ]; then
  echo "ISCC_PATH not set and Inno Setup not found in default wine paths. Set ISCC_PATH to the path to ISCC.exe (Windows style) and re-run, or run build_installer.cmd on Windows."; exit 1
fi

WIN_PUBLISH_DIR="$(winepath -w "$PUBLISH_DIR" | tr -d '\r')"
WIN_OUT_DIR="$(winepath -w "$OUT_DIR" | tr -d '\r')"
WIN_ISS="$(winepath -w "$ROOT_DIR/tools/installer/installer.iss" | tr -d '\r')"

echo "Using ISCC at: $ISCC_PATH"
echo "Running ISCC via wine to build installer from: $PUBLISH_DIR"

wine "$ISCC_PATH" /O"$WIN_OUT_DIR" /F"Pyxelze_Setup" /DReleaseDir="$WIN_PUBLISH_DIR" "$WIN_ISS"

if [ $? -ne 0 ]; then
  echo "ISCC failed. Check wine console above for errors."; exit 1
fi

echo "Installer built, outputs placed in: $OUT_DIR"
ls -lh "$OUT_DIR" | sed -n '1,200p'

echo "Done."