#!/bin/bash
set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Pyxelze - Build complet Linux→Windows${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

cd "$(dirname "$0")/Pyxelze"
ROOT=$(pwd)

echo -e "${GREEN}[1/5] Nettoyage des builds précédents...${NC}"
rm -rf bin/Release
rm -rf production
rm -rf tools/installer/Pyxelze-Setup.exe

echo -e "${GREEN}[2/6] Compilation du module natif Windows (forcé chaque build)...${NC}"
cd /home/yohan/roxify
cargo build --release --target x86_64-pc-windows-gnu --lib
if [ ! -f target/x86_64-pc-windows-gnu/release/roxify_native.dll ]; then
    echo -e "${RED}ERREUR: Compilation du module natif a échoué${NC}"
    exit 1
fi
echo -e "${GREEN}   ✓ Module natif Windows compilé ($(du -sh target/x86_64-pc-windows-gnu/release/roxify_native.dll | cut -f1))${NC}"
cd "$ROOT"

echo -e "${GREEN}[3/6] (CLI roxify archivé) - pas de build Node.js pour cette version${NC}"
# Le code Node/CLI a été archivé dans `tools/archive/roxify`. Si vous avez besoin
# de reconstruire le CLI, restaure manuellement `tools/archive/roxify` et exécute
# `npm install && npm run build:exe` dans ce dossier. Le script continue sans CLI.

echo -e "${GREEN}   (skip) Remplacement du module natif par la version Windows (non applicable)${NC}"


echo -e "${GREEN}[4/6] Publication .NET pour Windows...${NC}"
dotnet publish -c Release -r win-x64 --self-contained false -p:EnableWindowsTargeting=true -o bin/Release/net7.0-windows
if [ $? -ne 0 ]; then
    echo -e "${RED}ERREUR: dotnet publish a échoué${NC}"
    exit 1
fi
echo -e "${GREEN}   ✓ GUI .NET publié${NC}"

echo -e "${GREEN}[5/6] Copie des fichiers dans bin/Release...${NC}"
mkdir -p bin/Release/net7.0-windows/tools/roxify
cp -r tools/roxify/dist/* bin/Release/net7.0-windows/tools/roxify/
echo -e "${GREEN}   ✓ Roxify copié dans output${NC}"

# Copier le module natif Windows au niveau tools/ afin que le bundle le trouve via ../../libroxify_native.node
WINDOWS_DLL_PATH="/home/yohan/roxify/target/x86_64-pc-windows-gnu/release/roxify_native.dll"
if [ -f "$WINDOWS_DLL_PATH" ]; then
    mkdir -p bin/Release/net7.0-windows/tools
    cp "$WINDOWS_DLL_PATH" bin/Release/net7.0-windows/tools/libroxify_native.node
    chmod 644 bin/Release/net7.0-windows/tools/libroxify_native.node 2>/dev/null || true
    echo -e "${GREEN}   ✓ Module natif Windows installé dans tools/ (libroxify_native.node)${NC}"
else
    echo -e "${RED}ATTENTION: $WINDOWS_DLL_PATH introuvable — le module natif Windows ne sera pas inclus dans l'installateur${NC}"
fi

echo -e "${GREEN}   Suppression du dossier win-x64 dupliqué...${NC}"
rm -rf bin/Release/net7.0-windows/win-x64
echo -e "${GREEN}   ✓ win-x64 supprimé (économie de ~86M)${NC}"

echo -e "${GREEN}[6/6] Génération de l'installateur Inno Setup...${NC}"
cd tools/installer

if [ ! -f "/usr/bin/iscc" ] && [ ! -f "$HOME/.wine/drive_c/Program Files (x86)/Inno Setup 6/ISCC.exe" ]; then
    echo -e "${RED}ERREUR: Inno Setup non trouvé${NC}"
    echo "Installez Inno Setup via Wine:"
    echo "  1. Téléchargez: https://jrsoftware.org/download.php/is.exe"
    echo "  2. Installez: wine is.exe"
    exit 1
fi

if [ -f "/usr/bin/iscc" ]; then
    iscc installer.iss
elif [ -f "$HOME/.wine/drive_c/Program Files (x86)/Inno Setup 6/ISCC.exe" ]; then
    wine "$HOME/.wine/drive_c/Program Files (x86)/Inno Setup 6/ISCC.exe" installer.iss
else
    echo -e "${RED}ERREUR: Compilateur Inno Setup introuvable${NC}"
    exit 1
fi

if [ ! -f "Pyxelze-Setup.exe" ]; then
    echo -e "${RED}ERREUR: Pyxelze-Setup.exe non généré${NC}"
    exit 1
fi

SETUP_SIZE=$(du -h Pyxelze-Setup.exe | cut -f1)
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✓ BUILD RÉUSSI !${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Installateur: ${BLUE}tools/installer/Pyxelze-Setup.exe${NC} ($SETUP_SIZE)"
echo ""
echo "Transfert sur VM Windows:"
echo "  scp Pyxelze/tools/installer/Pyxelze-Setup.exe user@windows-vm:~/"
echo ""
echo "Puis sur Windows:"
echo "  Pyxelze-Setup.exe"
echo ""
