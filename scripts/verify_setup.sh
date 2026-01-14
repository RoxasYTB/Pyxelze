#!/bin/bash
set -e

echo "==> Vérification du contenu de l'installateur..."
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

echo "Extraction de l'installateur..."
7z x -y /home/yohan/partage_vm/Pyxelze-Light/Pyxelze/tools/installer/Pyxelze-Setup.exe >/dev/null 2>&1 || true

if [ -f "Pyxelze.exe" ]; then
    echo "✓ Pyxelze.exe trouvé"
    ls -lh Pyxelze.exe

    # Vérifier si les strings sont présentes
    if strings Pyxelze.dll 2>/dev/null | grep -q "GetFileTypeName"; then
        echo "✓ GetFileTypeName trouvé dans Pyxelze.dll"
    else
        echo "✗ GetFileTypeName PAS trouvé dans Pyxelze.dll"
    fi

    # Vérifier la taille de l'ImageList
    if strings Pyxelze.dll 2>/dev/null | grep -q "ImageSize"; then
        echo "✓ ImageSize trouvé dans Pyxelze.dll"
    else
        echo "✗ ImageSize PAS trouvé dans Pyxelze.dll"
    fi
else
    echo "✗ Pyxelze.exe non trouvé dans l'installateur"
    ls -la | head -20
fi

cd /
rm -rf "$TEMP_DIR"
echo "Nettoyage terminé"
