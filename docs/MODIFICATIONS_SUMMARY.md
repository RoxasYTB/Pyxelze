# Résumé des modifications - Pyxelze Build System

## Date: 14 janvier 2026

## Objectif

Simplifier le workflow de développement en se concentrant sur `publish_final` pour les tests rapides, en évitant la reconstruction de l'installateur à chaque modification.

## Fichiers modifiés

### 1. rebuild_publish.sh (NOUVEAU)

Script de build rapide pour `publish_final`:

- Build en Release avec dotnet
- Copie automatique vers `publish_final/`
- Copie du binaire roxify depuis `/home/yohan/roxify/target/x86_64-pc-windows-gnu/release/`

### 2. test_publish.sh (NOUVEAU)

Script de test automatique:

- Vérifie la structure de publish_final
- Test du binaire roxify
- Test de création et lecture d'archives
- Validation du format JSON

### 3. create_test_archive.sh (NOUVEAU)

Script utilitaire pour créer des archives de test facilement.

### 4. Form1.cs

**Modification: Support du format JSON de roxify**

- Ajout de `using System.Text.Json;`
- ParseData() modifié pour supporter les deux formats:
  - JSON: `[{"name":"file.txt","size":123}]` (nouveau format roxify)
  - Texte: `file.txt (123 bytes)` (ancien format, rétrocompatibilité)

### 5. RoxRunner.cs

**Amélioration de la gestion d'erreurs:**

- Ajout d'un timeout explicite sur WaitForExit
- Messages d'erreur plus détaillés
- Affichage du stdout en plus du stderr
- Meilleure gestion des processus qui ne démarrent pas

### 6. Pyxelze.csproj

**Ajout d'un target CopyRoxifyToBuild:**

- Copie automatique de roxify_native.exe après le build
- Source: `../../roxify/target/x86_64-pc-windows-gnu/release/roxify_native.exe`
- Destination: `$(OutDir)roxify/`

### 7. BUILD_WORKFLOW.md (NOUVEAU)

Documentation complète du workflow de développement.

## Problèmes résolus

### ✅ Manque du dossier roxify dans publish_final

- **Cause**: Pas de target pour copier roxify lors d'un build simple
- **Solution**: Script rebuild_publish.sh copie manuellement le binaire

### ✅ Format JSON non supporté

- **Cause**: roxify retourne du JSON, ParseData attendait du texte
- **Solution**: ParseData détecte et parse le JSON automatiquement

### ✅ Messages d'erreur peu clairs

- **Cause**: RoxRunner ne gérait pas bien les erreurs
- **Solution**: Amélioration des messages avec timeout et stdout

## Problèmes connus (non résolus)

### ⚠️ Fichier .err.txt jamais créé

L'application cherche `rox.err.txt` mais roxify ne le crée jamais.
Ce fichier devrait être généré par roxify en cas d'erreur critique.

### ⚠️ Tests limités sous Linux

Wine ne peut pas exécuter Pyxelze.exe car .NET n'est pas disponible.
Tests complets uniquement possibles via partage Samba vers Windows.

## Workflow de test recommandé

1. **Modification du code**

   ```bash
   # Éditer Form1.cs, RoxRunner.cs, etc.
   ```

2. **Build rapide**

   ```bash
   cd /home/yohan/partage_vm/Pyxelze-Light/Pyxelze
   ./rebuild_publish.sh
   ```

3. **Tests automatiques**

   ```bash
   ./test_publish.sh
   ```

4. **Partage Samba pour Windows**

   - Partager le dossier `publish_final`
   - Tester sur Windows réel avec .NET installé

5. **Création d'installateur** (seulement en fin de cycle)
   ```bash
   # Quand tout fonctionne, créer l'installateur
   wine ~/.wine/drive_c/Program\ Files\ \(x86\)/Inno\ Setup\ 6/ISCC.exe tools/installer/installer.iss
   ```

## Gains

- **Temps de build**: ~1 minute au lieu de plusieurs minutes avec l'installateur
- **Itérations rapides**: Build + copie directe sans Inno Setup
- **Tests automatisés**: Validation immédiate après build
- **Meilleure robustesse**: Support JSON, gestion d'erreurs améliorée
