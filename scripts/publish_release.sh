#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

PUBLISH_DIR="$ROOT_DIR/publish_with_native"
RELEASE_DIR="$ROOT_DIR/release"
NO_INSTALLER=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-installer)
      NO_INSTALLER=1; shift ;;
    --help|-h)
      echo "Usage: $0 [--no-installer]"; exit 0 ;;
    *)
      echo "Unknown option: $1"; exit 1 ;;
  esac
done

echo "🔧 Removing old release dir and recreating: $RELEASE_DIR"
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

echo "🔧 Cleaning previous build artifacts (bin/obj/publish/release)..."
dotnet clean -c Release || true
rm -rf "$ROOT_DIR/bin" "$ROOT_DIR/obj" "$PUBLISH_DIR"
# ensure a fresh release dir exists
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

if [ "$(id -u)" -eq 0 ]; then
  echo "⚠️  Attention: tu exécutes le script en tant que root (sudo). Il est recommandé d'exécuter ce script sans sudo pour éviter des problèmes de permissions lors de la copie des artefacts (roxify_native.exe)."
fi

echo "🔧 Build: dotnet build (Release)"
dotnet build -c Release --no-incremental

echo "📦 Using prebuilt roxify_native.exe (no npm build)"
# Prefer global build location or local tools build if present. Do not run npm here.
if [ -f "/home/yohan/roxify/dist/roxify_native.exe" ]; then
  echo "✅ Found global roxify_native.exe at /home/yohan/roxify/dist/roxify_native.exe"
  mkdir -p "$ROOT_DIR/tools/roxify/dist"
  if [ ! -f "$ROOT_DIR/tools/roxify/dist/roxify_native.exe" ] || [ "/home/yohan/roxify/dist/roxify_native.exe" -nt "$ROOT_DIR/tools/roxify/dist/roxify_native.exe" ]; then
    echo "📋 Copying to $ROOT_DIR/tools/roxify/dist for local convenience"
    cp -f "/home/yohan/roxify/dist/roxify_native.exe" "$ROOT_DIR/tools/roxify/dist/roxify_native.exe" || echo "⚠️ Failed to copy into tools/roxify/dist"
  fi
elif [ -f "$ROOT_DIR/tools/roxify/dist/roxify_native.exe" ]; then
  echo "✅ Found local roxify_native.exe at $ROOT_DIR/tools/roxify/dist/roxify_native.exe"
else
  echo "⚠️  roxify_native.exe not found in known locations; publish will continue but may be incomplete"
fi

echo "🔧 dotnet publish -> $PUBLISH_DIR"
rm -rf "$PUBLISH_DIR"
mkdir -p "$PUBLISH_DIR"

dotnet publish -c Release -r win-x64 --no-self-contained -o "$PUBLISH_DIR"

# Ensure roxify_native.exe is present in the publish tree. Try multiple known locations.
mkdir -p "$PUBLISH_DIR/roxify"
COPIED=0
# Preferred global build location
if [ -f "/home/yohan/roxify/dist/roxify_native.exe" ]; then
  echo "📥 Copying roxify_native.exe from /home/yohan/roxify/dist"
  cp -f "/home/yohan/roxify/dist/roxify_native.exe" "$PUBLISH_DIR/roxify/roxify_native.exe" && COPIED=1 || COPIED=0
fi
# Local tools build location
if [ "$COPIED" -eq 0 ] && [ -f "$ROOT_DIR/tools/roxify/dist/roxify_native.exe" ]; then
  echo "📥 Copying roxify_native.exe from $ROOT_DIR/tools/roxify/dist"
  cp -f "$ROOT_DIR/tools/roxify/dist/roxify_native.exe" "$PUBLISH_DIR/roxify/roxify_native.exe" && COPIED=1 || COPIED=0
fi

if [ ! -f "$PUBLISH_DIR/roxify/roxify_native.exe" ]; then
  echo "⚠️  roxify_native.exe not found in $PUBLISH_DIR/roxify — publish may be incomplete"
else
  echo "✅ roxify_native.exe copied to $PUBLISH_DIR/roxify/roxify_native.exe"
fi

# Write build stamp into publish tree for easy verification without executing the binary
# extract BuildStamp reliably using sed (works with various encodings)
STAMP="$(sed -n 's/.*BuildStamp = "\([^"]*\)".*/\1/p' src/Program.cs || true)"
echo "$STAMP" > "$PUBLISH_DIR/BUILDSTAMP.txt"
echo "Build stamp written to $PUBLISH_DIR/BUILDSTAMP.txt: $STAMP"

# Attempt to build installer if requested and possible
if [ "$NO_INSTALLER" -eq 0 ]; then
  echo "
🔩 Tentative de génération de l'installateur (Inno Setup)"
  if command -v wine >/dev/null 2>&1; then
    if [ -z "${ISCC_PATH:-}" ]; then
      echo "⚠️  ISCC_PATH non défini — pour construire l'installateur sur Linux, définis ISCC_PATH vers le chemin de ISCC.exe (ex: C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe)."
      echo "🔧 Skipping installer build"
    else
      WIN_PUBLISH_DIR="$(winepath -w "$PUBLISH_DIR" | tr -d '\r')"
      WIN_RELEASE_DIR="$(winepath -w "$RELEASE_DIR" | tr -d '\r')"
      mkdir -p "$RELEASE_DIR"
      echo "🛠️  Lancement de ISCC via wine: $ISCC_PATH"
      # ISCC expects args: /O<OutputDir> /F<OutputName> /DReleaseDir=<PublishDir> <installer.iss>
      wine "$ISCC_PATH" /O"$WIN_RELEASE_DIR" /F"Pyxelze_Setup" /DReleaseDir="$WIN_PUBLISH_DIR" "$ROOT_DIR/tools/installer/installer.iss" || echo "⚠️  ISCC (Inno) a échoué"
    fi
  else
    echo "⚠️  wine non installé — impossible de lancer ISCC depuis Linux and build de l'installateur ignoré"
  fi
else
  echo "ℹ️  Option --no-installer activée — skip building installer"
fi

# Create a timestamped zip release
mkdir -p "$RELEASE_DIR"
RELEASE_NAME="Pyxelze-publish-$(date +%Y%m%d-%H%M%S).zip"
echo "📦 Création du zip de release: $RELEASE_DIR/$RELEASE_NAME"
(cd "$PUBLISH_DIR" && zip -r "$RELEASE_DIR/$RELEASE_NAME" .) || echo "⚠️  zip a échoué"

# SHA256
if command -v sha256sum >/dev/null 2>&1; then
  echo "🧾 Génération des checksums SHA256..."
  (cd "$RELEASE_DIR" && sha256sum * > sha256sums.txt 2>/dev/null) || true
  echo "🧾 SHA256 écrit dans $RELEASE_DIR/sha256sums.txt"
else
  echo "⚠️  sha256sum non disponible — pas de checksum généré"
fi

# Run quick tests if available
if [ -f "$ROOT_DIR/scripts/test_publish.sh" ]; then
  echo "
🧪 Exécution de scripts/test_publish.sh pour validation rapide"
  bash "$ROOT_DIR/scripts/test_publish.sh" || echo "⚠️  Certains tests ont échoué"
fi

echo "✅ Publish terminé. Artifacts:"
ls -lh "$PUBLISH_DIR" || true
echo ""
ls -lh "$RELEASE_DIR" || true

du -sh "$PUBLISH_DIR" || true

echo "Terminé"
