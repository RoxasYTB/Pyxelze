#!/bin/bash

echo "🧪 Test de Pyxelze publish_final"
echo "================================"
echo ""

cd /home/yohan/partage_vm/Pyxelze-Light/Pyxelze/publish_final

echo "✓ Vérification de la structure..."
if [ ! -f Pyxelze.exe ]; then
    echo "❌ Pyxelze.exe manquant"
    exit 1
fi

if [ ! -f roxify/roxify_native.exe ]; then
    echo "❌ roxify/roxify_native.exe manquant"
    exit 1
fi

echo "✓ Structure OK"
echo ""

echo "✓ Test de roxify..."
VERSION=$(wine roxify/roxify_native.exe --version 2>&1 | grep -o "roxify_native.*")
if [ -z "$VERSION" ]; then
    echo "❌ roxify ne retourne pas de version"
    exit 1
fi
echo "  Version: $VERSION"
echo ""

echo "✓ Création d'une archive de test..."
mkdir -p /tmp/test_data
echo "Hello from Pyxelze test" > /tmp/test_data/readme.txt
echo "Another file" > /tmp/test_data/data.txt
mkdir -p /tmp/test_data/subdir
echo "Nested file" > /tmp/test_data/subdir/nested.txt

wine roxify/roxify_native.exe encode /tmp/test_data/readme.txt /tmp/test_archive.rox 2>&1 | head -5
echo ""

echo "✓ Test de la commande list..."
LIST_OUTPUT=$(wine roxify/roxify_native.exe list /tmp/test_archive.rox 2>&1)
echo "  Output: $LIST_OUTPUT"

if echo "$LIST_OUTPUT" | grep -q "readme.txt"; then
    echo "✓ Le fichier readme.txt est présent dans l'archive"
else
    echo "❌ Le fichier readme.txt n'est pas trouvé"
    exit 1
fi
echo ""

echo "✓ Vérification du format JSON..."
if echo "$LIST_OUTPUT" | grep -q '^\['; then
    echo "✓ Format JSON détecté"
else
    echo "❌ Format non-JSON"
    exit 1
fi
echo ""

echo "✅ Tous les tests sont passés !"
echo ""
echo "📝 Pour tester avec Windows:"
echo "   1. Partager le dossier publish_final via Samba"
echo "   2. Lancer Pyxelze.exe depuis Windows"
echo "   3. Ouvrir /tmp/test_archive.rox"
