# Pyxelze - Workflow de développement

## Build rapide pour tests

Pour rebuilder rapidement `publish_final` pour les tests :

```bash
cd /home/yohan/partage_vm/Pyxelze-Light/Pyxelze
./rebuild_publish.sh
```

Ce script :

- Build le projet en Release
- Copie tous les fichiers vers `publish_final/`
- Copie le binaire `roxify_native.exe` depuis `/home/yohan/roxify/`

## Test du build

```bash
./test_publish.sh
```

Vérifie que :

- La structure est correcte
- roxify fonctionne
- Le format JSON est supporté

## Structure de publish_final

```
publish_final/
├── Pyxelze.exe          # Application principale
├── Pyxelze.dll
├── appIcon.ico
├── roxify/
│   └── roxify_native.exe # Binaire Rust pour compression/décompression
├── tools/               # Outils optionnels Node.js
└── win-x64/            # Runtime .NET
```

## Développement

1. Modifier le code C# dans `Form1.cs`, `RoxRunner.cs`, etc.
2. Lancer `./rebuild_publish.sh`
3. Partager `publish_final` via Samba pour tester sur Windows
4. Ou utiliser wine pour des tests rapides (limité)

## Corrections récentes

### Support du format JSON de roxify

- `Form1.cs` : ParseData() supporte maintenant le JSON retourné par `roxify list`
- Format attendu : `[{"name":"file.txt","size":123}]`

### Copie automatique de roxify

- Le script `rebuild_publish.sh` copie automatiquement `roxify_native.exe`
- Source : `/home/yohan/roxify/target/x86_64-pc-windows-gnu/release/roxify_native.exe`

## Problèmes connus

### Pas de fichier .err.txt

L'application cherche un fichier `rox.err.txt` qui n'est jamais créé par roxify.
Ce fichier devrait être généré par roxify en cas d'erreur critique.

### Timeout des commandes

Un timeout de 10 secondes est configuré pour éviter que l'UI se bloque.
Si roxify ne répond pas dans ce délai, l'opération est annulée.

## Tests sous Linux (limité)

Wine ne peut pas exécuter l'application car .NET n'est pas disponible.
Pour des tests complets, utiliser un vrai Windows ou le partage Samba.

```bash
# Test de roxify seul (fonctionne)
wine publish_final/roxify/roxify_native.exe --version

# Test de l'application (ne fonctionne pas - .NET manquant)
wine publish_final/Pyxelze.exe  # ❌ Erreur
```
