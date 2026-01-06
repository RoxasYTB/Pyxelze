# Installer

Génère un installateur Windows pour l'application CLI `rox`.

Prérequis:
- Inno Setup (ISCC) installé ou `ISCC_PATH` défini.

Pour construire l'installateur localement:

1. Depuis la racine du projet, exécuter:

   cd tools/roxify
   npm run build:exe

2. Puis depuis `release`:

   build_installer.cmd

Le fichier de sortie sera `release\Pyxelze-Rox-Setup.exe`.

L'installateur installe les fichiers du dossier `tools/roxify/dist` dans `%LOCALAPPDATA%\Programs\Pyxelze\rox` et exécute `install-rox.cmd` (qui ajoute le dossier au PATH utilisateur si nécessaire).
