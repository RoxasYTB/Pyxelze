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
  echo "🔧 Compilation cible Windows (x86_64-pc-windows-gnu) pour roxify_native..."
  (cd /home/yohan/roxify && cargo build -p roxify_native --release --target x86_64-pc-windows-gnu) || true
fi
mkdir -p publish_final/roxify
cp /home/yohan/roxify/target/x86_64-pc-windows-gnu/release/roxify_native.exe publish_final/roxify/ || true

echo "✅ Build terminé!"
echo "Fichiers dans publish_final:"
ls -lh publish_final/
echo ""
echo "Contenu de roxify:"
ls -lh publish_final/roxify/
echo ""
echo "Taille totale:"
du -sh publish_final/
