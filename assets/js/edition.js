// Édition des capacités et des séances directement depuis le site.
// Les modifications sont enregistrées dans _data/capacites/<id>.yml via l'API GitHub,
// avec un jeton personnel conservé dans ce navigateur uniquement.
(function () {
  "use strict";
  var CFG = window.EDITION || {};
  var BLANC = ["Objectif final", "Position dans la formation", "Prérequis", "Critères d'évaluation", "Organisation"];
  var FAUTES = "Fautes classiques et correctifs";
  var JAUNE = ["Objectif de séance", "Justification", "Description des exercices", "Points clés à donner aux élèves",
    "Consignes de sécurité", "Communication spécifique", "Prochaine séance", "Notes"];
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
  var SVG = function (d) { return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>'; };
  function ORDRE(quoi) {
    return '<span class="ordre"><span class="poignee" title="Glisser pour déplacer ' + quoi + '" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">' +
      [[9, 6], [15, 6], [9, 12], [15, 12], [9, 18], [15, 18]].map(function (c) { return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="1.6"/>'; }).join("") + "</svg></span>" +
      '<button type="button" class="btn-ordre" data-action="monter" title="Monter ' + quoi + '" aria-label="Monter ' + quoi + '">↑</button>' +
      '<button type="button" class="btn-ordre" data-action="descendre" title="Descendre ' + quoi + '" aria-label="Descendre ' + quoi + '">↓</button></span>';
  }
  var OUTILS_NOTE = '<span class="capa-tools outils-note">' +
    '<button type="button" class="btn-icone" data-action="note-edit" title="Modifier" aria-label="Modifier les notes de la séance">' + SVG("M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4") + "</button>" +
    '<button type="button" class="btn-icone ok" data-action="note-valider" title="Valider" aria-label="Valider" hidden>' + SVG("M5 12.5l4.5 4.5L19 7.5") + "</button>" +
    '<button type="button" class="btn-icone ko" data-action="note-annuler" title="Annuler" aria-label="Annuler" hidden>' + SVG("M6 6l12 12M18 6L6 18") + "</button></span>";
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
        h += '<div class="stile todo" data-seance="' + i + '"><small>Séance ' + (i + 1) + " · à rédiger</small>" + esc(s.titre) + ORDRE("la séance") + "</div>";
      } else {
        h += '<details class="seance" data-seance="' + i + '"><summary class="stile"><small>Séance ' + (i + 1) + "</small>" + esc(s.titre) + ORDRE("la séance") + '</summary><div class="sdetail">';
        (s.champs || []).forEach(function (f) { if (f.champ !== "Notes") h += '<div class="row"><div class="k">' + esc(f.champ) + '</div><div class="v">' + champHtml(f) + "</div></div>"; });
        var notes = trouver(s.champs, "Notes");
        h += '<div class="row notes"><div class="k"><span>Notes</span>' + OUTILS_NOTE + '</div><div class="v">' + (notes && (notes.texte.length || notes.notes) ? champHtml(notes) : '<span class="vide">Aucune note</span>') + "</div></div>";
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
      '<details class="ed-emojis"><summary class="ed-outil" title="Emoji" aria-label="Emoji">😊</summary><div class="ed-emojis-liste">' +
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
  function formHtml(d, nomCourant) {
    var h = '<form class="ed-form" novalidate>' +
      '<p class="ed-statut" role="status" hidden></p>' + JETON() +
      '<p class="ed-aide">Validez avec ✓ ou annulez avec ✗ en haut de la capacité. Une ligne par élément. Sélectionnez du texte pour le mettre en forme.</p>' +
      barreOutils() +
      '<div class="ed-champ"><label for="ed-nom-' + (++compteur) + '">Nom de la capacité</label><input id="ed-nom-' + compteur + '" class="ed-nom-capa" value="' + esc(nomCourant || "") + '"></div>' +
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
  // Dernier sha connu de chaque fichier (renvoyé par GitHub après chaque écriture) :
  // évite de relire un fichier que GitHub sert encore depuis son cache.
  var SHA = {};
  function lireSha(chemin, jeton) {
    return api(chemin + "?ref=" + CFG.branche + "&t=" + Date.now(), jeton, { cache: "no-store" }).then(function (r) {
      if (r.status === 404) return null;
      if (r.status === 401 || r.status === 403) throw new Error("jeton");
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json().then(function (j) { return j.sha; });
    });
  }
  function ecrire(chemin, message, texteYaml, sha, jeton) {
    var corps = { message: message, branch: CFG.branche };
    if (sha) corps.sha = sha;
    if (texteYaml === null) { // suppression du fichier
      if (!sha) return Promise.resolve({ status: 200, ok: true, json: function () { return Promise.resolve({}); } });
      return api(chemin, jeton, { method: "DELETE", body: JSON.stringify(corps) });
    }
    corps.content = b64(texteYaml);
    return api(chemin, jeton, { method: "PUT", body: JSON.stringify(corps) });
  }
  function lireFichier(chemin, jeton) {
    return api(chemin + "?ref=" + CFG.branche + "&t=" + Date.now(), jeton, { cache: "no-store" }).then(function (r) {
      if (r.status === 401 || r.status === 403) throw new Error("jeton");
      if (r.status === 404) throw new Error("fichier introuvable");
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json().then(function (j) {
        var bin = atob((j.content || "").replace(/\s/g, "")), octets = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) octets[i] = bin.charCodeAt(i);
        return { sha: j.sha, texte: new TextDecoder().decode(octets) };
      });
    });
  }
  function enregistrer(chemin, message, texteYaml, jeton) {
    if (typeof texteYaml === "function") {
      // Modification d'un fichier existant : on relit son contenu actuel, puis on le transforme.
      var transformer = texteYaml;
      var essaiT = function (dernier) {
        return lireFichier(chemin, jeton).then(function (f) {
          return ecrire(chemin, message, transformer(f.texte), f.sha, jeton);
        }).then(function (r) {
          if (r.status === 401 || r.status === 403) throw new Error("jeton");
          if ((r.status === 409 || r.status === 422) && !dernier) return essaiT(true);
          if (r.status === 409) throw new Error("conflit");
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json().then(function (j) { SHA[chemin] = j && j.content ? j.content.sha : null; });
        });
      };
      return essaiT(false);
    }
    var essai = function (sha, dernier) {
      return ecrire(chemin, message, texteYaml, sha, jeton).then(function (r) {
        if (r.status === 401 || r.status === 403) throw new Error("jeton");
        if ((r.status === 409 || r.status === 422) && !dernier) {
          // sha périmé : on relit le fichier et on réessaie une fois
          return lireSha(chemin, jeton).then(function (s) { return essai(s, true); });
        }
        if (r.status === 409) throw new Error("conflit");
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json().then(function (j) { SHA[chemin] = j && j.content ? j.content.sha : null; });
      });
    };
    var depart = SHA[chemin] !== undefined && texteYaml !== null ? Promise.resolve(SHA[chemin]) : lireSha(chemin, jeton);
    return depart.then(function (sha) { return essai(sha, false); });
  }

  // ---- Tampon local et file d'enregistrement ----
  // Chaque ✓ range la capacité dans ce navigateur puis l'envoie à GitHub, une écriture à la fois.
  var CLE_TAMPON = "plongee-tampon-";
  function lireTampon(id) { try { return JSON.parse(localStorage.getItem(CLE_TAMPON + id) || "null"); } catch (e) { return null; } }
  function ecrireTampon(id, v) { try { if (v) localStorage.setItem(CLE_TAMPON + id, JSON.stringify(v)); else localStorage.removeItem(CLE_TAMPON + id); } catch (e) {} }
  var file = Promise.resolve();
  // Envoi générique : cle = clé du tampon, f = { chemin, message, texte, data }, suivi(quoi, message).
  function envoyer(cle, f, jeton, suivi) {
    var t = Date.now();
    ecrireTampon(cle, { t: t, data: f.data, enAttente: true });
    suivi("attente");
    file = file.then(function () {
      var tampon = lireTampon(cle);
      if (!tampon || tampon.t !== t) return; // une version plus récente est déjà en file
      suivi("envoi");
      return enregistrer(f.chemin, f.message, f.texte, jeton).then(function () {
        ecrireJeton(jeton);
        var v = lireTampon(cle);
        if (v && v.t === t) { v.enAttente = false; ecrireTampon(cle, v); }
        suivi("ok");
      }).catch(function (err) {
        if (window.console) console.error("Enregistrement impossible", err);
        if (err.message === "jeton") ecrireJeton("");
        suivi("erreur", messageErreur(err));
      });
    });
  }
  function mettreEnFile(article, data, jeton) {
    var id = article.dataset.id;
    envoyer(id, { chemin: "_data/capacites/" + id + ".yml", message: "Modifier la capacité « " + article.dataset.nom + " » depuis le site", texte: versYaml(data), data: data },
      jeton, function (quoi, m) { etat(article, quoi, m); });
  }
  function etat(article, quoi, message) {
    var e = article.querySelector(".ed-etat");
    if (!e) {
      e = document.createElement("p");
      e.className = "ed-etat";
      e.setAttribute("role", "status");
      (article.querySelector(".capa-top") || article.querySelector(".bloc-corps") || article.firstElementChild).insertAdjacentElement("afterend", e);
    }
    e.className = "ed-etat " + quoi;
    e.hidden = false;
    if (quoi === "attente") e.textContent = "En attente d'enregistrement…";
    else if (quoi === "envoi") e.textContent = "Enregistrement sur GitHub…";
    else if (quoi === "ok") e.textContent = "Enregistré. Le site publié se met à jour dans une à deux minutes.";
    else e.innerHTML = esc(message) + ' Vos modifications sont gardées dans ce navigateur. <button type="button" class="btn-lien" data-action="reessayer">Réessayer</button>';
  }
  function appliquer(article, data) {
    var s = article.querySelector(".capa-data");
    if (!s) { s = document.createElement("script"); s.type = "application/json"; s.className = "capa-data"; article.insertBefore(s, article.firstChild); }
    s.textContent = JSON.stringify(data);
    article.classList.remove("empty");
    var pill = article.querySelector(".pill");
    if (pill) {
      pill.classList.remove("todo");
      pill.textContent = data.seances.length + " séance" + (data.seances.length > 1 ? "s" : "");
    }
    if (!article.classList.contains("en-edition")) article.querySelector(".capa-body").innerHTML = vueHtml(data);
  }
  // Au chargement : si ce navigateur a une version plus récente que la page publiée, on l'affiche,
  // et on renvoie ce qui n'a pas pu être enregistré.
  function reprendre() {
    Array.prototype.forEach.call(document.querySelectorAll(".capa[data-id]"), function (article) {
      var v = lireTampon(article.dataset.id);
      if (!v) return;
      var publie = CFG.build && v.t / 1000 < CFG.build - 5;
      if (publie && !v.enAttente) { ecrireTampon(article.dataset.id, null); return; }
      appliquer(article, v.data);
      if (v.enAttente) {
        var jeton = lireJeton();
        if (jeton) mettreEnFile(article, v.data, jeton);
        else etat(article, "erreur", "Des modifications n'ont pas encore été envoyées à GitHub.");
      }
    });
  }
  function messageErreur(e) {
    if (e.message === "jeton") return "GitHub refuse le jeton. Vérifiez qu'il donne accès en écriture au dépôt, puis réessayez.";
    if (e.message === "conflit") return "Le fichier a changé entre-temps sur GitHub.";
    if (e instanceof TypeError) return "Impossible de joindre GitHub (connexion ou bloqueur).";
    return "L'enregistrement a échoué (" + e.message + ").";
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
    corps.innerHTML = formHtml(donnees(article), article.dataset.nom);
    try { article.dataset.initial = JSON.stringify(lireForm(corps.querySelector(".ed-form"), donnees(article))); } catch (e) { article.dataset.initial = ""; }
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
    if (b.closest(".board, .corbeille")) { actionAccueil(b); return; }
    var zc = zoneCapa(b);
    if (zc) { actionNouvelleCapa(zc, b); return; }
    if (b.dataset.action === "monter" || b.dataset.action === "descendre") {
      e.preventDefault(); // ne pas ouvrir / fermer la séance
      var item = elementOrdonnable(b);
      if (!item) return;
      var freres = ordonnables(item.parentNode), i = freres.indexOf(item);
      var j = b.dataset.action === "monter" ? i - 1 : i + 1;
      if (j < 0 || j >= freres.length) return;
      if (j < i) item.parentNode.insertBefore(item, freres[j]); else item.parentNode.insertBefore(item, freres[j].nextSibling);
      validerOrdre(item);
      var bt = item.querySelector('.ordre [data-action="' + b.dataset.action + '"]'); if (bt) bt.focus({ preventScroll: true });
      return;
    }
    var bloc = b.closest(".bloc-edit");
    if (bloc) { actionBloc(bloc, b); return; }
    var article = b.closest(".capa");
    if (!article) return;
    var a = b.dataset.action;
    if (a === "plier") { plier(article, !article.classList.contains("repliee")); return; }
    if (a === "edit" || a === "nouvelle-seance") plier(article, false);
    if (a.indexOf("note-") === 0) { actionNote(article, b.closest(".row.notes"), a); return; }
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
    if (a === "reessayer") {
      var v = lireTampon(article.dataset.id), j = lireJeton();
      if (!j) { ouvrir(article); return; }
      if (v) mettreEnFile(article, v.data, j);
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

  // ---- Techniques repliées / dépliées ----
  function plier(article, replier) {
    article.classList.toggle("repliee", replier);
    var b = article.querySelector(".btn-plier"); if (b) b.setAttribute("aria-expanded", replier ? "false" : "true");
  }
  // Un clic sur le nom de la technique la déplie ou la replie aussi.
  document.addEventListener("click", function (e) {
    var h = e.target.closest(".capa-titre h3, .capa-titre .eyebrow");
    if (!h) return;
    var article = h.closest(".capa");
    if (article && !article.classList.contains("en-edition")) plier(article, !article.classList.contains("repliee"));
  });

  // ---- Édition des seules notes d'une séance ----
  function boutonsNote(row, edition) {
    row.querySelector('[data-action="note-edit"]').hidden = edition;
    row.querySelector('[data-action="note-valider"]').hidden = !edition;
    row.querySelector('[data-action="note-annuler"]').hidden = !edition;
  }
  function actionNote(article, row, a) {
    var v = row.querySelector(".v");
    var idx = +row.closest(".seance").dataset.seance;
    if (a === "note-edit") {
      if (row.classList.contains("en-edition")) return;
      var s = (donnees(article).seances || [])[idx] || {};
      row.dataset.vue = v.innerHTML;
      row.classList.add("en-edition");
      compteur++;
      v.innerHTML = '<div class="ed-note">' + '<p class="ed-statut" role="status" hidden></p>' + JETON() + barreOutils() +
        '<div class="ed-rte" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Notes de la séance">' + champVersEditeur(trouver(s.champs, "Notes")) + "</div></div>";
      boutonsNote(row, true);
      var ed = v.querySelector(".ed-rte"); ed.focus();
      return;
    }
    if (a === "note-annuler") {
      v.innerHTML = row.dataset.vue || "";
      row.classList.remove("en-edition");
      boutonsNote(row, false);
      return;
    }
    // note-valider
    var champJeton = v.querySelector(".ed-jeton-val");
    var jeton = (champJeton && champJeton.value.trim()) || lireJeton();
    if (!jeton) {
      v.querySelector(".ed-jeton").hidden = false;
      afficher(v.querySelector(".ed-statut"), "Collez d'abord votre jeton GitHub dans le champ ci-dessous, puis cliquez à nouveau sur ✓.", true);
      return;
    }
    ecrireJeton(jeton);
    var data = donnees(article), sc = data.seances && data.seances[idx];
    if (!sc) return;
    var note = editeurVersChamp("Notes", v.querySelector(".ed-rte"));
    sc.champs = sc.champs || [];
    var pos = -1;
    sc.champs.forEach(function (f, k) { if (f.champ === "Notes") pos = k; });
    if (pos >= 0) sc.champs[pos] = note; else sc.champs.push(note);
    var ouvertes = Array.prototype.map.call(article.querySelectorAll("details.seance"), function (d) { return d.open; });
    appliquer(article, data);
    Array.prototype.forEach.call(article.querySelectorAll("details.seance"), function (d, k) { d.open = !!ouvertes[k]; });
    mettreEnFile(article, data, jeton);
  }

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
    } catch (err) {
      afficher(statut, "Erreur dans la page : " + err.message, true);
      return;
    }
    var champNom = form.querySelector(".ed-nom-capa");
    var nouveauNom = champNom ? champNom.value.trim() : "";
    ecrireJeton(jeton);
    if (article.dataset.initial && JSON.stringify(data) === article.dataset.initial) {
      // Contenu inchangé (par ex. seul le nom a changé) : on n'écrit pas le fichier de la capacité.
      fermer(article, article.dataset.vue);
    } else {
      fermer(article, vueHtml(data));
      appliquer(article, data);
      mettreEnFile(article, data, jeton);
    }
    if (nouveauNom && nouveauNom !== article.dataset.nom) renommerCapacite(article, nouveauNom, jeton);
  }
  document.addEventListener("submit", function (e) {
    var form = e.target.closest(".ed-form");
    if (!form) return;
    e.preventDefault();
    var bloc = form.closest(".bloc-edit");
    if (bloc) sauverBloc(bloc); else sauver(form.closest(".capa"));
  });
  // ---- Blocs de texte : en-tête de compétence, accueil ----
  // Un bloc .bloc-edit porte data-chemin (fichier), data-type et ses données JSON (.bloc-data).
  var SCHEMAS = {
    competence: [
      { cle: "nom", label: "Nom de la compétence", type: "ligne" },
      { cle: "attendu", label: "Compétence attendue (objectif final)", type: "riche" },
      { cle: "savoir_faire", label: "Savoir-faire · technique", type: "riche" },
      { cle: "savoir_etre", label: "Savoir-être · comportement", type: "riche" },
      { cle: "savoir", label: "Savoir · théorie", type: "riche" },
      { cle: "capacites", label: "Capacités", type: "capacites" }
    ],
    accueil: [
      { cle: "surtitre", label: "Surtitre", type: "ligne" },
      { cle: "titre", label: "Titre", type: "ligne" },
      { cle: "intro", label: "Introduction", type: "riche" },
      { cle: "section_surtitre", label: "Surtitre de la liste des compétences", type: "ligne" },
      { cle: "section_titre", label: "Titre de la liste des compétences", type: "ligne" },
      { cle: "section_intro", label: "Texte de la liste des compétences", type: "riche" }
    ]
  };
  function blocDonnees(bloc) { try { return JSON.parse(bloc.querySelector(".bloc-data").textContent); } catch (e) { return {}; } }
  function richeVersEditeur(html) {
    var lignes = String(html || "").split(/<br\s*\/?>/i);
    return lignes.map(function (l) { return "<div>" + (nettoyer(l) || "<br>") + "</div>"; }).join("");
  }
  function editeurVersRiche(ed) { return lignesEditeur(ed).map(function (l) { return l.html; }).join("<br>"); }
  function slug(t) {
    return String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "capacite";
  }
  function ligneCapa(c) {
    var id = "ed-" + (++compteur);
    return '<div class="ed-capa" data-id="' + esc(c.id || "") + '"><label class="sr-only" for="' + id + '">Nom de la capacité</label>' +
      '<input id="' + id + '" value="' + esc(c.nom || "") + '" placeholder="Nom de la capacité">' +
      '<button type="button" class="btn-lien" data-action="suppr-capa">Retirer</button></div>';
  }
  function formBloc(bloc) {
    var d = blocDonnees(bloc), schema = SCHEMAS[bloc.dataset.type];
    var h = '<form class="ed-form" novalidate><p class="ed-statut" role="status" hidden></p>' + JETON() +
      '<p class="ed-aide">Validez avec ✓ ou annulez avec ✗.</p>' + barreOutils();
    schema.forEach(function (c) {
      var id = "ed-" + (++compteur);
      if (c.type === "ligne") h += '<div class="ed-champ"><label for="' + id + '">' + esc(c.label) + '</label><input id="' + id + '" data-cle="' + c.cle + '" value="' + esc(d[c.cle] || "") + '"></div>';
      else if (c.type === "riche") h += '<div class="ed-champ"><span class="ed-label" id="' + id + '-l">' + esc(c.label) + '</span><div class="ed-rte ed-riche" contenteditable="true" role="textbox" aria-multiline="true" aria-labelledby="' + id + '-l" data-cle="' + c.cle + '">' + richeVersEditeur(d[c.cle]) + "</div></div>";
      else if (c.type === "capacites") h += '<fieldset class="ed-capas"><legend>' + esc(c.label) + '</legend><p class="ed-aide">Retirer une capacité la retire de cette page ; ses séances restent dans le dépôt.</p><div class="ed-capas-liste">' +
        (d.capacites || []).map(ligneCapa).join("") + '</div><button type="button" class="btn-lien" data-action="ajout-capa">+ Ajouter une capacité</button></fieldset>';
    });
    return h + '<div class="ed-actions"><button type="button" class="btn-lien" data-action="oublier"' + (lireJeton() ? "" : " hidden") + ">Oublier le jeton</button></div></form>";
  }
  function lireBloc(bloc, form) {
    var d = blocDonnees(bloc);
    SCHEMAS[bloc.dataset.type].forEach(function (c) {
      if (c.type === "ligne") d[c.cle] = form.querySelector('[data-cle="' + c.cle + '"]').value.trim();
      else if (c.type === "riche") d[c.cle] = editeurVersRiche(form.querySelector('[data-cle="' + c.cle + '"]'));
      else if (c.type === "capacites") {
        var pris = {};
        d.capacites = Array.prototype.map.call(form.querySelectorAll(".ed-capa"), function (l) {
          var nom = l.querySelector("input").value.trim(), id = l.dataset.id;
          if (!nom) return null;
          if (!id) { id = slug(nom); var base = id, n = 2; while (pris[id] || document.getElementById(id) && !l.dataset.id) id = base + "-" + (n++); }
          pris[id] = true;
          return { nom: nom, id: id };
        }).filter(Boolean);
      }
    });
    if (bloc.dataset.type === "competence") d.title = d.nom;
    return d;
  }
  function texteBloc(bloc, d) {
    if (bloc.dataset.type === "competence") return "---\n" + versYaml(d) + "---\n";
    return versYaml(d);
  }
  function messageBloc(bloc, d) {
    return bloc.dataset.type === "competence" ? "Modifier la compétence « " + d.nom + " » depuis le site" : "Modifier la page d'accueil depuis le site";
  }
  function afficherBloc(bloc, d) {
    bloc.querySelector(".bloc-data").textContent = JSON.stringify(d);
    Array.prototype.forEach.call(document.querySelectorAll("[data-bloc-champ]"), function (el) {
      if (el.closest(".bloc-edit") !== bloc && !el.hasAttribute("data-bloc-global")) return;
      var cle = el.dataset.blocChamp, c = SCHEMAS[bloc.dataset.type].filter(function (x) { return x.cle === cle; })[0];
      if (!c || d[cle] === undefined) return;
      if (c.type === "riche") el.innerHTML = String(d[cle]).split(/<br\s*\/?>/i).map(nettoyer).join("<br>");
      else el.textContent = d[cle];
    });
    if (bloc.dataset.type === "competence") {
      document.title = d.nom + " · " + document.title.split(" · ").slice(-1)[0];
      syncCapacites(d.capacites || []);
    }
  }
  // Met la liste des capacités de la page en accord avec la compétence.
  function syncCapacites(liste) {
    var conteneur = document.querySelector(".capas"), modele = document.getElementById("modele-capa");
    if (!conteneur || !modele) return;
    var existants = {};
    Array.prototype.forEach.call(conteneur.querySelectorAll(".capa[data-id]"), function (a) { existants[a.dataset.id] = a; });
    liste.forEach(function (c) {
      var a = existants[c.id];
      if (!a) {
        var tmp = document.createElement("div");
        tmp.innerHTML = modele.innerHTML.replace(/__ID__/g, esc(c.id)).replace(/__NOM__/g, esc(c.nom));
        a = tmp.firstElementChild;
        var v = lireTampon(c.id); if (v) appliquer(a, v.data);
      }
      a.dataset.nom = c.nom;
      var h3 = a.querySelector("h3"); if (h3) h3.textContent = c.nom;
      conteneur.appendChild(a);
      delete existants[c.id];
    });
    Object.keys(existants).forEach(function (k) { existants[k].remove(); });
  }
  function competenceBloc() { return document.querySelector('.bloc-edit[data-type="competence"]'); }
  function renommerCapacite(article, nom, jeton) {
    var bloc = competenceBloc();
    article.dataset.nom = nom;
    var h3 = article.querySelector("h3"); if (h3) h3.textContent = nom;
    if (!bloc) return;
    var d = blocDonnees(bloc);
    (d.capacites || []).forEach(function (c) { if (c.id === article.dataset.id) c.nom = nom; });
    afficherBloc(bloc, d);
    envoyerBloc(bloc, d, jeton);
  }
  function envoyerBloc(bloc, d, jeton) {
    envoyer(bloc.dataset.chemin, { chemin: bloc.dataset.chemin, message: messageBloc(bloc, d), texte: texteBloc(bloc, d), data: d },
      jeton, function (quoi, m) { etat(bloc, quoi, m); });
  }
  function ouvrirBloc(bloc) {
    boutons(bloc, true);
    var corps = bloc.querySelector(".bloc-corps");
    bloc.dataset.vue = corps.innerHTML;
    bloc.classList.add("en-edition");
    corps.innerHTML = formBloc(bloc);
    var t = corps.querySelector("input, .ed-rte"); if (t) t.focus();
  }
  function fermerBloc(bloc, html) {
    if (html !== undefined) bloc.querySelector(".bloc-corps").innerHTML = html;
    bloc.classList.remove("en-edition");
    boutons(bloc, false);
  }
  function sauverBloc(bloc) {
    var form = bloc.querySelector(".ed-form");
    if (!form) return;
    var statut = form.querySelector(".ed-statut");
    var champJeton = form.querySelector(".ed-jeton-val");
    var jeton = (champJeton && champJeton.value.trim()) || lireJeton();
    if (!jeton) {
      form.querySelector(".ed-jeton").hidden = false;
      afficher(statut, "Collez d'abord votre jeton GitHub dans le champ ci-dessous, puis cliquez à nouveau sur ✓.", true);
      return;
    }
    var d;
    try { d = lireBloc(bloc, form); } catch (err) { afficher(statut, "Erreur dans la page : " + err.message, true); return; }
    if (bloc.dataset.type === "competence" && !d.nom) { afficher(statut, "Le nom de la compétence ne peut pas être vide.", true); return; }
    ecrireJeton(jeton);
    fermerBloc(bloc, bloc.dataset.vue);
    afficherBloc(bloc, d);
    envoyerBloc(bloc, d, jeton);
  }
  function actionBloc(bloc, b) {
    var a = b.dataset.action;
    if (a === "edit") { if (!bloc.classList.contains("en-edition")) ouvrirBloc(bloc); }
    else if (a === "annuler") fermerBloc(bloc, bloc.dataset.vue);
    else if (a === "valider") sauverBloc(bloc);
    else if (a === "ajout-capa") {
      var l = bloc.querySelector(".ed-capas-liste");
      l.insertAdjacentHTML("beforeend", ligneCapa({}));
      l.lastElementChild.querySelector("input").focus();
    } else if (a === "suppr-capa") b.closest(".ed-capa").remove();
    else if (a === "oublier") { ecrireJeton(""); b.hidden = true; bloc.querySelector(".ed-jeton").hidden = false; }
    else if (a === "reessayer") {
      var v = lireTampon(bloc.dataset.chemin), j = lireJeton();
      if (!j) { ouvrirBloc(bloc); return; }
      if (v) envoyerBloc(bloc, v.data, j);
    }
  }
  // ---- Page compétence : ajouter une technique (capacité) ----
  function zoneCapa(b) { return b.closest(".nouvelle-capa-zone"); }
  function ouvrirNouvelleCapa(zone) {
    zone.querySelector(".nouvelle-capa").hidden = true;
    zone.querySelector(".nouvelle-capa-form").hidden = false;
    zone.querySelector("#ncapa-nom").focus();
  }
  function actionNouvelleCapa(zone, b) {
    if (b.dataset.action === "nouvelle-capa") ouvrirNouvelleCapa(zone);
    else if (b.dataset.action === "annuler-capa") {
      zone.querySelector(".nouvelle-capa-form").hidden = true;
      zone.querySelector(".nouvelle-capa").hidden = false;
    }
  }
  document.addEventListener("submit", function (e) {
    var form = e.target.closest(".nouvelle-capa-form");
    if (!form) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    var nom = form.querySelector("#ncapa-nom").value.trim();
    var bloc = competenceBloc();
    if (!nom || !bloc) return;
    var j = jetonCarte(form);
    if (!j) return;
    var d = blocDonnees(bloc);
    d.capacites = d.capacites || [];
    var base = slug(nom) || "technique", id = base, n = 2;
    var pris = function (x) { return document.getElementById(x) || d.capacites.some(function (c) { return c.id === x; }); };
    while (pris(id)) id = base + "-" + (n++);
    d.capacites.push({ nom: nom, id: id });
    afficherBloc(bloc, d);
    envoyerBloc(bloc, d, j);
    form.reset(); form.hidden = true;
    var champ = form.querySelector(".ed-jeton"); if (champ) champ.remove();
    form.parentNode.querySelector(".nouvelle-capa").hidden = false;
    var a = document.getElementById(id);
    if (a) { a.scrollIntoView({ block: "center", behavior: "smooth" }); a.classList.add("ajoutee"); }
  }, true);
  if (location.hash === "#nouvelle-technique") {
    var zn = document.querySelector(".nouvelle-capa-zone");
    if (zn) ouvrirNouvelleCapa(zn);
  }

  // ---- Ordre des techniques et des séances (flèches et glisser-déposer) ----
  function elementOrdonnable(el) {
    var s = el.closest(".seance, .stile.todo");
    if (s && s.closest(".seances")) return s;
    var c = el.closest(".capa");
    return c && c.parentNode && c.parentNode.classList.contains("capas") ? c : null;
  }
  function ordonnables(parent) {
    return Array.prototype.filter.call(parent.children, function (x) { return x.matches(".capa, .seance, .stile.todo"); });
  }
  function validerOrdre(item) {
    if (item.classList.contains("capa")) {
      var bloc = competenceBloc();
      if (!bloc) return;
      var jeton = lireJeton();
      var d = blocDonnees(bloc), parId = {};
      (d.capacites || []).forEach(function (c) { parId[c.id] = c; });
      d.capacites = ordonnables(item.parentNode).map(function (a) { return parId[a.dataset.id] || { nom: a.dataset.nom, id: a.dataset.id }; });
      bloc.querySelector(".bloc-data").textContent = JSON.stringify(d);
      if (jeton) envoyerBloc(bloc, d, jeton);
      else { ecrireTampon(bloc.dataset.chemin, { t: Date.now(), data: d, enAttente: true }); etat(bloc, "erreur", "Ordre gardé dans ce navigateur : ouvrez le crayon pour saisir votre jeton GitHub, puis validez."); }
      return;
    }
    var article = item.closest(".capa"), data = donnees(article);
    var ouvertes = {};
    var ordre = ordonnables(item.parentNode).map(function (x) { var k = +x.dataset.seance; ouvertes[k] = x.open; return k; });
    data.seances = ordre.map(function (k) { return data.seances[k]; });
    appliquer(article, data);
    var tuiles = ordonnables(article.querySelector(".seances"));
    ordre.forEach(function (k, n) { if (tuiles[n] && tuiles[n].tagName === "DETAILS") tuiles[n].open = !!ouvertes[k]; });
    var j = lireJeton();
    if (j) mettreEnFile(article, data, j);
    else { ecrireTampon(article.dataset.id, { t: Date.now(), data: data, enAttente: true }); etat(article, "erreur", "Ordre gardé dans ce navigateur : ouvrez le crayon pour saisir votre jeton GitHub, puis validez."); }
  }
  // Glisser-déposer à la souris ou au doigt, par la poignée.
  var glisse = null;
  document.addEventListener("pointerdown", function (e) {
    var p = e.target.closest(".poignee");
    if (!p || e.button > 0) return;
    var item = elementOrdonnable(p);
    if (!item) return;
    e.preventDefault();
    glisse = { item: item, parent: item.parentNode, avant: ordonnables(item.parentNode).indexOf(item) };
    item.classList.add("en-glisse");
    document.body.classList.add("glisse-actif");
  });
  document.addEventListener("pointermove", function (e) {
    if (!glisse) return;
    e.preventDefault();
    var freres = ordonnables(glisse.parent).filter(function (x) { return x !== glisse.item; });
    var cible = null;
    for (var i = 0; i < freres.length; i++) {
      var r = freres[i].getBoundingClientRect();
      if (e.clientY < r.top + r.height / 2) { cible = freres[i]; break; }
    }
    if (cible) { if (glisse.item.nextSibling !== cible) glisse.parent.insertBefore(glisse.item, cible); }
    else {
      var dernier = freres[freres.length - 1];
      if (dernier && dernier.nextSibling !== glisse.item) glisse.parent.insertBefore(glisse.item, dernier.nextSibling);
    }
    // défilement automatique près des bords
    if (e.clientY < 60) window.scrollBy(0, -12); else if (e.clientY > window.innerHeight - 60) window.scrollBy(0, 12);
  }, { passive: false });
  function finGlisse() {
    if (!glisse) return;
    var g = glisse; glisse = null;
    g.item.classList.remove("en-glisse");
    document.body.classList.remove("glisse-actif");
    if (ordonnables(g.parent).indexOf(g.item) !== g.avant) validerOrdre(g.item);
  }
  document.addEventListener("pointerup", finGlisse);
  document.addEventListener("pointercancel", finGlisse);
  // Un clic sur la poignée ne doit pas ouvrir / fermer la séance.
  document.addEventListener("click", function (e) { if (e.target.closest(".poignee")) e.preventDefault(); }, true);

  function reprendreBlocs() {
    Array.prototype.forEach.call(document.querySelectorAll(".bloc-edit[data-chemin]"), function (bloc) {
      var v = lireTampon(bloc.dataset.chemin);
      if (!v) return;
      var publie = CFG.build && v.t / 1000 < CFG.build - 5;
      if (publie && !v.enAttente) { ecrireTampon(bloc.dataset.chemin, null); return; }
      afficherBloc(bloc, v.data);
      if (v.enAttente) {
        var jeton = lireJeton();
        if (jeton) envoyerBloc(bloc, v.data, jeton);
        else etat(bloc, "erreur", "Des modifications n'ont pas encore été envoyées à GitHub.");
      }
    });
  }

  // ---- Accueil : ajouter et supprimer des compétences ----
  var CLE_OPS = "competences";
  function lireOps() { var v = lireTampon(CLE_OPS); return v && v.ops ? v.ops : []; }
  function ajouterOp(op) { var ops = lireOps(); ops.push(op); ecrireTampon(CLE_OPS, { t: Date.now(), ops: ops }); }
  function retirerOp(t) { var ops = lireOps().filter(function (o) { return o.t !== t; }); ecrireTampon(CLE_OPS, ops.length ? { t: Date.now(), ops: ops } : null); }
  function etatCarte(carte, quoi, message) {
    var e = carte.querySelector(".ed-etat");
    if (!e) { e = document.createElement("p"); carte.appendChild(e); }
    e.className = "ed-etat " + quoi;
    if (quoi === "attente") e.textContent = "En attente d'enregistrement…";
    else if (quoi === "envoi") e.textContent = "Enregistrement sur GitHub…";
    else if (quoi === "ok") e.textContent = { corbeille: "Mise à la corbeille. Le site se met à jour dans une à deux minutes.", restaurer: "Restaurée. Le site se met à jour dans une à deux minutes.", creer: "Créée. Sa page sera en ligne dans une à deux minutes." }[carte.dataset.opType] || "Enregistré.";
    else e.innerHTML = esc(message) + ' <button type="button" class="btn-lien" data-action="reessayer-comp">Réessayer</button>';
  }
  function jetonCarte(carte) {
    var champ = carte.querySelector(".ed-jeton-val");
    var j = (champ && champ.value.trim()) || lireJeton();
    if (!j && !champ) carte.insertAdjacentHTML("beforeend", JETON().replace(" hidden", ""));
    return j;
  }
  function marquerCorbeille(oui) {
    return function (texte) {
      texte = texte.replace(/\r\n/g, "\n").replace(/^corbeille:.*\n/m, "");
      return oui ? texte.replace(/^---\n/, "---\ncorbeille: true\n") : texte;
    };
  }
  function lancerOp(carte, op, jeton) {
    carte.dataset.opType = op.type;
    var texte = op.type === "creer" ? "---\n" + versYaml(op.data) + "---\n" : marquerCorbeille(op.type === "corbeille");
    var message = { creer: "Créer", corbeille: "Mettre à la corbeille", restaurer: "Restaurer" }[op.type] + " la compétence « " + op.nom + " » depuis le site";
    envoyer("op-" + op.t, { chemin: op.chemin, message: message, texte: texte, data: op }, jeton, function (quoi, m) {
      etatCarte(carte, quoi, m);
      if (quoi === "ok") { ecrireTampon("op-" + op.t, null); op.envoye = true; majOp(op); }
    });
  }
  function majOp(op) { var ops = lireOps().map(function (o) { return o.t === op.t ? op : o; }); ecrireTampon(CLE_OPS, { t: Date.now(), ops: ops }); }
  function carteNouvelle(op) {
    var div = document.createElement("section");
    div.className = "lane dim creee";
    div.dataset.chemin = op.chemin; div.dataset.op = op.t;
    div.innerHTML = '<div class="lane-top"><a class="lane-head" href="' + esc(CFG.base + "competences/" + op.slug + "/") + '"><span class="eyebrow">Compétence</span><h2>' + esc(op.nom) + "</h2></a></div>" +
      '<p class="next">Aucune capacité pour l\'instant.</p>';
    var board = document.querySelector(".board");
    if (board) board.appendChild(div);
    return div;
  }
  function majCorbeille() {
    var n = document.querySelectorAll(".corbeille-liste .jetee").length, nb = document.querySelector(".corbeille-nb");
    if (nb) { nb.textContent = n; nb.nextSibling.textContent = " compétence" + (n > 1 ? "s" : ""); }
  }
  function versCorbeille(carte) {
    var li = document.createElement("li");
    li.className = "jetee";
    li.dataset.chemin = carte.dataset.chemin; li.dataset.nom = carte.dataset.nom; li.dataset.ordre = carte.dataset.ordre || "";
    var lien = carte.querySelector(".lane-head");
    li.innerHTML = '<a href="' + esc(lien ? lien.getAttribute("href") : "#") + '">' + esc(carte.dataset.nom) + '</a> <button type="button" class="btn-lien" data-action="restaurer-comp">Restaurer</button>';
    document.querySelector(".corbeille-liste").appendChild(li);
    carte.remove();
    majCorbeille();
    return li;
  }
  function horsCorbeille(li) {
    var div = document.createElement("section");
    div.className = "lane dim restauree";
    div.dataset.chemin = li.dataset.chemin; div.dataset.nom = li.dataset.nom; div.dataset.ordre = li.dataset.ordre;
    div.innerHTML = '<div class="lane-top"><a class="lane-head" href="' + esc(li.querySelector("a").getAttribute("href")) + '"><span class="eyebrow">Compétence</span><h2>' + esc(li.dataset.nom) + "</h2></a></div>";
    var board = document.querySelector(".board");
    if (board) board.appendChild(div);
    li.remove();
    majCorbeille();
    return div;
  }
  function actionAccueil(b) {
    var a = b.dataset.action, carte = b.closest(".lane, .jetee");
    if (a === "restaurer-comp") {
      var jr = lireJeton();
      if (!jr) { jr = jetonCarte(carte); if (!jr) return; }
      var opr = { t: Date.now(), type: "restaurer", chemin: carte.dataset.chemin, nom: carte.dataset.nom };
      ajouterOp(opr);
      var neuve = horsCorbeille(carte);
      neuve.dataset.op = opr.t;
      lancerOp(neuve, opr, jr);
      return;
    }
    if (a === "suppr-comp") { carte.querySelector(".lane-confirm").hidden = false; return; }
    if (a === "annuler-suppr") { carte.querySelector(".lane-confirm").hidden = true; return; }
    if (a === "confirmer-suppr") {
      var j = jetonCarte(carte.querySelector(".lane-confirm"));
      if (!j) return;
      var op = { t: Date.now(), type: "corbeille", chemin: carte.dataset.chemin, nom: carte.dataset.nom };
      ajouterOp(op);
      var li = versCorbeille(carte);
      li.dataset.op = op.t;
      lancerOp(li, op, j);
      return;
    }
    if (a === "nouvelle-comp") { carte.querySelector(".nouvelle-comp-form").hidden = false; b.hidden = true; carte.querySelector("#nc-nom").focus(); return; }
    if (a === "annuler-comp") { carte.querySelector(".nouvelle-comp-form").hidden = true; carte.querySelector(".nouvelle-comp").hidden = false; return; }
    if (a === "reessayer-comp") {
      var t = +carte.dataset.op, o = lireOps().filter(function (x) { return x.t === t; })[0];
      var jj = jetonCarte(carte);
      if (o && jj) lancerOp(carte, o, jj);
    }
  }
  document.addEventListener("submit", function (e) {
    var form = e.target.closest(".nouvelle-comp-form");
    if (!form) return;
    e.preventDefault();
    var nom = form.querySelector("#nc-nom").value.trim();
    if (!nom) return;
    var j = jetonCarte(form);
    if (!j) return;
    var pris = {};
    Array.prototype.forEach.call(document.querySelectorAll(".lane[data-chemin], .jetee[data-chemin]"), function (l) { pris[l.dataset.chemin] = true; });
    var base = slug(nom), id = base, n = 2;
    while (pris["_competences/" + id + ".md"]) id = base + "-" + (n++);
    var ordre = Math.max.apply(null, [0].concat(Array.prototype.map.call(document.querySelectorAll(".lane[data-ordre], .jetee[data-ordre]"), function (l) { return +l.dataset.ordre || 0; }))) + 1;
    var op = { t: Date.now(), type: "creer", chemin: "_competences/" + id + ".md", slug: id, nom: nom,
      data: { ordre: ordre, nom: nom, attendu: "", savoir_faire: "", savoir_etre: "", savoir: "", capacites: [], layout: "competence", title: nom } };
    ajouterOp(op);
    var carte = carteNouvelle(op);
    carte.dataset.ordre = ordre;
    form.reset(); form.hidden = true; form.parentNode.querySelector(".nouvelle-comp").hidden = false;
    var champ = form.querySelector(".ed-jeton"); if (champ) champ.remove();
    lancerOp(carte, op, j);
  });
  function reprendreAccueil() {
    if (!document.querySelector(".board")) return;
    lireOps().forEach(function (op) {
      var publie = CFG.build && op.t / 1000 < CFG.build - 5;
      if (publie && op.envoye) { retirerOp(op.t); return; }
      var carte;
      if (op.type === "creer") carte = carteNouvelle(op);
      else if (op.type === "corbeille" || op.type === "restaurer") {
        var dejaFait = op.type === "corbeille" ? '.jetee[data-chemin="' + op.chemin + '"]' : '.lane[data-chemin="' + op.chemin + '"]';
        var aDeplacer = op.type === "corbeille" ? '.lane[data-chemin="' + op.chemin + '"]' : '.jetee[data-chemin="' + op.chemin + '"]';
        carte = document.querySelector(aDeplacer);
        if (carte) carte = op.type === "corbeille" ? versCorbeille(carte) : horsCorbeille(carte);
        else carte = document.querySelector(dejaFait);
        if (!carte) { retirerOp(op.t); return; }
      } else { retirerOp(op.t); return; }
      carte.dataset.op = op.t;
      if (!op.envoye) { var j = lireJeton(); if (j) lancerOp(carte, op, j); else etatCarte(carte, "erreur", "Pas encore envoyée à GitHub."); }
    });
  }

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
  // ---- Ancres : chaque section a une adresse, et un bouton pour copier son lien ----
  var SVG_LIEN = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>';
  function boutonLien(id, quoi) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "lien-ancre"; b.dataset.ancre = id;
    b.title = "Copier le lien vers " + quoi; b.setAttribute("aria-label", "Copier le lien vers " + quoi);
    b.innerHTML = SVG_LIEN;
    return b;
  }
  function poser(el, id, ou, quoi, position) {
    if (!el || !ou) return;
    el.id = id;
    var b = ou.querySelector(":scope > .lien-ancre");
    if (b) { b.dataset.ancre = id; return; }
    b = boutonLien(id, quoi);
    if (position === "debut") ou.insertBefore(b, ou.firstChild); else ou.appendChild(b);
  }
  function poserAncres() {
    var comp = document.querySelector(".bloc-competence");
    if (comp) poser(comp.querySelector(".comp-head"), "objectif", comp.querySelector(".bloc-top"), "la compétence", "debut");
    var noms = ["savoir-faire", "savoir-etre", "savoir"];
    Array.prototype.forEach.call(document.querySelectorAll(".savoirs-acc > details"), function (d, i) {
      poser(d, noms[i] || "savoir-" + i, d.querySelector("summary"), "ce savoir");
    });
    Array.prototype.forEach.call(document.querySelectorAll(".capas > .capa[data-id]"), function (a) {
      var act = a.querySelector(".capa-actions");
      if (act && !act.querySelector(":scope > .lien-ancre")) act.insertBefore(boutonLien(a.id, "la technique"), act.firstChild);
      var pris = {};
      Array.prototype.forEach.call(a.querySelectorAll(".seances > .seance, .seances > .stile.todo"), function (t, i) {
        var titre = t.matches("details") ? t.querySelector("summary").childNodes[1] : t.childNodes[1];
        var base = a.dataset.id + "--" + (slug(titre && titre.textContent ? titre.textContent : "seance-" + (i + 1)) || "seance-" + (i + 1)), id = base, n = 2;
        while (pris[id]) id = base + "-" + (n++);
        pris[id] = true;
        poser(t, id, t.querySelector(".ordre"), "la séance", "debut");
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll(".board > .lane[data-chemin]"), function (l) {
      var id = "competence-" + l.dataset.chemin.replace(/^.*\//, "").replace(/\.md$/, "");
      poser(l, id, l.querySelector(".lane-top"), "la carte de cette compétence");
    });
  }
  function allerAncre() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var el = document.getElementById(id);
    if (!el) return;
    for (var p = el; p; p = p.parentElement) {
      if (p.tagName === "DETAILS") p.open = true;
      if (p.classList && p.classList.contains("repliee")) plier(p, false);
    }
    el.scrollIntoView({ block: "start" });
    el.classList.add("ancre-visee");
    setTimeout(function () { el.classList.remove("ancre-visee"); }, 2500);
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".lien-ancre");
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    var url = location.origin + location.pathname + "#" + b.dataset.ancre;
    try { history.replaceState(null, "", "#" + b.dataset.ancre); } catch (x) {}
    var fini = function (ok) {
      b.classList.add("copie");
      b.setAttribute("data-msg", ok ? "Lien copié" : "Lien dans la barre d'adresse");
      setTimeout(function () { b.classList.remove("copie"); }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { fini(true); }, function () { fini(false); });
    else fini(false);
  }, true);
  var attente = false;
  new MutationObserver(function () {
    if (attente) return;
    attente = true;
    requestAnimationFrame(function () { attente = false; poserAncres(); });
  }).observe(document.querySelector("main") || document.body, { childList: true, subtree: true });
  window.addEventListener("hashchange", allerAncre);

  reprendreBlocs();
  reprendre();
  reprendreAccueil();
  poserAncres();
  if (location.hash !== "#nouvelle-technique") allerAncre();
})();
