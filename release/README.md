# Installer

Génère un installateur Windows pour l'application CLI `rox`.

Prérequis:


Pour construire l'installateur localement:

1. Depuis la racine du projet, exécuter:

   cd tools/roxify
   npm run build:exe

2. Puis depuis `release`:

   build_installer.cmd

Le fichier de sortie sera `release\Pyxelze-Rox-Setup.exe`.

L'installateur installe les fichiers du dossier `tools/roxify/dist` dans `%LOCALAPPDATA%\Programs\Pyxelze\rox` et exécute `install-rox.cmd` (qui ajoute le dossier au PATH utilisateur si nécessaire).

# Release (production package)

Le dossier `release` contient la **version de production** prête à être packagée par l'installateur.

Flux de création :
- Générer l'exécutable et les fichiers associés dans `tools/roxify/dist` (`cd tools/roxify && npm run build:exe`).
- Exécuter `make_release.cmd` depuis la racine du projet pour copier `tools/roxify/dist` dans `release\roxify`.
- L'installateur Inno Setup se trouve dans `tools/installer` et s'attend à trouver les fichiers dans `release` pour les inclure dans l'installateur final.

Pour construire l'installateur localement (optionnel) :

1. Installer Inno Setup (ou définir `ISCC_PATH` vers l'exécutable `ISCC.exe`).
2. Exécuter : `tools\installer\build_installer.cmd` (ou lancer `ISCC` manuellement en passant `/DReleaseDir="<repo>\release"`).

Le fichier de sortie sera `Pyxelze-Rox-Setup.exe` et contiendra les fichiers de `release\roxify`.
