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

# Optional: set INNO_SETUP_SHA256 env var to verify downloaded installer before executing
# Example: export INNO_SETUP_SHA256=abcd... (sha256 hex)

echo -e "${YELLOW}Téléchargement de Inno Setup 6...${NC}"
wget -O "$TEMP_INSTALLER" "$INNO_URL" --progress=bar:force 2>&1

if [ ! -f "$TEMP_INSTALLER" ]; then
    echo "ERREUR: Téléchargement échoué"
    exit 1
fi

if [ -n "${INNO_SETUP_SHA256:-}" ]; then
  if command -v sha256sum >/dev/null 2>&1; then
    echo "Vérification SHA256 de l'installateur..."
    got=$(sha256sum "$TEMP_INSTALLER" | awk '{print $1}')
    if [ "$got" != "$INNO_SETUP_SHA256" ]; then
      echo "ERREUR: checksum SHA256 ne correspond pas. Attendu: $INNO_SETUP_SHA256, obtenu: $got"
      echo "Supprimez le fichier et réessayez, ou téléchargez manuellement depuis: $INNO_URL"
      exit 1
    fi
    echo "Checksum OK"
  else
    echo "Warning: sha256sum manquant; impossible de vérifier le checksum. Set INNO_SETUP_SHA256 to verify manually."
  fi
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
