#!/bin/bash
set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Installation Inno Setup 6 via Wine${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ -f "$HOME/.wine/drive_c/Program Files (x86)/Inno Setup 6/ISCC.exe" ]; then
    echo -e "${GREEN}Inno Setup 6 déjà installé!${NC}"
    exit 0
fi

INNO_URL="https://jrsoftware.org/download.php/is.exe"
TEMP_INSTALLER="/tmp/innosetup-installer.exe"

echo -e "${YELLOW}Téléchargement de Inno Setup 6...${NC}"
wget -O "$TEMP_INSTALLER" "$INNO_URL" --progress=bar:force 2>&1

if [ ! -f "$TEMP_INSTALLER" ]; then
    echo "ERREUR: Téléchargement échoué"
    exit 1
fi

echo ""
echo -e "${YELLOW}Installation via Wine (mode silencieux)...${NC}"
wine "$TEMP_INSTALLER" /VERYSILENT /SUPPRESSMSGBOXES /NORESTART /SP-

echo ""
echo -e "${YELLOW}Vérification de l'installation...${NC}"
sleep 3

if [ -f "$HOME/.wine/drive_c/Program Files (x86)/Inno Setup 6/ISCC.exe" ]; then
    echo -e "${GREEN}✓ Inno Setup 6 installé avec succès!${NC}"
    rm -f "$TEMP_INSTALLER"
    exit 0
else
    echo "ERREUR: Installation échouée"
    echo "Essayez manuellement:"
    echo "  wine $TEMP_INSTALLER"
    exit 1
fi
