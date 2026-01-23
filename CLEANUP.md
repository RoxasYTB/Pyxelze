Nettoyage de l'historique — Résumé

Ce dépôt a subi une réécriture complète de l'historique pour retirer les fichiers binaires et artefacts lourds (installateurs, exécutables, archives de release, dossiers `bin/`, `obj/`, `release/`, `production/`, `publish_final/`, `tools/roxify/dist/`, etc.).

Pourquoi :
- Réduire la taille du dépôt
- Supprimer des fichiers non-pertinents au code source
- Limiter les faux positifs antivirus et faciliter le passage en public

Sauvegardes créées (avant réécriture) :
- Local bundle : `../Pyxelze-backup-20260123.bundle`
- Branche distante : `backup-before-cleanup-20260123` (pushée sur origin)

Que fais-je maintenant :
- L'historique a été nettoyé (réécriture avec `git filter-branch` + `git-filter-repo`), et le remote a été mis à jour en force (branches + tags).

IMPORTANT — Actions à effectuer pour les contributeurs :
1. **Ne pas** faire `git pull` sur vos clones locaux : cela va créer un historique incompatible.
2. Re-cloner le dépôt depuis GitHub :
   ```bash
   git clone https://github.com/RoxasYTB/Pyxelze.git
   ```
3. Recréez vos branches locales et appliquez vos changements dessus si nécessaire.

Si vous avez des forks ou des CI externes, vous devrez mettre à jour ces remotes / flux à la nouvelle base.

Si vous voulez restaurer une version ancienne conservée dans la backup bundle, contactez-moi et je peux restaurer une référence ou extraire des fichiers spécifiques.

Contact : `RoxasYTB <roxasyotabe@gmail.com>`

---

Notes techniques :
- Le nettoyage a été effectué en plusieurs étapes : suppression de dossiers, suppression par patterns (*.exe, *.zip), puis `git-filter-repo --strip-blobs-bigger-than 5M` pour garantir l'élimination des blobs volumineux.
- Le remote `origin` a été ré-ajouté et un push forcé a été réalisé pour mettre à jour le dépôt distant.

Si tu veux, je peux maintenant :
- Ajouter des workflows GitHub Actions (CI + Release) pour automatiser la génération d'artefacts hors dépôt
- Supprimer d'autres fichiers spécifiques si tu en signales
- Lancer une vérification finale (scan de taille, recherche de secrets)
