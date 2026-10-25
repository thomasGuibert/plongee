# Cours de plongée

Site du cours **Plongeur Niveau 1 (PE20)**, publié avec GitHub Pages :
<https://thomasguibert.github.io/plongee/>

Chaque séance se déroule en trois temps : **au bord** (piscine ou bateau), **sur l'eau** (en surface) et **dans l'eau** (en immersion).

## Structure

| Dossier / fichier | Contenu |
|---|---|
| `_seances/` | Une séance = un fichier Markdown (`01-decouverte.md`, …) |
| `_data/techniques.yml` | Toutes les techniques du N1 : compétence, temps, prérequis |
| `_data/competences.yml` | Les 10 compétences du PE20 + la théorie, avec leur couleur |
| `_data/temps.yml` | Les trois temps d'une séance |
| `index.html` | Accueil : liste des séances |
| `referentiel.html` | Toutes les techniques par compétence, avec leurs prérequis |
| `_layouts/`, `_includes/`, `assets/` | Mise en page et style |
| `prepa-n2/` | Fiches de révision N2 |

## Ajouter une séance

Créer `_seances/02-ventilation.md` en copiant la séance 1, puis modifier l'en-tête :

```yaml
---
title: Ventilation
numero: 2
objectif: Gérer l'eau dans le masque et l'embout.
lieu: Fosse 3 à 6 m
duree: 1 h 30
temps:
  - id: bord        # bord | surface | immersion
    duree: 15 min
    techniques: [t_baro]          # ids de _data/techniques.yml
    consignes: |
      - …
  - id: immersion
    techniques: [v_masque, v_embout]
evaluation:
  - …
---
Texte libre en Markdown (points de vigilance, débriefing…).
```

Les techniques s'affichent avec la couleur de leur compétence et renvoient au référentiel.
Un id mal écrit apparaît en rouge (« Technique inconnue »).
Retirer `exemple: true` quand une séance n'est plus un exemple.

## Publier

1. Sur GitHub : **Settings → Pages → Build and deployment**.
2. Source : **Deploy from a branch**, branche `main`, dossier `/ (root)`.
3. Le site est reconstruit à chaque push sur `main`.

## Voir le site en local

Nécessite Ruby et Bundler.

```bash
bundle install
bundle exec jekyll serve
```

Puis ouvrir <http://localhost:4000/plongee/>.

## Sources

- Manuel de formation technique FFESSM Plongeur Niveau 1 (PE20), version décembre 2025
- [MFT en ligne](https://mft.readthedocs.io/fr/latest/04_Plongeur_niveau_1/)
