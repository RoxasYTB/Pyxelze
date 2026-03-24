# Pyxelze

Explorateur et gestionnaire d'archives stéganographiques multiplateforme (Linux, Windows). Pyxelze permet de créer, ouvrir, naviguer et extraire des archives roxify — des fichiers PNG contenant des données cachées dans les pixels via stéganographie.

[![GitHub release](https://img.shields.io/github/v/release/RoxasYTB/Pyxelze)](https://github.com/RoxasYTB/Pyxelze/releases)

---

## Fonctionnalités

### Gestion d'archives

- Création d'archives PNG stéganographiques à partir de fichiers ou dossiers
- Ouverture et navigation dans les archives existantes
- Extraction complète ou sélective de fichiers
- Ajout de fichiers à une archive existante (décompression + ré-encodage)
- Chiffrement AES-256-GCM par passphrase avec détection automatique à l'ouverture
- Boucle de retry en cas de mot de passe incorrect
- Informations détaillées : taille archive, taille contenu, ratio de compression, nombre de fichiers, chiffrement, dates

### Interface graphique

- Barre d'outils avec boutons colorés (Nouveau, Ouvrir, Ajouter, Tout extraire, Extraire, Infos, Remonter) et icônes SVG
- Barre d'adresse affichant le chemin complet (archive + chemin interne)
- QTreeView avec colonnes (Nom, Taille, Type)
- Tri par colonne cliquable avec dossiers toujours en premier
- Zoom Ctrl+molette pour changer la taille des icônes
- Menu contextuel (clic droit) : Ouvrir, Extraire vers…, Extraire ici
- Barre de statut avec compteurs fichiers/dossiers et barre de progression

### Thème sombre / clair

- Basculement mode sombre / clair via le menu Affichage
- Persistance du thème via QSettings
- Application dynamique à toutes les fenêtres (hot-switch)
- Palette complète : fond, texte, contrôles, accents, hover, sélection, bordures

### Drag & Drop

- **Drag OUT** : extraction à la demande vers le gestionnaire de fichiers avec QDrag/QMimeData
- **Drag IN** : ajout de fichiers/dossiers à l'archive par glisser-déposer
- Nettoyage automatique des fichiers temporaires à la fermeture

### Navigation

- Navigation dans les dossiers virtuels par double-clic
- Double-clic sur un fichier : extraction temporaire et ouverture avec l'application associée
- Bouton Remonter et élément ".." pour remonter dans l'arborescence
- Conservation de l'arborescence complète
- Raccourcis : Ctrl+O (ouvrir), Backspace (remonter), Ctrl+Molette (zoom)

### Internationalisation

- 13 langues : français, anglais, allemand, espagnol, italien, russe, arabe, japonais, chinois, coréen, portugais, turc, polonais
- Détection automatique de la langue système
- Changement de langue à chaud via le menu

### Ligne de commande

- `pyxelze <fichier>` : ouvre l'archive dans l'UI
- `pyxelze extract <fichier>` : extraction headless
- `pyxelze compress <dossier>` : compression headless
- `pyxelze version` : affiche la version

### Mise à jour automatique

- Vérification via l'API GitHub Releases au lancement
- Téléchargement et lancement automatique de l'installeur (Windows) ou notification (Linux)
- Vérification manuelle via le menu Outils

### Moteur roxify

- Communication avec `roxify_native` en sous-processus
- Compression multi-threadée Zstd avec accélération Rust native
- Chiffrement AES-256-GCM avec dérivation PBKDF2
- Liste de fichiers encodée dans les pixels (résiliente aux re-saves PNG)

---

## Prérequis

### Linux

- **Qt 6** (Widgets, Network, Svg)
- **CMake 3.20+**
- **g++** ou **clang++** avec support C++20
- **roxify_native** : `npm install -g roxify`

### Windows

- **Qt 6** (Widgets, Network, Svg)
- **CMake 3.20+**
- **MSVC** ou **MinGW** avec support C++20
- **roxify_native** : `npm install -g roxify`
- **Inno Setup 6** (optionnel, pour l'installateur) : [Télécharger](https://jrsoftware.org/isdl.php)

---

## Build

```bash
git clone https://github.com/RoxasYTB/Pyxelze.git
cd Pyxelze
mkdir build && cd build
cmake -DCMAKE_BUILD_TYPE=Release ..
make -j$(nproc)
```

### Paquets Linux

#### AppImage

```bash
bash scripts/build_appimage.sh
```

#### Debian/Ubuntu (.deb)

```bash
bash scripts/build_deb.sh
```

### Installateur Windows

```cmd
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" packaging\windows\installer.iss
```

---

## Licence

Ce projet est distribué sous la **Pyxelze Proprietary Open Source License (RPOSL)**. Le code source est librement consultable pour un usage personnel, éducatif et de recherche. Tous les droits commerciaux sont exclusivement réservés à l'auteur. Voir le fichier `LICENSE`.

---

## Contact

- **Repository** : https://github.com/RoxasYTB/Pyxelze
- **Issues** : https://github.com/RoxasYTB/Pyxelze/issues
