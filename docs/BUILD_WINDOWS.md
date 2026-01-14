# Guide de build pour Windows VM

## Étapes à suivre sur ta machine Windows :

### 1. Prérequis

- Visual Studio 2022 avec workload .NET desktop
- Inno Setup 6 (pour créer l'installateur)

### 2. Transférer le projet

Copie le dossier complet `Pyxelze-Light` sur ta VM Windows

### 3. Build du projet

Ouvre une invite de commandes dans `Pyxelze-Light\Pyxelze\` et exécute :

```cmd
build_production.cmd
```

Cette commande va :

- Compiler le GUI .NET en Release
- Copier tous les fichiers dans `production\`
- Copier le CLI roxify depuis `tools\roxify\dist`

### 4. Créer l'installateur

```cmd
cd tools\installer
build_installer.cmd
```

L'installateur sera créé : `Pyxelze-Setup.exe`

### 5. Test de l'installateur

Lance `Pyxelze-Setup.exe` et vérifie :

- L'installation se termine sans erreur
- Le menu contextuel apparaît (clic droit sur fichier/dossier → Pyxelze)
- `rox` fonctionne depuis le terminal (tape `rox --version`)

### 6. Si erreur "Invalid host defined options"

Consulte les logs :

- `C:\Program Files\Pyxelze\tools\roxify\rox.err.txt`
- `C:\Program Files\Pyxelze\failure.log`

Envoie-moi le contenu de ces fichiers pour diagnostic.

---

## Fichiers modifiés pour corriger l'erreur

1. **index.js** : Priorise l'exécution via `node.exe` (externe) au lieu du require direct
2. **package.json** : Externalise sharp et zstd du bundle esbuild
3. **download-node.js** : Télécharge `node.exe` v20.11.0 pour Windows
4. **RoxRunner.cs** : Ajoute `TryCheckRox()` pour validation pré-installation
5. **Program.cs** : Bloque l'installation du menu contextuel si rox ne fonctionne pas

## Architecture du CLI roxify

```
production\
  ├── Pyxelze.exe (GUI)
  ├── node.exe (runtime Node pour rox)
  ├── build\
  │   └── rox-bundle.cjs (CLI bundlé)
  └── node_modules\
      ├── sharp\ (natif Windows)
      └── @mongodb-js\zstd\ (natif Windows)
```

Le wrapper `index.js` lance : `node.exe build\rox-bundle.cjs [args]`
