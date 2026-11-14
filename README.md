# Cours de plongée

Site Jekyll publié avec GitHub Pages : <https://thomasguibert.github.io/plongee/>

## Organisation du contenu

- `_competences/` : une page par compétence du Niveau 1 (PE20) : objectif, savoir-faire, savoir-être, savoir et liste des capacités (`nom` + `id`).
- `_data/capacites/<id>.yml` : les séances d'une capacité, sur la trame de la fiche pédagogique Codep. `blanc` = partie capacité, `seances` = une entrée par séance (partie jaune). `a_rediger: true` pour une séance seulement annoncée. `notes` (rouge / vert) = annotations.
- `brouillons/` : PDF des brouillons de séances.
- `sources/` : documents de référence, non publiés.

L'accueil affiche la carte de progression ; un clic sur une compétence ouvre sa page.

## Voir le site en local

Nécessite Ruby et Bundler.

```bash
bundle install
bundle exec jekyll serve
```

Puis ouvrir <http://localhost:4000/plongee/>.
