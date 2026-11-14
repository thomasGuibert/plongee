// Édition des capacités et des séances directement depuis le site.
// Les modifications sont enregistrées dans _data/capacites/<id>.yml via l'API GitHub,
// avec un jeton personnel conservé dans ce navigateur uniquement.
(function () {
  "use strict";
  var CFG = window.EDITION || {};
  var BLANC = ["Objectif final", "Position dans la formation", "Prérequis", "Critères d'évaluation", "Organisation"];
  var FAUTES = "Fautes classiques et correctifs";
  var JAUNE = ["Objectif de séance", "Justification", "Description des exercices", "Points clés à donner aux élèves",
    "Consignes de sécurité", "Communication spécifique", "Prochaine séance"];
  var CLE_JETON = "plongee-jeton-github";

  function lireJeton() { try { return localStorage.getItem(CLE_JETON) || ""; } catch (e) { return ""; } }
  function ecrireJeton(v) { try { if (v) localStorage.setItem(CLE_JETON, v); else localStorage.removeItem(CLE_JETON); } catch (e) {} }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  // Le texte peut contenir <s>…</s> (texte barré) : on le garde, tout le reste est échappé.
  function escTexte(s) { return esc(s).replace(/&lt;(\/?)s&gt;/g, "<$1s>"); }

  // ---- Champ <-> texte de la zone de saisie ----
  // Une ligne par élément. « [rouge] … » ou « [vert] … » = annotation.
  function champVersTexte(f) {
    if (!f) return "";
    var lignes = (f.texte || []).slice();
    (f.notes || []).forEach(function (n) { lignes.push("[" + n.couleur + "] " + n.texte); });
    return lignes.join("\n");
  }
  function texteVersChamp(nom, txt) {
    var f = { champ: nom, texte: [] }, notes = [];
    txt.split("\n").forEach(function (l) {
      l = l.trim();
      if (!l) return;
      var m = l.match(/^\[(rouge|vert)\]\s*(.*)$/i);
      if (m) notes.push({ couleur: m[1].toLowerCase(), texte: m[2] });
      else f.texte.push(l);
    });
    if (notes.length) f.notes = notes;
    return f;
  }
  function trouver(liste, nom) {
    for (var i = 0; i < (liste || []).length; i++) if (liste[i].champ === nom) return liste[i];
    return null;
  }

  // ---- Affichage (même rendu que le gabarit Jekyll) ----
  function champHtml(f) {
    if (!f) return "";
    var h = "", t = f.texte || [];
    if (t.length === 1) h += "<div>" + escTexte(t[0]) + "</div>";
    else if (t.length > 1) h += '<ul class="plain">' + t.map(function (x) { return "<li>" + escTexte(x) + "</li>"; }).join("") + "</ul>";
    (f.notes || []).forEach(function (n) { h += '<div class="note ' + esc(n.couleur) + '">' + escTexte(n.texte) + "</div>"; });
    return h;
  }
  function vueHtml(d) {
    var h = "";
    if (d.rattachement) h += '<p class="comment">' + esc(d.rattachement) + "</p>";
    h += "<dl>";
    (d.blanc || []).forEach(function (f) { h += "<dt>" + esc(f.champ) + "</dt><dd>" + champHtml(f) + "</dd>"; });
    if (d.fautes) h += "<dt>" + esc(d.fautes.champ) + "</dt><dd>" + champHtml(d.fautes) + "</dd>";
    h += '</dl><div class="seances">';
    (d.seances || []).forEach(function (s, i) {
      if (s.a_rediger) {
        h += '<div class="stile todo"><small>Séance ' + (i + 1) + " · à rédiger</small>" + esc(s.titre) + "</div>";
      } else {
        h += '<details class="seance"' + (i === 0 ? " open" : "") + '><summary class="stile"><small>Séance ' + (i + 1) + "</small>" + esc(s.titre) + '</summary><div class="sdetail">';
        (s.champs || []).forEach(function (f) { h += '<div class="row"><div class="k">' + esc(f.champ) + '</div><div class="v">' + champHtml(f) + "</div></div>"; });
        h += "</div></details>";
      }
    });
    h += '<button type="button" class="stile add" data-action="nouvelle-seance"><small>Séance</small>+ Nouvelle séance</button>';
    return h + "</div>";
  }

  // ---- Formulaire ----
  var compteur = 0;
  function zone(label, valeur, jaune) {
    var id = "ed-" + (++compteur);
    return '<div class="ed-champ' + (jaune ? " jaune" : "") + '"><label for="' + id + '">' + esc(label) + "</label>" +
      '<textarea id="' + id + '" data-champ="' + esc(label) + '" rows="' + Math.max(2, valeur.split("\n").length + 1) + '">' + esc(valeur) + "</textarea></div>";
  }
  function formSeance(s, i) {
    var id = "ed-" + (++compteur);
    var h = '<fieldset class="ed-seance" data-index="' + i + '"><legend>Séance ' + (i + 1) + "</legend>" +
      '<div class="ed-champ jaune"><label for="' + id + '">Titre de la séance</label><input id="' + id + '" class="ed-titre" value="' + esc(s.titre || "") + '"></div>';
    JAUNE.forEach(function (nom) { h += zone(nom, champVersTexte(trouver(s.champs, nom)), true); });
    h += '<button type="button" class="btn-lien" data-action="suppr-seance">Supprimer cette séance</button></fieldset>';
    return h;
  }
  function JETON() {
    return '<div class="ed-jeton"' + (lireJeton() ? " hidden" : "") + '>' +
      '<label for="ed-jeton-' + compteur + '">Jeton GitHub (une seule fois par navigateur)</label>' +
      '<input id="ed-jeton-' + compteur + '" class="ed-jeton-val" type="password" autocomplete="off" placeholder="github_pat_…">' +
      '<p class="ed-aide">Créez un jeton « fine-grained » sur <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">GitHub</a>, limité au dépôt <code>' + esc(CFG.repo) + '</code>, avec la permission <em>Contents : Read and write</em>. Il reste enregistré dans ce navigateur seulement.</p></div>';
  }
  function formHtml(d) {
    var h = '<form class="ed-form" novalidate>' +
      '<p class="ed-statut" role="status" hidden></p>' + JETON() +
      '<p class="ed-aide">Validez avec ✓ ou annulez avec ✗ en haut de la capacité. Une ligne par élément. Commencez une ligne par <code>[rouge]</code> ou <code>[vert]</code> pour une annotation.</p>' +
      '<fieldset class="ed-blanc"><legend>Capacité (bloc blanc)</legend>';
    BLANC.forEach(function (nom) { h += zone(nom, champVersTexte(trouver(d.blanc, nom)), false); });
    h += zone(FAUTES, champVersTexte(d.fautes), false) + "</fieldset>";
    h += '<div class="ed-seances">';
    (d.seances || []).forEach(function (s, i) { h += formSeance(s, i); });
    h += '</div><button type="button" class="btn-lien" data-action="ajout-seance">+ Ajouter une séance</button>';
    h += '<div class="ed-actions"><button type="button" class="btn-lien" data-action="oublier"' + (lireJeton() ? "" : " hidden") + '>Oublier le jeton</button>' +
      '</div></form>';
    return h;
  }
  function lireForm(form, base) {
    var d = JSON.parse(JSON.stringify(base || {}));
    var blanc = form.querySelector(".ed-blanc");
    d.blanc = BLANC.map(function (nom) { return texteVersChamp(nom, blanc.querySelector('[data-champ="' + nom.replace(/"/g, '\\"') + '"]').value); });
    d.fautes = texteVersChamp(FAUTES, blanc.querySelector('[data-champ="' + FAUTES + '"]').value);
    d.seances = Array.prototype.map.call(form.querySelectorAll(".ed-seance"), function (fs, i) {
      var s = { titre: fs.querySelector(".ed-titre").value.trim() || ("Séance " + (i + 1)) };
      var champs = Array.prototype.map.call(fs.querySelectorAll("textarea"), function (t) { return texteVersChamp(t.dataset.champ, t.value); });
      var rempli = champs.some(function (f) { return f.texte.length || f.notes; });
      if (rempli) s.champs = champs; else s.a_rediger = true;
      return s;
    });
    return d;
  }

  // ---- YAML (sous-ensemble suffisant : objets, listes, textes, booléens) ----
  function yamlScalaire(v) {
    if (typeof v === "boolean" || typeof v === "number") return String(v);
    return JSON.stringify(String(v)); // une chaîne JSON est une chaîne YAML valide
  }
  function yaml(v, indent) {
    indent = indent || "";
    var h = "";
    if (Array.isArray(v)) {
      if (!v.length) return " []\n";
      h = "\n";
      v.forEach(function (x) {
        if (x !== null && typeof x === "object" && !Array.isArray(x)) {
          var corps = yaml(x, indent + "  ").replace(/^\n/, "");
          h += indent + "- " + corps.slice(indent.length + 2);
        } else h += indent + "-" + (typeof x === "object" ? yaml(x, indent + "  ") : " " + yamlScalaire(x) + "\n");
      });
      return h;
    }
    if (v !== null && typeof v === "object") {
      var cles = Object.keys(v).filter(function (k) { return v[k] !== undefined && v[k] !== null; });
      if (!cles.length) return " {}\n";
      h = "\n";
      cles.forEach(function (k) {
        var x = v[k];
        h += indent + k + ":" + (typeof x === "object" ? yaml(x, indent + "  ") : " " + yamlScalaire(x) + "\n");
      });
      return h;
    }
    return " " + yamlScalaire(v) + "\n";
  }
  function versYaml(data) { return yaml(data, "").replace(/^\n/, ""); }

  // ---- GitHub ----
  function b64(str) {
    var octets = new TextEncoder().encode(str), bin = "";
    for (var i = 0; i < octets.length; i++) bin += String.fromCharCode(octets[i]);
    return btoa(bin);
  }
  function api(chemin, jeton, options) {
    options = options || {};
    options.headers = { "Authorization": "Bearer " + jeton, "Accept": "application/vnd.github+json" };
    return fetch("https://api.github.com/repos/" + CFG.repo + "/contents/" + chemin, options);
  }
  function enregistrer(id, nom, data, jeton) {
    var chemin = "_data/capacites/" + id + ".yml";
    var texteYaml = versYaml(data);
    return api(chemin + "?ref=" + CFG.branche, jeton).then(function (r) {
      if (r.status === 404) return null;
      if (r.status === 401 || r.status === 403) throw new Error("jeton");
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then(function (actuel) {
      var corps = { message: "Modifier la capacité « " + nom + " » depuis le site", content: b64(texteYaml), branch: CFG.branche };
      if (actuel) corps.sha = actuel.sha;
      return api(chemin, jeton, { method: "PUT", body: JSON.stringify(corps) });
    }).then(function (r) {
      if (r.status === 401 || r.status === 403) throw new Error("jeton");
      if (r.status === 409) throw new Error("conflit");
      if (!r.ok) throw new Error("HTTP " + r.status);
    });
  }
  function messageErreur(e) {
    if (e.message === "jeton") return "GitHub refuse le jeton. Vérifiez qu'il donne accès en écriture au dépôt, puis réessayez.";
    if (e.message === "conflit") return "Le fichier a changé entre-temps sur GitHub. Rechargez la page puis refaites la modification.";
    if (e instanceof TypeError) return "Impossible de joindre GitHub (connexion ou bloqueur). Vos saisies sont toujours là : réessayez.";
    return "L'enregistrement a échoué (" + e.message + "). Vos saisies sont toujours là : réessayez.";
  }

  // ---- Branchement ----
  function donnees(article) {
    var s = article.querySelector(".capa-data");
    if (s) { try { return JSON.parse(s.textContent); } catch (e) {} }
    return { blanc: [], seances: [{ titre: "Séance 1" }] };
  }
  function boutons(article, edition) {
    article.querySelector('[data-action="edit"]').hidden = edition;
    article.querySelector('[data-action="valider"]').hidden = !edition;
    article.querySelector('[data-action="annuler"]').hidden = !edition;
  }
  function ouvrir(article) {
    boutons(article, true);
    var corps = article.querySelector(".capa-body");
    article.dataset.vue = corps.innerHTML;
    article.classList.add("en-edition");
    corps.innerHTML = formHtml(donnees(article));
    var t = corps.querySelector("textarea");
    if (t) t.focus();
  }
  function fermer(article, html) {
    article.querySelector(".capa-body").innerHTML = html;
    article.classList.remove("en-edition");
    boutons(article, false);
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-action]");
    if (!b) return;
    var article = b.closest(".capa");
    if (!article) return;
    var a = b.dataset.action;
    if (a === "nouvelle-seance") {
      var neuve = !article.querySelector(".capa-data");
      ouvrir(article);
      var l = article.querySelector(".ed-seances");
      if (!neuve) l.insertAdjacentHTML("beforeend", formSeance({ titre: "" }, l.children.length));
      var titre = l.lastElementChild.querySelector(".ed-titre");
      l.lastElementChild.scrollIntoView({ block: "start", behavior: "smooth" });
      titre.focus({ preventScroll: true });
      return;
    }
    if (a === "valider") sauver(article);
    else if (a === "edit") { if (!article.classList.contains("en-edition")) ouvrir(article); }
    else if (a === "annuler") fermer(article, article.dataset.vue || "");
    else if (a === "ajout-seance") {
      var liste = article.querySelector(".ed-seances");
      liste.insertAdjacentHTML("beforeend", formSeance({ titre: "" }, liste.children.length));
      liste.lastElementChild.querySelector(".ed-titre").focus();
    } else if (a === "suppr-seance") {
      var fs = b.closest(".ed-seance"), parent = fs.parentNode;
      parent.removeChild(fs);
      Array.prototype.forEach.call(parent.children, function (x, i) { x.querySelector("legend").textContent = "Séance " + (i + 1); });
    } else if (a === "oublier") {
      ecrireJeton("");
      b.hidden = true;
      article.querySelector(".ed-jeton").hidden = false;
    }
  });

  function afficher(statut, texte, erreur) {
    statut.hidden = false;
    statut.textContent = texte;
    statut.classList.toggle("erreur", !!erreur);
    statut.scrollIntoView({ block: "center", behavior: "smooth" });
  }
  function sauver(article) {
    var form = article.querySelector(".ed-form");
    if (!form) return;
    var statut = form.querySelector(".ed-statut");
    var bouton = article.querySelector('[data-action="valider"]');
    try {
      var champJeton = form.querySelector(".ed-jeton-val");
      var jeton = (champJeton && champJeton.value.trim()) || lireJeton();
      if (!jeton) {
        form.querySelector(".ed-jeton").hidden = false;
        afficher(statut, "Collez d'abord votre jeton GitHub dans le champ ci-dessous, puis cliquez à nouveau sur ✓.", true);
        champJeton.focus({ preventScroll: true });
        return;
      }
      var data = lireForm(form, donnees(article));
      bouton.disabled = true;
      afficher(statut, "Enregistrement en cours…", false);
    } catch (err) {
      bouton.disabled = false;
      afficher(statut, "Erreur dans la page : " + err.message, true);
      return;
    }
    enregistrer(article.dataset.id, article.dataset.nom, data, jeton).then(function () {
      ecrireJeton(jeton);
      var s = article.querySelector(".capa-data");
      if (!s) { s = document.createElement("script"); s.type = "application/json"; s.className = "capa-data"; article.insertBefore(s, article.firstChild); }
      s.textContent = JSON.stringify(data);
      article.classList.remove("empty");
      var pill = article.querySelector(".pill");
      pill.classList.remove("todo");
      pill.textContent = data.seances.length + " séance" + (data.seances.length > 1 ? "s" : "");
      bouton.disabled = false;
      fermer(article, '<p class="ed-ok" role="status">Enregistré. Le site publié se met à jour dans une à deux minutes.</p>' + vueHtml(data));
      article.scrollIntoView({ block: "start", behavior: "smooth" });
    }).catch(function (err) {
      bouton.disabled = false;
      if (window.console) console.error("Enregistrement impossible", err);
      afficher(statut, messageErreur(err), true);
      if (err.message === "jeton") { ecrireJeton(""); form.querySelector(".ed-jeton").hidden = false; }
    });
  }
  document.addEventListener("submit", function (e) {
    var form = e.target.closest(".ed-form");
    if (!form) return;
    e.preventDefault();
    sauver(form.closest(".capa"));
  });
})();
