#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

PUBLISH_DIR="$ROOT_DIR/publish_with_native"
OUT_DIR="$ROOT_DIR/release"
ISCC_PATH="${ISCC_PATH:-}"

# Optional behaviors (defaults)
SCAN_BINARIES=0
PREPARE_FP=0
AUTO_SUBMIT_FP=0
SELF_SIGN="${SELF_SIGN:-0}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --publish-dir|-p)
      PUBLISH_DIR="$2"; shift 2;;
    --out-dir|-o)
      OUT_DIR="$2"; shift 2;;
    --iscc-path)
      ISCC_PATH="$2"; shift 2;;
    --self-sign)
      SELF_SIGN=1; shift;;
    --scan-binaries)
      SCAN_BINARIES=1; shift;;
    --prepare-fp)
      PREPARE_FP=1; shift;;
    --auto-submit-fp)
      AUTO_SUBMIT_FP=1; shift;;
    --help|-h)
      echo "Usage: $0 [--publish-dir DIR] [--out-dir DIR] [--iscc-path PATH] [--self-sign] [--scan-binaries] [--prepare-fp] [--auto-submit-fp]"
      echo "Example: $0 --self-sign --scan-binaries --prepare-fp"
      exit 0;;
    *)
      echo "Unknown option: $1"; exit 1;;
  esac
done

# By default, force a fresh publish to ensure the installer is built from the latest artifacts.
# Set SKIP_PUBLISH=1 to avoid forcing a fresh publish (useful if you manage publish artifacts externally).
if [ -z "${SKIP_PUBLISH:-}" ]; then
  echo "🔁 Forcing fresh publish to regenerate $PUBLISH_DIR..."
  if [ -f "$SCRIPT_DIR/publish_release.sh" ]; then
    bash "$SCRIPT_DIR/publish_release.sh" --no-installer || { echo "ERROR: publish_release.sh failed"; exit 1; }
    # If the caller requested a non-default publish dir, copy the freshly built default publish tree into place
    if [ "$PUBLISH_DIR" != "$ROOT_DIR/publish_with_native" ]; then
      rm -rf "$PUBLISH_DIR"
      cp -a "$ROOT_DIR/publish_with_native" "$PUBLISH_DIR"
    fi
  else
    echo "ERROR: publish_release.sh not present; cannot refresh publish."
  fi
else
  echo "ℹ️ SKIP_PUBLISH set; not forcing publish."
  # If publish dir missing and SKIP_PUBLISH is set, attempt fallback publish as before
  if [ ! -d "$PUBLISH_DIR" ]; then
    echo "Publish dir not found: $PUBLISH_DIR. Attempting to run publish_release.sh to build publish artifacts..."
    if [ -f "$SCRIPT_DIR/publish_release.sh" ]; then
      echo "Running publish_release.sh --no-installer"
      bash "$SCRIPT_DIR/publish_release.sh" --no-installer || { echo "ERROR: publish_release.sh failed to generate $PUBLISH_DIR"; exit 1; }
    else
      echo "ERROR: Publish dir not found and $SCRIPT_DIR/publish_release.sh not present: $PUBLISH_DIR"; exit 1
    fi
    if [ ! -d "$PUBLISH_DIR" ]; then
      echo "ERROR: Publish dir still not found after running publish: $PUBLISH_DIR"; exit 1
    fi
  fi
fi

# Ensure roxify_native.exe is present before attempting installer build
if [ ! -f "$PUBLISH_DIR/roxify/roxify_native.exe" ]; then
  echo "⚠️ roxify_native.exe not found in publish tree: $PUBLISH_DIR/roxify/roxify_native.exe"
  echo "Tentative de copie depuis emplacements connus..."
  mkdir -p "$PUBLISH_DIR/roxify"
  if [ -f "/home/yohan/roxify/dist/roxify_native.exe" ]; then
    echo "📥 Copying /home/yohan/roxify/dist/roxify_native.exe -> $PUBLISH_DIR/roxify/roxify_native.exe"
    cp -f "/home/yohan/roxify/dist/roxify_native.exe" "$PUBLISH_DIR/roxify/roxify_native.exe" || { echo "ERROR: copy failed"; exit 1; }
  elif [ -f "$ROOT_DIR/tools/roxify/dist/roxify_native.exe" ]; then
    echo "📥 Copying $ROOT_DIR/tools/roxify/dist/roxify_native.exe -> $PUBLISH_DIR/roxify/roxify_native.exe"
    cp -f "$ROOT_DIR/tools/roxify/dist/roxify_native.exe" "$PUBLISH_DIR/roxify/roxify_native.exe" || { echo "ERROR: copy failed"; exit 1; }
  else
    echo "ERROR: roxify_native.exe still not found in publish tree: $PUBLISH_DIR/roxify/roxify_native.exe"
    echo "Please ensure the prebuilt roxify_native.exe is available in one of these locations before building the installer:"
    echo "  - /home/yohan/roxify/dist/roxify_native.exe"
    echo "  - $ROOT_DIR/tools/roxify/dist/roxify_native.exe"
    echo "You can run: scripts/publish_release.sh (without sudo) to copy it into the publish tree if present locally."
    exit 1
  fi
fi

# Try to strip symbols/debug info from the native binary to reduce embedded source paths and panic strings
if command -v strip >/dev/null 2>&1; then
  echo "🔧 Stripping symbols from roxify_native.exe to reduce embedded debug/source strings..."
  strip --strip-all "$PUBLISH_DIR/roxify/roxify_native.exe" || true
  if strings "$PUBLISH_DIR/roxify/roxify_native.exe" | grep -i "/home/" >/dev/null 2>&1; then
    echo "⚠️ Note: binary still contains source paths or large debug strings — consider rebuilding roxify with a release profile and reduced debug information (e.g., 'panic = "abort"' in Cargo.toml or disabling debug symbols)."
  fi
fi

rm -rf "$OUT_DIR" && mkdir -p "$OUT_DIR"

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

PYXELZE_EXE="$PUBLISH_DIR/Pyxelze.exe"
if [ -f "$PYXELZE_EXE" ]; then
  PYXELZE_CHECKSUM=$(sha256sum "$PYXELZE_EXE" | awk '{print $1}')
  echo "$PYXELZE_CHECKSUM" > "$PUBLISH_DIR/sha256sums.txt"
  echo "✅ Checksum de Pyxelze.exe copié dans $PUBLISH_DIR/sha256sums.txt AVANT compilation installateur: $PYXELZE_CHECKSUM"
fi

# Remove PDBs and other debug artifacts from publish dir to lower FP risk
echo "🔧 Removing debug artifacts (.pdb, .pdb.*, .pdb*, *.dbg) from publish tree to reduce FP heuristics..."
find "$PUBLISH_DIR" -type f \( -iname "*.pdb" -o -iname "*.pdb.*" -o -iname "*.dbg" \) -print -exec rm -f {} + || true

# Verify no PDB remains
if find "$PUBLISH_DIR" -type f -iname "*.pdb" | read; then
  echo "⚠️ Warning: Some PDB files remain in publish tree. Consider rebuilding without generating PDBs." >&2
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

# Optional sanitization step to remove common developer paths/strings that trigger FP heuristics
if [ -x "$SCRIPT_DIR/sanitize_binaries.sh" ]; then
  echo "🔧 Sanitizing built binaries to reduce heuristic flags (removing absolute source paths and known trigger strings)..."
  # sanitize roxify and installer if present
  "$SCRIPT_DIR/sanitize_binaries.sh" "$PUBLISH_DIR/roxify/roxify_native.exe" "$OUT_DIR"/*.exe || true
fi

if command -v sha256sum >/dev/null 2>&1; then
  echo "Generating SHA256 checksums for installer(s)..."
  > "$OUT_DIR/sha256sums.txt"
  for f in "$OUT_DIR"/*.exe; do
    [ -f "$f" ] || continue
    sha256sum "$f" >> "$OUT_DIR/sha256sums.txt"
  done
  echo "Checksums written to $OUT_DIR/sha256sums.txt"
else
  echo "Warning: sha256sum not found; skipping checksum generation."
fi

if [ "${SELF_SIGN:-0}" = "1" ]; then
  echo "🔐 Generating self-signed PFX for signing (development only)..."
  if ! command -v openssl >/dev/null 2>&1; then
    echo "ERROR: openssl not found; cannot generate self-signed PFX. Install openssl or provide SIGN_PFX."; exit 1
  fi
  GENERATED_PFX="$SCRIPT_DIR/create_self_signed_pfx.sh"
  PFX_OUT="$($SCRIPT_DIR/create_self_signed_pfx.sh "$SCRIPT_DIR/signing_cert.pfx" "${SIGN_PFX_PASS:-changeit}")"
  if [ -f "$PFX_OUT" ]; then
    SIGN_PFX="$PFX_OUT"
    SIGN_PFX_PASS="${SIGN_PFX_PASS:-changeit}"
    echo "Using generated PFX: $SIGN_PFX"
  else
    echo "ERROR: failed to generate PFX at: $PFX_OUT"; exit 1
  fi
fi

if [ -n "${SIGN_PFX:-}" ] && command -v osslsigncode >/dev/null 2>&1; then
  for f in "$OUT_DIR"/*.exe; do
    [ -f "$f" ] || continue
    echo "Signing $f with osslsigncode..."
    tmpf="${f}.signed"
    if osslsigncode sign -pkcs12 "$SIGN_PFX" -pass "${SIGN_PFX_PASS:-}" -n "Pyxelze" -i "https://pyxelze.example" -t "http://timestamp.digicert.com" -in "$f" -out "$tmpf"; then
      mv "$tmpf" "$f"
      echo "Signed $f"
    else
      echo "Signing failed for $f"
      rm -f "$tmpf"
    fi
  done
else
  if [ -n "${SIGN_PFX:-}" ]; then
    echo "Signing requested but osslsigncode not found; skipping sign step."
  fi
fi

# Optional: run binary checks
if [ "${SCAN_BINARIES:-0}" = "1" ]; then
  echo "🔎 Running binary checks on publish and release directories..."
  if [ -x "$SCRIPT_DIR/check_binaries.sh" ]; then
    "$SCRIPT_DIR/check_binaries.sh" "$PUBLISH_DIR" "$OUT_DIR" || echo "Binary check found suspicious items (see output above)."
  else
    echo "Warning: check_binaries.sh not found or not executable; skipping binary checks."
  fi
fi

# Optional: prepare a false-positive submission bundle
if [ "${PREPARE_FP:-0}" = "1" ]; then
  echo "📦 Preparing false-positive submission package..."
  FP_OUT="$OUT_DIR/fp_submission"
  mkdir -p "$FP_OUT"
  if [ -x "$SCRIPT_DIR/prepare_fp_submission.sh" ]; then
    "$SCRIPT_DIR/prepare_fp_submission.sh" "$FP_OUT" "$OUT_DIR" "$PUBLISH_DIR"
    echo "Prepared false-positive bundle at: $FP_OUT/fp_submission.tar.gz"
  else
    echo "Warning: prepare_fp_submission.sh not found or not executable; skipping preparation."
  fi

  if [ "${AUTO_SUBMIT_FP:-0}" = "1" ]; then
    echo "⚠️ Auto-submission not implemented (requires API keys/credentials). The prepared bundle is available for manual submission: $FP_OUT"
  fi
fi

ls -lh "$OUT_DIR" | sed -n '1,200p'

echo "Done."