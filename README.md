# Pyxelze

Explorateur et gestionnaire d'archives steganographiques pour Windows. Pyxelze permet de créer, ouvrir, naviguer et extraire des archives roxify - des fichiers PNG contenant des données cachees dans les pixels via steganographie.

[![GitHub release](https://img.shields.io/github/v/release/RoxasYTB/Pyxelze)](https://github.com/RoxasYTB/Pyxelze/releases)

---

## Fonctionnalites

### Gestion d'archives

- Creation d'archives PNG steganographiques a partir de fichiers ou dossiers
- Ouverture et navigation dans les archives existantes
- Extraction complete ou selective de fichiers
- Ajout de fichiers a une archive existante (decompression + re-encodage)
- Chiffrement AES-256-GCM par passphrase avec detection automatique a l'ouverture
- Boucle de retry en cas de mot de passe incorrect
- Informations detaillees : taille archive, taille contenu, ratio de compression, nombre de fichiers, chiffrement, dates

### Interface graphique

- Barre d'outils avec 7 boutons colores (Nouveau, Ouvrir, Ajouter, Tout extraire, Extraire, Infos, Remonter) et icones Segoe Fluent Icons
- Barre d'adresse affichant le chemin complet (archive + chemin interne)
- ListView avec 3 colonnes (Nom, Taille, Type) et 4 modes de vue (Details, List, SmallIcon, LargeIcon)
- Tri par colonne cliquable avec dossiers toujours en premier
- Owner-draw complet avec en-tetes personnalises et accents colores
- Double-buffering pour eliminer le scintillement
- Zoom Ctrl+molette pour changer le mode de vue
- Menu contextuel (clic droit) : Ouvrir, Extraire vers..., Extraire ici
- Barre de statut avec compteurs fichiers/dossiers et barre de progression

### Theme sombre / clair

- Basculement mode sombre / clair via le menu Affichage
- Persistance du theme via le registre Windows
- Application dynamique a toutes les fenetres (hot-switch)
- Palette complete : fond, texte, controles, accents, hover, selection, bordures, headers

### Drag & Drop

- **Drag OUT** : extraction a la demande (lazy) vers l'explorateur Windows avec support dossiers et chemins courts 8.3
- **Drag IN** : ajout de fichiers/dossiers a l'archive par glisser-deposer depuis l'explorateur
- Nettoyage automatique des fichiers temporaires

### Navigation

- Navigation dans les dossiers virtuels par double-clic
- Double-clic sur un fichier : extraction temporaire et ouverture avec l'application associee
- Bouton Remonter et element ".." pour remonter dans l'arborescence
- Conservation de l'arborescence complete (pas de suppression du prefixe commun)
- Raccourcis : Ctrl+O (ouvrir), Backspace/Alt+Haut (remonter), Ctrl+Molette (zoom)

### Integration Windows

- Menu contextuel Windows sur fichiers et dossiers (Ouvrir l'archive, Decoder, Encoder)
- Association de fichiers .png (Rox)
- Icones de fichiers natives via SHGetFileInfo avec cache par extension
- Surveillance des changements d'associations de fichiers avec rafraichissement automatique
- Installateur Inno Setup avec langues francais/anglais

### Ligne de commande

- `Pyxelze.exe <fichier>` : ouvre l'archive dans l'UI
- `Pyxelze.exe extract <fichier>` / `decode <fichier>` : extraction headless
- `Pyxelze.exe compress <dossier>` : compression headless
- `Pyxelze.exe register-contextmenu` / `unregister-contextmenu` : enregistrement silencieux
- `Pyxelze.exe version` : affiche la version

### Contournement antivirus

- Detection automatique des erreurs d'acces refuse (Windows Defender)
- Retry automatique avec delais croissants
- Option d'ajout d'exclusion Defender ou extraction via repertoire temporaire

### Mise a jour automatique

- Verification via l'API GitHub Releases au lancement
- Telechargement et lancement automatique de l'installeur
- Verification manuelle via le menu Outils

### Moteur roxify

- Communication avec `roxify_native.exe` en sous-processus
- Compression multi-threadee Zstd avec acceleration Rust native
- Chiffrement AES-256-GCM avec derivation PBKDF2
- Liste de fichiers encodee dans les pixels (resiliente aux re-saves PNG)
- Mode resilient aux captures d'ecran (reconstitution)

---

## Prerequis

- **Windows 10/11**
- **.NET 8 SDK** : [Telecharger](https://dotnet.microsoft.com/download/dotnet/8.0)
- **Inno Setup 6** (optionnel, pour l'installateur) : [Telecharger](https://jrsoftware.org/isdl.php)

---

## Build

```cmd
git clone https://github.com/RoxasYTB/Pyxelze.git
cd Pyxelze
dotnet restore
dotnet build -c Release
```

### Publish

```cmd
dotnet publish -c Release -o publish_final
```

### Installateur Windows

```cmd
& "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe" scripts\scripts-windows\tools\installer\installer.iss
```

---

## Licence

Ce projet est distribué sous la **Pyxelze Proprietary Open Source License (RPOSL)**. Le code source est librement consultable pour un usage personnel, éducatif et de recherche. Tous les droits commerciaux sont exclusivement réservés à l'auteur. Voir le fichier `LICENSE`.

---

## Contact

- **Repository** : https://github.com/RoxasYTB/Pyxelze
- **Issues** : https://github.com/RoxasYTB/Pyxelze/issues
