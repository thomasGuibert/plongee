# 🫁 Physiologie & Risques — N2 FFESSM

---

## 🦻 Barotraumatismes

```mermaid
flowchart TD
    ROOT["🦻 Barotraumatismes"]
    ROOT --> BARO_OR["Oreilles<br>Douleur à la descente"]
    BARO_OR --> BARO_OR1{Manœuvre<br>d'équilibrage ?}
    BARO_OR1 -->|Valsalva / Frenzel réussi| BARO_OR2["✅ Continuer"]
    BARO_OR1 -->|Échec| BARO_OR3["Remonter 1-2m<br>Réessayer lentement"]
    BARO_OR3 -->|Toujours échec| BARO_OR4["🛑 Arrêter la plongée<br>Consultation médicale"]

    ROOT --> BARO_SI["Sinus<br>Douleur front / pommettes"]
    BARO_SI --> BARO_SI1["🛑 Remonter progressivement<br>Ne pas forcer<br>Consultation ORL si persistant"]

    ROOT --> BARO_PO["Poumons<br>Remontée trop rapide<br>Blocage respiration"]
    BARO_PO --> BARO_PO1["🚨 GRAVISSIME<br>Surpression pulmonaire<br>Embolie gazeuse possible"]
    BARO_PO1 --> BARO_PO2["🚨 O₂ 100%<br>Position demi-assise<br>SAMU 15 — Caisson hyperbare"]

    style ROOT fill:#0055aa,color:#fff
    style BARO_OR2 fill:#44bb44,color:#fff
    style BARO_PO1 fill:#ff4444,color:#fff
    style BARO_PO2 fill:#ff4444,color:#fff
```

---

## 🫀 ADD — Accident de Décompression

```mermaid
flowchart TD
    ROOT["🫀 ADD — Accident de Décompression"]
    ROOT --> ADD_M["Mécanisme<br>Bullage N₂ — Loi de Henry<br>Remontée trop rapide ou NDL dépassée"]
    ADD_M --> ADD_S{Type de signes}
    ADD_S --> ADD_C["🟡 Cutanés<br>Prurit, marbrures<br>peau d'orange"]
    ADD_S --> ADD_A["🟠 Articulaires<br>Douleurs coudes<br>épaules, genoux"]
    ADD_S --> ADD_N["🔴 Neurologiques<br>Paresthésies, paralysie<br>troubles vision"]
    ADD_S --> ADD_V["🔴 Vestibulaires<br>Vertige rotatoire<br>Nausées, vomissements"]
    ADD_S --> ADD_P["🔴 Pulmonaires<br>Toux sèche<br>douleur thoracique, dyspnée"]
    ADD_C & ADD_A & ADD_N & ADD_V & ADD_P --> ADD_Q{Encore<br>sous l'eau ?}
    ADD_Q -->|Oui| ADD_R["Remonter immédiatement<br>Vitesse contrôlée<br>Palier sécu si possible"]
    ADD_Q -->|Non| ADD_URG["🚨 URGENCE ABSOLUE"]
    ADD_R --> ADD_URG
    ADD_URG --> ADD_CT["✅ O₂ 100% en continu<br>Position allongée<br>Hydrater si conscient"]
    ADD_CT --> ADD_SEC["🚨 SAMU 15 / CROSS 196<br>→ Caisson hyperbare"]

    style ROOT fill:#0055aa,color:#fff
    style ADD_URG fill:#ff4444,color:#fff
    style ADD_SEC fill:#ff4444,color:#fff
    style ADD_CT fill:#44bb44,color:#fff
```

---

## 🌀 Narcose

```mermaid
flowchart TD
    ROOT["🌀 Narcose"]
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
    style NARC_SEV fill:#ff8800,color:#fff
    style NARC_OK fill:#44bb44,color:#fff
    style NARC_KO fill:#ff4444,color:#fff
```

---

## 😮‍💨 Essoufflement

```mermaid
flowchart TD
    ROOT["😮‍💨 Essoufflement"]
    ROOT --> ESSO_M["Mécanisme<br>Accumulation CO₂<br>Effort intense, stress<br>Respiration inversée"]
    ESSO_M --> ESSO_S{Signes}
    ESSO_S --> ESSO_D["🟡 Début<br>Respiration haletante<br>Sentiment manque d'air"]
    ESSO_S --> ESSO_A["🟠 Aggravation<br>Impossibilité de récupérer<br>Angoisse"]
    ESSO_D & ESSO_A --> ESSO_CT["🛑 STOP immédiat<br>S'accrocher — Se stabiliser<br>Expirer à fond d'abord<br>Puis inspirer lentement"]
    ESSO_CT --> ESSO_Q{Récupération ?}
    ESSO_Q -->|Oui| ESSO_OK["✅ Remonter lentement<br>Sans effort — Binôme proche"]
    ESSO_Q -->|Non| ESSO_KO["🚨 Assistance binôme<br>Remonter ensemble<br>O₂ en surface"]

    style ROOT fill:#0055aa,color:#fff
    style ESSO_OK fill:#44bb44,color:#fff
    style ESSO_KO fill:#ff4444,color:#fff
```

---

## 🥶 Froid

```mermaid
flowchart TD
    ROOT["🥶 Froid"]
    ROOT --> FROID_M["Mécanisme<br>Déperdition thermique × 25 dans l'eau<br>Hypothermie progressive"]
    FROID_M --> FROID_S{Signes}
    FROID_S --> FROID_D["🟡 Début<br>Frissons<br>Engourdissement extrémités<br>Perte de dextérité"]
    FROID_S --> FROID_A["🟠 Avancé<br>Troubles du jugement<br>Ralentissement — Fatigue intense"]
    FROID_D & FROID_A --> FROID_CT["⚠️ Signaler au binôme<br>Geste : bras croisés sur poitrine<br>⬆️ Abréger la plongée<br>Remonter ensemble"]
    FROID_CT --> FROID_OK["✅ Sortie de l'eau<br>S'abriter du vent — Se réchauffer"]

    style ROOT fill:#0055aa,color:#fff
    style FROID_A fill:#ff8800,color:#fff
    style FROID_OK fill:#44bb44,color:#fff
```

---

## ⚡ Hyperventilation

```mermaid
flowchart TD
    ROOT["⚡ Hyperventilation"]
    ROOT --> HYPER_M["Mécanisme<br>Chute brutale du CO₂<br>Stimulus respiratoire = CO₂ pas O₂"]
    HYPER_M --> HYPER_C{Contexte}
    HYPER_C --> HYPER_I["Involontaire<br>Stress, panique<br>Essoufflement mal géré"]
    HYPER_C --> HYPER_V["⚠️ Volontaire avant apnée<br>PRATIQUE DANGEREUSE<br>Syncope hypoxique → noyade"]
    HYPER_I --> HYPER_CT["🛑 Stop activité<br>Respiration lente et consciente<br>Signal binôme — Remonter si nécessaire"]
    HYPER_V --> HYPER_KO["🚨 NE JAMAIS HYPERVENTILER<br>avant une apnée"]
    HYPER_CT --> HYPER_OK["✅ Récupération progressive"]

    style ROOT fill:#0055aa,color:#fff
    style HYPER_V fill:#ff4444,color:#fff
    style HYPER_KO fill:#ff4444,color:#fff
    style HYPER_OK fill:#44bb44,color:#fff
```
