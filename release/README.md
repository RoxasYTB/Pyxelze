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

## Commandes rapides pour construire la release 🛠️

1. Générer les fichiers de l'exécutable (depuis la racine du repo) :

```cmd
cd tools\roxify
npm ci
npm run build:exe
```

2. Créer le dossier de production `release\roxify` :

```cmd
cd <repo-root>
.\make_release.cmd
```

3. (Optionnel) Construire l'installateur Inno Setup :

> Remarque : Inno Setup (ISCC) doit être installé sur la machine ou disponible via Chocolatey.

```cmd
choco install innosetup -y   :: (si vous utilisez choco)
cd tools\installer
build_installer.cmd
```

4. Tester la release localement (sans Node global) :

```cmd
release\roxify\rox.cmd --version
release\roxify\rox.cmd --help
```

Si tu préfères ne pas installer Node/npm en local pour builder, le workflow GitHub Actions `make_release` construit la release et l'installateur pour toi (artefacts disponibles dans la page Actions). ✨
