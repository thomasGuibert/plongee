# Cours de plongée — instructions pour Claude

Site **Jekyll** publié par GitHub Pages : cours Plongeur Niveau 1 (PE20 FFESSM) et fiches de révision N2.
Structure et ajout d'une séance : voir `README.md`. Contexte et état du projet :
`docs/contexte-projet-claude.md`.

## Règles

- Le contenu suit le PE20 (décembre 2025) et le MFT. Ne pas inventer de technique, de seuil ou de
  règle de sécurité : citer la source ou poser la question.
- Une technique n'existe qu'une fois, dans `_data/techniques.yml`. Les séances la référencent par son id.
- Garder la compatibilité GitHub Pages : uniquement les plugins de la gem `github-pages`, pas de
  workflow de build sur mesure.
- Avant de pousser, construire le site en local et vérifier qu'il n'y a pas d'erreur :
  `LANG=C.UTF-8 bundle exec jekyll build`.
- Les fichiers propres au dépôt (`CLAUDE.md`, `docs/`) sont exclus du site dans `_config.yml`.

## Conventions

- Textes en français. Ids de techniques et de compétences en minuscules, sans accents.
