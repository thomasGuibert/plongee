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
  // ---- Mise en forme autorisée : gras, italique, barré, couleurs de la palette ----
  var COULEURS = { rouge: "#c4302b", vert: "#2f8a3c", bleu: "#0b6e8a" };
  function couleurDe(css) {
    if (!css) return "";
    var c = String(css).toLowerCase().replace(/\s/g, "");
    var m = c.match(/^rgb\((\d+),(\d+),(\d+)\)$/);
    if (m) c = "#" + [m[1], m[2], m[3]].map(function (x) { return ("0" + (+x).toString(16)).slice(-2); }).join("");
    for (var k in COULEURS) if (COULEURS[k] === c) return k;
    return "";
  }
  // Transforme un fragment HTML quelconque en HTML sûr limité à <b>, <i>, <s>, <span class="c-…">.
  function nettoyerNoeuds(parent) {
    var h = "";
    Array.prototype.forEach.call(parent.childNodes, function (n) {
      if (n.nodeType === 3) { h += esc(n.nodeValue); return; }
      if (n.nodeType !== 1) return;
      var tag = n.tagName.toLowerCase(), inner = nettoyerNoeuds(n);
      if (tag === "br") return;
      var gras = tag === "b" || tag === "strong" || /bold|[6-9]00/.test(n.style && n.style.fontWeight || "");
      var ital = tag === "i" || tag === "em" || (n.style && n.style.fontStyle === "italic");
      var barre = tag === "s" || tag === "strike" || tag === "del" || /line-through/.test(n.style && n.style.textDecoration || "");
      var coul = (n.classList && Array.prototype.filter.call(n.classList, function (c) { return /^c-/.test(c); })[0] || "").slice(2)
        || couleurDe(n.getAttribute("color")) || couleurDe(n.style && n.style.color);
      if (coul && COULEURS[coul]) inner = '<span class="c-' + coul + '">' + inner + "</span>";
      if (barre) inner = "<s>" + inner + "</s>";
      if (ital) inner = "<i>" + inner + "</i>";
      if (gras) inner = "<b>" + inner + "</b>";
      h += inner;
    });
    return h;
  }
  function nettoyer(html) {
    var d = document.createElement("div");
    d.innerHTML = html;
    return nettoyerNoeuds(d).replace(/&nbsp;|\u00a0/g, " ").trim();
  }
  function escTexte(s) { return nettoyer(s); }

  // ---- Champ <-> éditeur mis en forme ----
  // Une ligne (<div>) par élément.
  function champVersEditeur(f) {
    if (!f) return "<div><br></div>";
    var h = "";
    (f.texte || []).forEach(function (t) { h += "<div>" + nettoyer(t) + "</div>"; });
    // Anciennes annotations : reprises comme lignes colorées.
    (f.notes || []).forEach(function (n) { h += '<div><span class="c-' + esc(n.couleur) + '">' + nettoyer(n.texte) + "</span></div>"; });
    return h || "<div><br></div>";
  }
  function lignesEditeur(ed) {
    var lignes = [], courante = null;
    Array.prototype.forEach.call(ed.childNodes, function (n) {
      if (n.nodeType === 1 && /^(div|p|li)$/i.test(n.tagName)) {
        courante = null;
        lignes.push({ html: nettoyer(n.innerHTML), note: n.getAttribute("data-note") || "" });
      } else if (n.nodeType === 1 && /^br$/i.test(n.tagName)) {
        courante = null;
      } else {
        if (!courante) { courante = { html: "", note: "" }; lignes.push(courante); }
        var tmp = document.createElement("div"); tmp.appendChild(n.cloneNode(true));
        courante.html += tmp.innerHTML;
      }
    });
    lignes.forEach(function (l) { if (l.html.indexOf("<") === -1 && l.html.indexOf("&") === -1) return; l.html = nettoyer(l.html); });
    return lignes.filter(function (l) { return l.html.replace(/<[^>]*>/g, "").trim(); });
  }
  function editeurVersChamp(nom, ed) {
    var f = { champ: nom, texte: [] }, notes = [];
    lignesEditeur(ed).forEach(function (l) {
      if (l.note === "rouge" || l.note === "vert") notes.push({ couleur: l.note, texte: l.html });
      else f.texte.push(l.html);
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
  function zone(label, f, jaune) {
    var id = "ed-" + (++compteur);
    return '<div class="ed-champ' + (jaune ? " jaune" : "") + '"><span class="ed-label" id="' + id + '-l">' + esc(label) + "</span>" +
      '<div class="ed-rte" contenteditable="true" role="textbox" aria-multiline="true" aria-labelledby="' + id + '-l" data-champ="' + esc(label) + '">' + champVersEditeur(f) + "</div></div>";
  }
  var EMOJIS = ["⚠️", "✅", "❌", "💡", "👉", "❗", "❓", "👍", "👎", "👀", "⏱️", "📏", "🫧", "🤿", "🐟", "🌊", "🛟", "🔁", "1️⃣", "2️⃣", "3️⃣"];
  function barreOutils() {
    var b = function (cmd, label, titre, cls) { return '<button type="button" class="ed-outil' + (cls ? " " + cls : "") + '" data-cmd="' + cmd + '" title="' + titre + '" aria-label="' + titre + '">' + label + "</button>"; };
    var h = '<div class="ed-barre" role="toolbar" aria-label="Mise en forme">' +
      b("bold", "<b>G</b>", "Gras") + b("italic", "<i>I</i>", "Italique") + b("strikeThrough", "<s>S</s>", "Barré") +
      '<span class="ed-sep"></span>' +
      '<button type="button" class="ed-outil ed-pastille c-fond-noir" data-cmd="couleur" data-val="noir" title="Texte noir (couleur normale)" aria-label="Texte noir (couleur normale)"></button>';
    Object.keys(COULEURS).forEach(function (k) { h += '<button type="button" class="ed-outil ed-pastille c-fond-' + k + '" data-cmd="couleur" data-val="' + k + '" title="Texte ' + k + '" aria-label="Texte ' + k + '"></button>'; });
    h += b("sans-couleur", "A", "Effacer toute la mise en forme", "ed-sans") + '<span class="ed-sep"></span>' +
      '<span class="ed-sep"></span><details class="ed-emojis"><summary class="ed-outil" title="Emoji" aria-label="Emoji">😊</summary><div class="ed-emojis-liste">' +
      EMOJIS.map(function (e) { return '<button type="button" class="ed-outil" data-cmd="emoji" data-val="' + e + '">' + e + "</button>"; }).join("") +
      "</div></details></div>";
    return h;
  }
  function formSeance(s, i) {
    var id = "ed-" + (++compteur);
    var h = '<fieldset class="ed-seance" data-index="' + i + '"><legend>Séance ' + (i + 1) + "</legend>" +
      '<div class="ed-champ jaune"><label for="' + id + '">Titre de la séance</label><input id="' + id + '" class="ed-titre" value="' + esc(s.titre || "") + '"></div>';
    JAUNE.forEach(function (nom) { h += zone(nom, trouver(s.champs, nom), true); });
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
      '<p class="ed-aide">Validez avec ✓ ou annulez avec ✗ en haut de la capacité. Une ligne par élément. Sélectionnez du texte pour le mettre en forme.</p>' +
      barreOutils() +
      '<fieldset class="ed-blanc"><legend>Capacité (bloc blanc)</legend>';
    BLANC.forEach(function (nom) { h += zone(nom, trouver(d.blanc, nom), false); });
    h += zone(FAUTES, d.fautes, false) + "</fieldset>";
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
    var eds = blanc.querySelectorAll(".ed-rte");
    d.blanc = BLANC.map(function (nom, i) { return editeurVersChamp(nom, eds[i]); });
    d.fautes = editeurVersChamp(FAUTES, eds[BLANC.length]);
    d.seances = Array.prototype.map.call(form.querySelectorAll(".ed-seance"), function (fs, i) {
      var s = { titre: fs.querySelector(".ed-titre").value.trim() || ("Séance " + (i + 1)) };
      var champs = Array.prototype.map.call(fs.querySelectorAll(".ed-rte"), function (t, k) { return editeurVersChamp(JAUNE[k], t); });
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
    var t = corps.querySelector(".ed-rte");
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
  // ---- Barre d'outils ----
  var dernierEditeur = null, derniereSelection = null;
  function memoriser() {
    var sel = window.getSelection();
    if (!sel.rangeCount) return;
    var n = sel.anchorNode, ed = n && (n.nodeType === 1 ? n : n.parentElement);
    ed = ed && ed.closest && ed.closest(".ed-rte");
    if (ed) { dernierEditeur = ed; derniereSelection = sel.getRangeAt(0).cloneRange(); }
  }
  document.addEventListener("selectionchange", memoriser);
  function restaurer() {
    if (!dernierEditeur || !document.body.contains(dernierEditeur)) return false;
    dernierEditeur.focus({ preventScroll: true });
    if (derniereSelection) { var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(derniereSelection); }
    return true;
  }
  function ligneCourante() {
    var sel = window.getSelection();
    if (!sel.rangeCount) return null;
    var n = sel.anchorNode;
    if (!n) return null;
    if (n.nodeType === 1 && n.classList.contains("ed-rte")) n = n.childNodes[sel.anchorOffset] || n.lastChild;
    while (n && n.parentNode && !(n.parentNode.classList && n.parentNode.classList.contains("ed-rte"))) n = n.parentNode;
    if (!n || !n.parentNode) return null;
    if (n.nodeType !== 1 || !/^(div|p)$/i.test(n.tagName)) {
      // texte posé directement dans l'éditeur : on l'enveloppe dans une ligne
      var div = document.createElement("div");
      n.parentNode.insertBefore(div, n);
      div.appendChild(n);
      n = div;
    }
    return n;
  }
  // Les boutons ne doivent pas prendre le focus (sinon la sélection est perdue).
  document.addEventListener("mousedown", function (e) { if (e.target.closest(".ed-outil")) e.preventDefault(); });
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".ed-outil[data-cmd]");
    if (!b) return;
    e.preventDefault();
    if (!restaurer()) return;
    var cmd = b.dataset.cmd;
    try { document.execCommand("styleWithCSS", false, false); } catch (x) {}
    // « noir » = couleur normale du texte : appliquée à l'écran puis retirée à l'enregistrement.
    if (cmd === "couleur") document.execCommand("foreColor", false, COULEURS[b.dataset.val] || getComputedStyle(dernierEditeur).color);
    else if (cmd === "sans-couleur") document.execCommand("removeFormat", false, null);
    else if (cmd === "emoji") { document.execCommand("insertText", false, b.dataset.val); var d = b.closest("details"); if (d) d.open = false; }
    else document.execCommand(cmd, false, null);
    memoriser();
  });
  // Coller du texte : garder seulement le texte brut.
  document.addEventListener("paste", function (e) {
    if (!e.target.closest || !e.target.closest(".ed-rte")) return;
    e.preventDefault();
    var t = (e.clipboardData || window.clipboardData).getData("text/plain");
    document.execCommand("insertText", false, t);
  });
})();
