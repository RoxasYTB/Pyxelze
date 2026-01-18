#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo "🔨 Build de Pyxelze pour publish_final..."

dotnet build -c Release --no-incremental

PUB_DIR="$ROOT_DIR/publish_final"
rm -rf "$PUB_DIR"
mkdir -p "$PUB_DIR"

echo "📦 Copie vers publish_final (sans win-x64 et tools)..."

# Publish a Windows build to obtain a proper Pyxelze.exe
echo "🔧 Publish Windows (win-x64) pour récupérer Pyxelze.exe..."
dotnet publish -c Release -r win-x64 -o "$ROOT_DIR/bin/Release/net7.0-windows/win-x64-publish" --no-self-contained || true

if [ -d "$ROOT_DIR/bin/Release/net7.0-windows" ]; then
  find "$ROOT_DIR/bin/Release/net7.0-windows" -maxdepth 1 -type f -exec cp {} "$PUB_DIR/" \;
fi

# If publish produced a Windows exe, copy it to publish_final root
if [ -f ./bin/Release/net7.0-windows/win-x64-publish/Pyxelze.exe ]; then
  echo "📄 Copying published Pyxelze.exe to publish_final/"
  cp -f ./bin/Release/net7.0-windows/win-x64-publish/Pyxelze.exe publish_final/Pyxelze.exe || true
fi

echo "📋 Build & copie du binaire roxify..."
if [ -d /home/yohan/roxify ]; then
  echo "🔧 Compilation cible Windows (x86_64-pc-windows-gnu) pour roxify_native (release, no debuginfo)..."
  (cd /home/yohan/roxify && \
    RUSTFLAGS="-C debuginfo=0 -C link-args=-s" cargo build -p roxify_native --release --target x86_64-pc-windows-gnu; echo "Exit code: $?" ) || true
else
  echo "⚠️  Dossier /home/yohan/roxify introuvable — impossible de compiler roxify_native"
fi
mkdir -p publish_final/roxify
if [ -f /home/yohan/roxify/target/x86_64-pc-windows-gnu/release/roxify_native.exe ]; then
  cp -v /home/yohan/roxify/target/x86_64-pc-windows-gnu/release/roxify_native.exe publish_final/roxify/ || true
  # Strip symbols to reduce embedded source paths in the binary which may trigger AV heuristics
  if command -v strip >/dev/null 2>&1; then
    echo "🔧 Stripping roxify_native.exe in publish_final/roxify/..."
    strip --strip-all publish_final/roxify/roxify_native.exe || true
  fi
else
  echo "⚠️  roxify_native.exe non trouvé, vérifie la compilation."
fi

# Also attempt to copy to publish_with_native (used by make_installer)
if [ -f publish_final/roxify/roxify_native.exe ]; then
  mkdir -p "$ROOT_DIR/publish_with_native/roxify"
  cp -v publish_final/roxify/roxify_native.exe "$ROOT_DIR/publish_with_native/roxify/" || true
  if command -v strip >/dev/null 2>&1; then
    strip --strip-all "$ROOT_DIR/publish_with_native/roxify/roxify_native.exe" || true
  fi
fi

# Create a timestamped zip release and compute SHA256
RELEASE_DIR="$ROOT_DIR/releases"
mkdir -p "$RELEASE_DIR"
RELEASE_NAME="Pyxelze-publish-$(date +%Y%m%d-%H%M%S).zip"
echo "📦 Création du zip de release: $RELEASE_DIR/$RELEASE_NAME"
(cd "$ROOT_DIR" && zip -r "$RELEASE_DIR/$RELEASE_NAME" publish_final/*) || echo "⚠️ zip a échoué"

# Compute SHA256 and add to SHA256SUMS.txt
if command -v sha256sum >/dev/null 2>&1; then
  sha256sum "$RELEASE_DIR/$RELEASE_NAME" > "$RELEASE_DIR/SHA256SUMS.txt"
  echo "🧾 SHA256 written to $RELEASE_DIR/SHA256SUMS.txt"
else
  echo "⚠️ sha256sum non disponible — pas de checksum généré"
fi

echo "✅ Build terminé!"
echo "Fichiers dans publish_final:"
ls -lh publish_final/
echo ""
echo "Contenu de roxify:"
ls -lh publish_final/roxify/ || true

echo "Fichiers dans releases:"
ls -lh "$RELEASE_DIR/" || true

echo ""
echo "Taille totale publish_final:"
du -sh publish_final/ || true

