# 🫁 Physiologie & Risques — N2 FFESSM

---

## 🦻 Barotraumatismes

```mermaid
flowchart TD
    ROOT["🦻 Barotraumatismes"]

    ROOT --> PREV["✅ Prévention<br>Descendre lentement<br>Équilibrer tôt, avant d'avoir mal<br>Ne jamais forcer ni bloquer sa respiration<br>Ne pas plonger enrhumé<br>Signaler tout problème au binôme"]

    ROOT --> BARO_OR["Oreilles ⬇️<br>Douleur, vertiges, nausées, vomissements"]
    BARO_OR --> BARO_OR1{Manœuvre<br>d'équilibrage ?}
    BARO_OR1 -->|Valsalva / Frenzel réussi| BARO_OR2["✅ Continuer"]
    BARO_OR1 -->|Échec| BARO_OR3["Remonter 1-2m<br>Réessayer lentement"]
    BARO_OR3 -->|Toujours échec| BARO_OR4["🛑 Arrêter la plongée<br>Consultation médicale"]

    ROOT --> BARO_DT["Dents ⬇️⬆️<br>Douleurs vives à la mâchoire"]
    BARO_DT --> BARO_DT1["🛑 Arrêter montée/descente<br>Remonter progressivement<br>Ne pas forcer"]

    ROOT --> BARO_MK["Masque ⬇️<br>Yeux rouges et hématomes autour des yeux"]

    ROOT --> BARO_SI["Sinus ⬇️⬆️<br>Douleurs vives front / pommettes"]
    BARO_SI --> BARO_SI1["🛑 Arrêter montée/descente<br>Remonter progressivement<br>Ne pas forcer<br>Consultation ORL si persistant"]

    ROOT --> BARO_PO["Poumons ⬆️<br>Toux et crachats sanglants<br>Douleurs thoraciques intenses<br>Troubles respiratoires<br>Perte de conscience"]
    BARO_PO --> BARO_PO0["Remontée trop rapide<br>Blocage respiration"]
    BARO_PO0 --> BARO_PO1["🚨 GRAVISSIME<br>Surpression pulmonaire<br>Embolie gazeuse possible"]
    BARO_PO1 --> BARO_PO2["🚨 O₂ 100%<br>Position demi-assise<br>SAMU 15 — Caisson hyperbare"]

    style ROOT fill:#0055aa,color:#fff
    style PREV fill:#44bb44,color:#fff
    style BARO_OR2 fill:#44bb44,color:#fff
    style BARO_PO1 fill:#ff4444,color:#fff
    style BARO_PO2 fill:#ff4444,color:#fff
```

---

## 🫀 ADD — Accident de Désaturation

```mermaid
flowchart TD
    ROOT["🫀 ADD — Accident de Désaturation"]

    ROOT --> PREV["✅ Prévention<br>Remonter ≤ 10 m/min<br>Respecter la courbe de sécurité<br>Palier de sécurité 3 min à 3m<br>Éviter l'effort après la plongée<br>S'hydrater — Éviter l'alcool la veille<br>Ne pas prendre l'avion dans les 24h"]

    ROOT --> MECA["O₂ consommé — CO₂ produit<br>N₂ non utilisé → stocké par le corps"]
    MECA --> CHARGE["Charge en N₂<br>Dépend de la profondeur<br>et du temps au fond"]
    CHARGE --> DESC["⬇️ Descente<br>Pression ambiante ↑<br>Corps en sous-saturation<br>Se charge en N₂"]
    DESC --> FOND["↔️ Fond<br>Charge continue jusqu'à saturation<br>Plus on est profond<br>plus la charge est rapide"]
    FOND --> REM["⬆️ Remontée<br>Pression ambiante ↓<br>Corps en sursaturation<br>Se décharge en N₂"]
    REM --> VITESSE{Vitesse de<br>remontée ?}
    VITESSE -->|Contrôlée ≤ 10 m/min| OK["✅ Décharge progressive<br>N₂ éliminé sans formation de bulles"]
    VITESSE -->|Trop rapide| BULLES["🔴 Chute de pression trop rapide<br>Formation de bulles de N₂<br>Bulles coincées dans articulations<br>ou tissus → grossissent<br>C'est l'accident de désaturation"]
    BULLES --> PAL["Prévention : le palier<br>Arrêter la remontée<br>Laisser le temps au N₂ de sortir<br>Temps calculé par tables ou ordinateur"]
    BULLES --> ADD_S{Type de signes}
    ADD_S --> ADD_C["🟡 Cutanés<br>Boursouflures sur la peau<br>Plaques rouges — Démangeaisons"]
    ADD_S --> ADD_B["🟠 Articulaires<br>Douleurs coudes<br>épaules, genoux"]
    ADD_S --> ADD_A["🔴 Dorsale<br>Douleurs"]
    ADD_S --> ADD_N["🔴 Cérébrale<br>Perte de connaissance<br>Fatigue — Vertiges<br>Nausées — Maux de tête<br>Problèmes d'audition"]
    ADD_S --> ADD_P["🔴 Pulmonaires<br>Toux sèche<br>Douleur thoracique, dyspnée"]
    ADD_C & ADD_B & ADD_A & ADD_N & ADD_P --> ADD_URG["🚨 URGENCE ABSOLUE"]
    ADD_URG --> ADD_CT["✅ O₂ 100% 15L/min<br>Position confortable<br>Hydrater si conscient"]
    ADD_CT --> ADD_SEC["🚨 SAMU 15 / CROSS 196<br>→ Caisson hyperbare"]

    style ROOT fill:#0055aa,color:#fff
    style PREV fill:#44bb44,color:#fff
    style OK fill:#44bb44,color:#fff
    style PAL fill:#ff8800,color:#fff
    style BULLES fill:#ff4444,color:#fff
    style ADD_URG fill:#ff4444,color:#fff
    style ADD_SEC fill:#ff4444,color:#fff
    style ADD_CT fill:#44bb44,color:#fff
```

---

## 🌀 Narcose

```mermaid
flowchart TD
    ROOT["🌀 Narcose"]

    ROOT --> PREV["✅ Prévention<br>Éviter la fatigue, le stress et l'essoufflement avant la plongée<br>Descendre progressivement > 30m<br>Toujours en binôme — surveillance mutuelle<br>Ne jamais ignorer les signes chez son équipier<br>Facteurs aggravants : froid, alcool la veille"]

    ROOT --> NARC_M["Mécanisme<br>Effet N₂ sur SNC — Loi de Henry<br>Apparaît > 30m — Variable selon individu"]
    NARC_M --> NARC_S{Intensité}
    NARC_S --> NARC_L["🟡 Légers<br>Euphorie, fou-rire<br>Relâchement attention"]
    NARC_S --> NARC_MOD["🟠 Modérés<br>Ralentissement décisions<br>Mauvais jugement"]
    NARC_S --> NARC_SEV["🔴 Sévères<br>Hallucinations<br>Panique ou prostration"]
    NARC_L & NARC_MOD & NARC_SEV --> NARC_CT["⬆️ Remonter de 5-10m<br>Signes réversibles rapidement<br>Signal binôme obligatoire"]
    NARC_CT --> NARC_Q{Amélioration ?}
    NARC_Q -->|Oui| NARC_OK["✅ Rester à cette profondeur<br>Surveillance binôme renforcée"]
    NARC_Q -->|Non| NARC_KO["🛑 Interrompre la plongée<br>Remonter en surface"]

    style ROOT fill:#0055aa,color:#fff
    style PREV fill:#44bb44,color:#fff
    style NARC_SEV fill:#ff8800,color:#fff
    style NARC_OK fill:#44bb44,color:#fff
    style NARC_KO fill:#ff4444,color:#fff
```

---

## 😮‍💨 Essoufflement

```mermaid
flowchart TD
    ROOT["😮‍💨 Essoufflement"]

    ROOT --> PREV["✅ Prévention<br>Éviter les efforts intenses en immersion<br>Adopter un palmage lent et régulier<br>Expirer à fond — ne jamais retenir sa respiration<br>Vérifier le réglage du détendeur avant la plongée<br>Signaler toute gêne respiratoire au binôme dès le début"]

    ROOT --> ESSO_M["Mécanisme<br>Accumulation CO₂<br>Effort intense, stress<br>Respiration inversée"]
    ESSO_M --> ESSO_S{Signes}
    ESSO_S --> ESSO_D["🟡 Début<br>Respiration haletante<br>Sentiment manque d'air"]
    ESSO_S --> ESSO_A["🟠 Aggravation<br>Impossibilité de récupérer<br>Angoisse"]
    ESSO_D & ESSO_A --> ESSO_CT["🛑 STOP immédiat<br>S'accrocher — Se stabiliser<br>Expirer à fond d'abord<br>Puis inspirer lentement"]
    ESSO_CT --> ESSO_Q{Récupération ?}
    ESSO_Q -->|Oui| ESSO_OK["✅ Remonter lentement<br>Sans effort — Binôme proche"]
    ESSO_Q -->|Non| ESSO_KO["🚨 Assistance binôme<br>Remonter ensemble<br>O₂ en surface"]

    style ROOT fill:#0055aa,color:#fff
    style PREV fill:#44bb44,color:#fff
    style ESSO_OK fill:#44bb44,color:#fff
    style ESSO_KO fill:#ff4444,color:#fff
```

---

## 🥶 Froid

```mermaid
flowchart TD
    ROOT["🥶 Froid"]

    ROOT --> PREV["✅ Prévention<br>Combinaison adaptée à la température de l'eau<br>Manger avant la plongée — être reposé<br>Limiter la durée si eau froide<br>Surveiller son binôme — signaler tout inconfort<br>Sortir avant d'être vraiment froid"]

    ROOT --> FROID_M["Mécanisme<br>Déperdition thermique × 25 dans l'eau<br>Hypothermie progressive"]
    FROID_M --> FROID_S{Signes}
    FROID_S --> FROID_D["🟡 Début<br>Frissons<br>Engourdissement extrémités<br>Perte de dextérité"]
    FROID_S --> FROID_A["🟠 Avancé<br>Troubles du jugement<br>Ralentissement — Fatigue intense"]
    FROID_D & FROID_A --> FROID_CT["⚠️ Signaler au binôme<br>Geste : bras croisés sur poitrine<br>⬆️ Abréger la plongée<br>Remonter ensemble"]
    FROID_CT --> FROID_OK["✅ Sortie de l'eau<br>S'abriter du vent — Se réchauffer"]

    style ROOT fill:#0055aa,color:#fff
    style PREV fill:#44bb44,color:#fff
    style FROID_A fill:#ff8800,color:#fff
    style FROID_OK fill:#44bb44,color:#fff
```

---

## ⚡ Hyperventilation

```mermaid
flowchart TD
    ROOT["⚡ Hyperventilation"]

    ROOT --> PREV["✅ Prévention<br>Ne jamais hyperventiler avant une apnée<br>Respiration calme et régulière en surface<br>Gérer le stress avant la mise à l'eau<br>Toujours plonger en binôme — jamais seul en apnée"]

    ROOT --> HYPER_M["Mécanisme<br>Chute brutale du CO₂<br>Stimulus respiratoire = CO₂ pas O₂"]
    HYPER_M --> HYPER_C{Contexte}
    HYPER_C --> HYPER_I["Involontaire<br>Stress, panique<br>Essoufflement mal géré"]
    HYPER_C --> HYPER_V["⚠️ Volontaire avant apnée<br>PRATIQUE DANGEREUSE<br>Syncope hypoxique → noyade"]
    HYPER_I --> HYPER_CT["🛑 Stop activité<br>Respiration lente et consciente<br>Signal binôme — Remonter si nécessaire"]
    HYPER_V --> HYPER_KO["🚨 NE JAMAIS HYPERVENTILER<br>avant une apnée"]
    HYPER_CT --> HYPER_OK["✅ Récupération progressive"]

    style ROOT fill:#0055aa,color:#fff
    style PREV fill:#44bb44,color:#fff
    style HYPER_V fill:#ff4444,color:#fff
    style HYPER_KO fill:#ff4444,color:#fff
    style HYPER_OK fill:#44bb44,color:#fff
```
