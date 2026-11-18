# Cours de plongée

Site Jekyll publié avec GitHub Pages : <https://thomasguibert.github.io/plongee/>

## Organisation du contenu

- `_competences/` : une page par compétence du Niveau 1 (PE20) : objectif, savoir-faire, savoir-être, savoir et liste des capacités (`nom` + `id`).
- `_data/capacites/<id>.yml` : les séances d'une capacité, sur la trame de la fiche pédagogique Codep. `blanc` = partie capacité, `seances` = une entrée par séance (partie jaune). `a_rediger: true` pour une séance seulement annoncée. `notes` (rouge / vert) = annotations. Les textes peuvent contenir `<b>`, `<i>`, `<s>` et `<span class="c-rouge|c-vert|c-bleu|c-orange">` (mise en forme faite depuis l'éditeur du site).
- `brouillons/` : PDF des brouillons de séances.
- `sources/` : documents de référence, non publiés.
- `documents/` : documents de référence publiés sur le site (manuel PE20). Une compétence y renvoie avec `source_pdf` et `source_page`.

L'accueil affiche la carte de progression ; un clic sur une compétence ouvre sa page.

## Modifier une capacité depuis le site

Sur la page d'une compétence, le crayon en haut à droite d'une capacité ouvre l'édition (nom, bloc blanc et séances, avec une zone « Notes » en fin de séance) ; ✓ enregistre, ✗ annule. L'enregistrement écrit `_data/capacites/<id>.yml` sur `main` via l'API GitHub, avec un jeton personnel « fine-grained » (dépôt `plongee`, permission *Contents : Read and write*) conservé dans le navigateur. Le site se met à jour une à deux minutes plus tard. Les commits faits depuis le site arrivent sur `main` : faire un `git pull --rebase` avant de travailler en local.

Le crayon de l'en-tête d'une compétence modifie son nom, son objectif, ses trois savoirs et sa liste de capacités (`_competences/<nom>.md`). Celui de l'accueil modifie les textes d'introduction (`_data/accueil.yml`). Sur la page d'une compétence, « + Nouvelle technique » ajoute une capacité à sa liste (raccourci depuis chaque carte de l'accueil). Les flèches ↑ ↓ et la poignée ⠿ (glisser-déposer) réordonnent les techniques (ordre de `capacites` dans la compétence) et les séances (ordre de `seances` dans la capacité). Le bouton 🔗 copie le lien vers une section : `#objectif`, `#savoir-faire`, `#savoir-etre`, `#savoir`, `#<id-capacité>`, `#<id-capacité>--<titre-de-séance>` ; sur l'accueil `#competence-<nom>`. Sur l'accueil, la corbeille d'une carte ajoute `corbeille: true` à ce fichier : la compétence passe dans la « Corbeille » repliée en bas de l'accueil, d'où « Restaurer » retire ce champ. Rien n'est effacé.

## Voir le site en local

Nécessite Ruby et Bundler.

```bash
bundle install
bundle exec jekyll serve
```

Puis ouvrir <http://localhost:4000/plongee/>.
