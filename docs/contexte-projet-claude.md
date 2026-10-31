# Contexte du projet (à déposer dans le projet Claude « Cours plongée »)

Résumé de l'état du projet (octobre 2026).

## Objet

- Site du cours **Plongeur Niveau 1 (PE20 FFESSM)** pour préparer et suivre les séances : une page par
  séance, un référentiel des techniques avec leurs prérequis.
- Fiches de révision **Niveau 2** dans `prepa-n2/`.
- Repo : https://github.com/thomasGuibert/plongee (branche `main`). Site visé :
  https://thomasguibert.github.io/plongee/

## Décisions

- **Jekyll publié par GitHub Pages**, en déploiement depuis la branche `main`, dossier racine. Pas de
  workflow Actions : GitHub Pages construit le site lui-même (gem `github-pages`).
- **Une séance = un fichier** `_seances/NN-nom.md`. Le front matter décrit la séance : `numero`,
  `objectif`, `lieu`, `duree`, `encadrement`, `materiel`, `evaluation`.
- **Trois temps par séance** : au bord (`bord`), sur l'eau (`surface`), dans l'eau (`immersion`).
  Chaque temps liste des `techniques` (ids de `_data/techniques.yml`) et des `consignes`.
- **Les données sont la source de vérité** : `_data/techniques.yml` (65 techniques avec compétence,
  temps et prérequis), `_data/competences.yml` (les 10 compétences du PE20 et la théorie, avec leur
  couleur), `_data/temps.yml`. Un id de technique mal écrit s'affiche en rouge (« Technique inconnue »).
- **Sources** : Manuel de formation technique FFESSM Plongeur Niveau 1 (PE20, décembre 2025) et le
  [MFT en ligne](https://mft.readthedocs.io/fr/latest/04_Plongeur_niveau_1/).

## État

- Commit `1f55520` « Site GitHub Pages du cours de plongée N1 » poussé sur `main`.
- Séance 1 `01-decouverte.md` « Découvrir son matériel » : conçue par Thomas (questions guidées, oct. 2026), plus un exemple.
- Build local vérifié avec la gem `github-pages` : il passe. Pages génère bien `/`,
  `/seances/01-decouverte/`, `/referentiel/` et les fiches `prepa-n2/*.html` (Markdown sans front
  matter), et tous les liens internes pointent vers des pages existantes.
- **GitHub Pages pas encore activé** (le site répond 404). Depuis une session Claude Code dans le
  cloud, l'API Pages (`repos/thomasGuibert/plongee/pages`) est refusée par le proxy (HTTP 403) et le
  jeton `gh` est invalide. À activer à la main : Settings → Pages → Deploy from a branch → `main` /
  `/ (root)`.

## Prochaines étapes

- Activer Pages, suivre le premier build, vérifier `/`, `/seances/01-decouverte/`, `/referentiel/`
  et les liens vers `prepa-n2/*.html`.
- Écrire les séances suivantes (ventilation, équilibrage, etc.) en s'appuyant sur les prérequis du
  référentiel.
