#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "🔨 Build de Pyxelze pour publish_final..."

dotnet build -c Release --no-incremental

echo "📦 Copie vers publish_final (sans win-x64 et tools)..."
rm -rf publish_final/*

# Publish a Windows build to obtain a proper Pyxelze.exe
echo "🔧 Publish Windows (win-x64) pour récupérer Pyxelze.exe..."
dotnet publish -c Release -r win-x64 -o ./bin/Release/net7.0-windows/win-x64-publish --no-self-contained || true

cd bin/Release/net7.0-windows
find . -maxdepth 1 -type f -exec cp {} ../../../publish_final/ \;
cd ../../..

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
