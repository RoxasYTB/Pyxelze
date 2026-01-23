# Pyxelze

> ⚠️ Note : l'historique du dépôt a été réécrit le 2026-01-23 pour retirer des artefacts binaires et réduire la taille du dépôt. Si vous possédez un clone local, **supprimez-le et re-clonez** le dépôt pour éviter des conflits d'historique.

Pyxelze est une application Windows (.NET 7) avec interface graphique (WinForms) permettant de gérer et manipuler des fichiers ROX (archives Zero Install).

Remarque : le CLI historique (`rox`) basé sur Node.js est **archivé** et conservé pour référence sous `tools/archive/roxify`. Il n'est pas requis pour construire, tester ou publier la GUI. Si nécessaire, restaurez `tools/archive/roxify` et reconstruisez manuellement le CLI (Node.js 18+ requis).

---

## Architecture du projet

```
Pyxelze/
├── bin/                     # Sortie de build .NET (ignoré par git)
├── obj/                     # Fichiers objets .NET (ignoré par git)
├── production/              # Dossier de production unifié GUI+CLI (ignoré par git)
├── publish_final/           # Publication .NET Release (ignoré par git)
├── logs/                    # Logs de build (ignoré par git)
├── release/                 # Scripts et fichiers pour la release finale
│   ├── installer.iss        # Script Inno Setup pour l'installateur Windows
│   ├── build_installer.cmd  # Compile l'installateur avec Inno Setup
├── tools/
│   ├── installer/           # Template installer Inno Setup
│   └── archive/             # Code archivé (legacy tools)
│       └── roxify/          # CLI legacy (Node.js) archivé — non requis pour build/publish
│           ├── package.json
│           ├── index.js
│           └── build scripts / tests (voir dossier)

├── Properties/              # AssemblyInfo .NET
├── *.cs                     # Code source C# (Form1, DragHelper, etc.)
├── docs/                    # Documentation regroupée
├── scripts/                 # Scripts shell et batch (build, publish, helpers)
├── Pyxelze.csproj           # Projet .NET 7 WinForms
├── Pyxelze.sln              # Solution Visual Studio
├── appIcon.ico              # Icône de l'application
├── build_production.cmd     # Créé le dossier production unifié
├── make_release.cmd         # Copie tools/roxify/dist -> release/roxify
└── .gitignore               # Ignore bin/, obj/, production/, logs/, *.exe, etc.
```

---

## Prérequis développeur

### Obligatoire

- **Windows 10/11**
- **.NET 7 SDK** : [Télécharger ici](https://dotnet.microsoft.com/download/dotnet/7.0)
- **Node.js 18+ (optionnel)** : [Télécharger ici](https://nodejs.org/) — requis uniquement pour reconstruire le CLI legacy depuis `tools/archive/roxify`
- **Inno Setup 6** : [Télécharger ici](https://jrsoftware.org/isdl.php) (pour compiler l'installateur)

### Optionnel

- **Visual Studio 2022** (pour édition C# avec IntelliSense)
- **Git** (pour versionner le code)

---

## Installation développeur

### 1. Cloner le repository

```cmd
git clone https://github.com/RoxasYTB/Pyxelze.git
cd Pyxelze
```

### 2. Installer les dépendances .NET

```cmd
dotnet restore
```

### 3. Installer les dépendances Node.js (CLI rox)

```cmd
cd tools\roxify
npm ci
cd ..\..
```

---

## Commandes développeur

### Build GUI (Pyxelze.exe)

#### Build Debug

```cmd
dotnet build -c Debug
```

Sortie : `bin\Debug\net7.0-windows\Pyxelze.exe`

#### Build Release

```cmd
dotnet build -c Release
```

Sortie : `bin\Release\net7.0-windows\Pyxelze.exe`

#### Publish Release (autonome avec runtime)

```cmd
dotnet publish -c Release -o publish_final
```

Sortie : `publish_final\Pyxelze.exe` (avec toutes les DLL nécessaires)

---

### CLI (legacy)

Le CLI `roxify` était historiquement inclus dans `tools/roxify` (Node.js). Pour cette version, le CLI a été **archivé** et n'est plus construit ni inclus automatiquement. Le code source du CLI est conservé sous `tools/archive/roxify` pour référence ou reconstruction manuelle si nécessaire.

Si vous avez besoin de reconstruire le CLI :

```cmd
cd tools/archive/roxify
npm ci
npm run build:exe
```

---

### Créer le dossier de production unifié (GUI + CLI)

```cmd
build_production.cmd
```

**Ce script fait :**

1. `dotnet publish -c Release -o publish_final` (GUI)
2. Crée `production/` vide
3. Copie `publish_final\*` → `production\`
4. Copie `tools\roxify\dist\*` → `production\` (ou `release\roxify\*` si dist manquant)

Résultat : `production/` contient Pyxelze.exe + rox.exe + node.exe + tous les fichiers nécessaires.

---

### Créer la release CLI (copie dist → release/roxify)

```cmd
make_release.cmd
```

**Ce script fait :**

- Copie `tools\roxify\dist\*` → `release\roxify\`
- Nécessaire avant `build_production.cmd` si `tools\roxify\dist` n'existe pas encore.

---

### Compiler l'installateur Windows (Inno Setup)

#### Prérequis

1. Build production unifié : `build_production.cmd`
2. Inno Setup 6 installé dans `C:\Program Files (x86)\Inno Setup 6\`

#### Compiler

```cmd
cd release
build_installer.cmd
```

**Ce script fait :**

1. Vérifie que `production\Pyxelze.exe` existe
2. Compile `installer.iss` avec Inno Setup (ISCC.exe)
3. Génère `release\Pyxelze-Setup.exe`

#### Configuration installer (release/installer.iss)

- **Nom** : Pyxelze
- **Version** : 1.0.0
- **Destination** : `%LOCALAPPDATA%\Programs\Pyxelze`
- **Icône** : `appIcon.ico`
- **Raccourcis** :
  - Menu Démarrer : Pyxelze.exe
  - Bureau (optionnel) : Pyxelze.exe
- **Privilèges** : Utilisateur (pas besoin d'admin)
- **Source** : `production\*` (récursif)

---

## Workflow complet : De zéro à l'installateur (GUI)

```cmd
# 1. Build GUI
dotnet publish -c Release -o publish_final

# 2. Créer production unifié (GUI uniquement)
build_production.cmd

# 3. Compiler l'installateur
cd release
build_installer.cmd
cd ..
```

Résultat final : `release\Pyxelze-Setup.exe` (temps dépendant du système). 

Note : si vous devez inclure le CLI legacy, restaurez `tools/archive/roxify`, reconstruisez le CLI (`npm ci && npm run build:exe`) et copiez manuellement la distribution dans `production\` ou `release\roxify` avant de lancer `build_installer.cmd`. (Le CLI est archivé et non reconstruit automatiquement par les scripts par défaut.)

---

## Scripts de build détaillés

### build_production.cmd

**Objectif** : Fusionner GUI (publish_final) et CLI (roxify/dist) dans un seul dossier `production/`.

**Étapes** :

1. `dotnet publish -c Release -o publish_final` → crée l'application GUI autonome
2. `rmdir /s /q production` + `mkdir production` → reset dossier production
3. `xcopy /e /y publish_final\* production\` → copie GUI
4. Optionnel : copier une distribution CLI reconstruite (depuis `tools/archive/roxify` ou `release\roxify`) vers `production\` si vous souhaitez inclure le CLI.

**Variables importantes** :

- `%ROOT_DIR%` : Racine du projet (Pyxelze\)
- `%PROD_DIR%` : `%ROOT_DIR%production`

**Sorties** :

- `production\Pyxelze.exe` (GUI)
- `production\rox.exe` (CLI)
- `production\node.exe` (Node.js runtime pour rox)
- `production\rox.cmd` (wrapper Windows)
- `production\node_modules\` (dépendances roxify)

---

### make_release.cmd

**Objectif** : Copier la distribution CLI (`tools\roxify\dist`) vers `release\roxify` pour utilisation par `build_production.cmd` si `dist` est manquant.

**Étapes** :

1. Vérifie que `tools\roxify\dist` existe
2. Supprime `release\roxify` si existant
3. `xcopy /e /y tools\roxify\dist\* release\roxify\`

**Utilité** :

- Permet de rebuilder `production` sans reconstruire le CLI si déjà distribué.
- `build_production.cmd` utilise `release\roxify` en fallback si `tools\roxify\dist` absent.

---

### release/build_installer.cmd

**Objectif** : Compiler le script Inno Setup (`installer.iss`) en exécutable d'installation.

**Prérequis** :

- `production\Pyxelze.exe` doit exister
- Inno Setup 6 installé

**Étapes** :

1. Vérifie que `production\` existe et contient `Pyxelze.exe`
2. Cherche Inno Setup dans `C:\Program Files (x86)\Inno Setup 6\ISCC.exe`
3. Compile `installer.iss` avec `/DProjectPath=<chemin parent>`
4. Génère `release\Pyxelze-Setup.exe`

**Variables importantes** :

- `%ISCC%` : Chemin vers ISCC.exe (compilateur Inno Setup)
- `%~dp0` : Dossier du script (release\)
- `/DProjectPath` : Passé à Inno Setup pour localiser `production\` et `appIcon.ico`

---

### tools/roxify/build.cmd

**Objectif** : Build CLI rox.exe avec esbuild + pkg.

**Étapes** :

1. `npm ci` : Installe dépendances (roxify, pkg, esbuild)
2. `npm run build:exe` :
   - `esbuild` bundle `node_modules/roxify/dist/cli.js` → `build/rox-bundle.cjs`
   - `scripts/postbuild.js` :
     - Compile `rox-bundle.cjs` avec `pkg` → `rox.exe`
     - Copie `rox.exe`, `node.exe`, `node_modules/`, `rox.cmd`, `install-rox.cmd` → `dist/`

**Sorties** :

- `tools\roxify\dist\rox.exe`
- `tools\roxify\dist\node.exe`
- `tools\roxify\dist\rox.cmd`
- `tools\roxify\dist\install-rox.cmd`
- `tools\roxify\dist\node_modules\` (dépendances runtime)

---

## Dépannage

### Erreur : "IPersistFile::Save failed: code 0x80070005. Accès refusé."

**Solution** : Erreur corrigée dans `installer.iss` en utilisant `{autoprograms}` et `{autodesktop}` au lieu de `{group}` et `{commondesktop}`. Rebuild avec `release\build_installer.cmd`.

### Erreur : "production\Pyxelze.exe not found"

**Cause** : `production\` vide ou non créé.
**Solution** : Exécuter `build_production.cmd` avant `release\build_installer.cmd`.

### Erreur : "tools\roxify\dist not found"

**Cause** : CLI rox non construit.
**Solution** :

```cmd
cd tools\roxify
npm ci
npm run build:exe
cd ..\..
```

### Erreur : "dotnet: command not found"

**Cause** : .NET 7 SDK non installé.
**Solution** : Installer [.NET 7 SDK](https://dotnet.microsoft.com/download/dotnet/7.0).

### Erreur : "ISCC.exe not found"

**Cause** : Inno Setup non installé ou mauvais chemin.
**Solution** : Installer [Inno Setup 6](https://jrsoftware.org/isdl.php) dans le chemin par défaut.

---

## Structure du code source C#

### Fichiers principaux

- **Program.cs** : Point d'entrée application (Main)
- **Form1.cs** : Formulaire principal WinForms (interface graphique)
- **DragHelper.cs** : Gestion drag & drop personnalisé
- **ExtendedListView.cs** : ListView avec support drag & drop
- **ExtractionProgressForm.cs** : Formulaire de progression extraction
- **IconHelper.cs** : Extraction icônes de fichiers
- **LazyDataObject.cs** : Optimisation performances drag & drop
- **ListViewFileSorter.cs** : Tri colonnes ListView
- **NativeMethods.cs** : P/Invoke APIs Windows
- **RoxRunner.cs** : Exécution CLI rox depuis GUI
- **ThemeManager.cs** : Gestion thème visuel application
- **VirtualFile.cs** : Représentation fichiers virtuels dans ROX

### Fichiers configuration

- **Pyxelze.csproj** : Projet .NET 7, inclut target MSBuild pour build CLI automatique
- **Properties/AssemblyInfo.cs** : Métadonnées assembly (version, titre, copyright)
- **appIcon.ico** : Icône application (utilisée par GUI et installateur)

---

## Gestion Git

### Fichiers ignorés (.gitignore)

```
bin/
obj/
production/
publish_final/
logs/
*.exe
release/*.exe
release/Pyxelze-Setup.exe
tools/roxify/dist/
tools/roxify/node_modules/
node_modules/
```

### Fichiers versionnés

- Code source C# (\*.cs)
- Projet .NET (_.csproj, _.sln)
- Scripts de build (_.cmd, _.bat)
- Configuration installer (release/installer.iss)
- Code source CLI (tools/roxify/index.js, package.json, scripts/)
- Documentation (README.md)
- Icônes (appIcon.ico)

### Nettoyage repository

Si des fichiers build ont été ajoutés par erreur :

```cmd
git rm -r --cached bin obj production logs
git commit -m "Remove build artifacts from git"
```

---

## FAQ

**Q : Quelle est la différence entre publish_final et production ?**
R : `publish_final` contient uniquement le GUI publié par .NET. `production` contient GUI + CLI fusionnés (utilisé par l'installateur).

**Q : Pourquoi roxify est dans tools/ et release/ ?**
R : `tools/roxify` = code source CLI + build system. `release/roxify` = copie de `dist/` pour fallback si `dist` absent lors de `build_production.cmd`.

**Q : Comment mettre à jour la version de l'installateur ?**
R : Modifier `AppVersion=1.0.0` dans `release/installer.iss`.

**Q : L'installateur nécessite-t-il les droits admin ?**
R : Non. `PrivilegesRequired=lowest` dans `installer.iss` → installation utilisateur seul (`%LOCALAPPDATA%`).

**Q : Comment déboguer le GUI ?**
R : Ouvrir `Pyxelze.sln` dans Visual Studio 2022, F5 pour lancer en mode Debug.

**Q : Comment tester le CLI sans installer ?**
R : Après `npm run build:exe`, exécuter `tools\roxify\dist\rox.cmd --help`.

---

## Licence

Ce projet est distribué sous **Creative Commons Attribution‑NonCommercial 4.0 International (CC BY‑NC 4.0)**. Voir le fichier `LICENSE` à la racine du dépôt pour le texte légal complet.

---

## Contributing & Security

Les documents de contribution et de sécurité ont été centralisés dans le dossier `docs/` :

- `docs/CONTRIBUTING.md` — guide de contribution
- `docs/SECURITY.md` — signalement des vulnérabilités

Voir aussi : `docs/CLEANUP.md` (historique du dépôt et notes de nettoyage)

---

## Contact / Support

- **Repository GitHub** : https://github.com/RoxasYTB/Pyxelze
- **Issues** : https://github.com/RoxasYTB/Pyxelze/issues
