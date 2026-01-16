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

echo "🔧 Build: dotnet build (Release)"
dotnet build -c Release --no-incremental

echo "📦 Build roxify (npm -> cargo if available)"
if command -v npm >/dev/null 2>&1; then
  if [ -d "$ROOT_DIR/tools/roxify" ]; then
    (cd "$ROOT_DIR/tools/roxify" && npm ci && npm run build:exe) || echo "⚠️  roxify build failed (continuing)"
  else
    echo "⚠️  $ROOT_DIR/tools/roxify not found — skipping npm build"
  fi
else
  echo "⚠️  npm not found — skipping roxify build"
fi

echo "🔧 dotnet publish -> $PUBLISH_DIR"
rm -rf "$PUBLISH_DIR"
mkdir -p "$PUBLISH_DIR"

dotnet publish -c Release -r win-x64 --no-self-contained -o "$PUBLISH_DIR"

if [ ! -f "$PUBLISH_DIR/roxify/roxify_native.exe" ]; then
  echo "⚠️  roxify_native.exe not found in $PUBLISH_DIR/roxify — publish may be incomplete"
fi

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
  sha256sum "$RELEASE_DIR/$RELEASE_NAME" > "$RELEASE_DIR/SHA256SUMS.txt"
  echo "🧾 SHA256 écrit dans $RELEASE_DIR/SHA256SUMS.txt"
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
