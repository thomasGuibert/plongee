# Cours de plongée — instructions pour Claude

Site **Jekyll** publié par GitHub Pages (déploiement depuis la branche `main`, dossier racine).
Le site a été remis à zéro le 2026-11-14 : aucun ancien contenu pédagogique ne doit être réutilisé.
Le contenu du cours vient de Thomas.

## Règles

- Ne pas inventer de contenu pédagogique, de technique, de seuil ou de règle de sécurité : poser la question.
- Garder la compatibilité GitHub Pages : uniquement les plugins de la gem `github-pages`, pas de
  workflow de build sur mesure.
- Avant de pousser, construire le site en local et vérifier qu'il n'y a pas d'erreur :
  `LANG=C.UTF-8 bundle exec jekyll build`.
- Publication : pas de merge commit. Rebaser sur `main` puis pousser (force push si besoin) pour
  garder un historique linéaire.
- Textes en français.
