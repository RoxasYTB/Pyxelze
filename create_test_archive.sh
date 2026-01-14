#!/bin/bash

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <fichier_source> <archive_destination.rox>"
    echo "Exemple: $0 test.txt /tmp/archive.rox"
    exit 1
fi

SOURCE="$1"
DEST="$2"

cd /home/yohan/partage_vm/Pyxelze-Light/Pyxelze/publish_final

if [ ! -f "$SOURCE" ]; then
    echo "❌ Fichier source '$SOURCE' introuvable"
    exit 1
fi

echo "📦 Création de l'archive..."
echo "   Source: $SOURCE"
echo "   Destination: $DEST"
echo ""

wine roxify/roxify_native.exe encode "$SOURCE" "$DEST" 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Archive créée avec succès !"
    echo ""
    echo "📋 Contenu de l'archive:"
    wine roxify/roxify_native.exe list "$DEST" 2>&1
    echo ""
    echo "📁 Fichier créé: $DEST"
    ls -lh "$DEST"
else
    echo "❌ Erreur lors de la création de l'archive"
    exit 1
fi
