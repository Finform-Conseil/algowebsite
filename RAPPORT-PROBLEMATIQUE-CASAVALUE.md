# RAPPORT TECHNIQUE — GLOSSAIRE CASAVALUE / AFRIMARKET

## Mission pour Manus AI

---

## 1. CONTEXTE DU PROJET

**Plateforme** : AfriMarket — African Financial Intelligence Platform  
**URL locale** : http://localhost:3000/glossary  
**URL source** : https://www.casavalue.app/fr/glossary/[slug]  
**Langue** : Français (marché marocain — Bourse de Casablanca)  
**Périmètre** : Glossaire de 211+ termes d'investissement value

---

## 2. CE QUI EXISTE DÉJÀ (ce qu'on a réussi à récupérer)

### 2.1 Définitions courtes — RÉEL CasaValue ✅
- **Source** : Balises `<meta name="description">` des pages HTML (toujours accessibles même sans compte)
- **Statut** : 211 définitions récupérées — texte authentique CasaValue
- **Exemple** (Score de Qualité) : *"Le Score de Qualité CasaValue (0–10) mesure la qualité d'une entreprise cotée à la Bourse de Casablanca. Moyenne pondérée de 9 critères fondamentaux de qualité, chacun noté de 0 à 10."*

### 2.2 Sous-titres — RÉEL CasaValue ✅
- **Source** : Balises `<title>` des pages HTML (accessibles sans compte)
- **Statut** : 171 sous-titres récupérés
- **Exemple** (Score de Qualité) : *"Qualité CasaValue"*

### 2.3 Indicateurs de breadcrumb — RÉEL CasaValue ✅
- **Source** : Balisage schema.org/breadcrumb dans le HTML
- **Statut** : Récupéré pour tous les termes

### 2.4 Données CRITÈRES de QUALITY-SCORE & ROE — RÉEL CasaValue ✅
- **Source** : Contenu brut scanné avant d'atteindre la limite des 10 articles
- **Statut** : Partiellement complet (2 termes seulement)

### 2.5 Formules — GÉNÉRÉES par IA ⚠️
- **Source** : Générées par un LLM à partir du titre du terme
- **Statut** : 87 formules écrites, exactes financièrement mais PAS le texte officiel CasaValue
- **Problème** : Correctes sur le fond, mais un professionnel du domaine pourrait dire "ce n'est pas la formule que CasaValue utilise"

---

## 3. CE QUI MANQUE (pour terminer le site à 100%)

### 3.1 SimplyPut (explication simple) — BLOQUÉ CasaValue 🚫
- **Description** : Un paragraphe "En clair" qui vulgarise le concept
- **Où il est** : Dans le contenu principal de la page, chargé via RSC (React Server Components)
- **Pourquoi bloqué** : Nécessite un compte Premium après 10 articles/jour

### 3.2 Sections détaillées (3-4 parties) — BLOQUÉ CasaValue 🚫
- **Structure typique** :
  - "Qu'est-ce que [terme] ?" (définition détaillée)
  - "Comment interpréter [terme] ?" (analyse)
  - "Exemple" (cas concret)
  - "Ce qu'il faut retenir" (résumé)
- **Où il est** : Même contenu RSC que le simplyPut
- **Pourquoi bloqué** : Identique — Premium requis

### 3.3 Formules officielles CasaValue — BLOQUÉ 🚫
- **Description** : La formule exacte telle qu'écrite par CasaValue (peut différer des formules standard)
- **Exemple** : Le "Résultat Net Récurrent" pourrait être calculé différemment du "Résultat Net" standard

---

## 4. LE PROBLÈME TECHNIQUE — POURQUOI ON PEUT PAS SCRAPER DIRECTEMENT

### 4.1 La limite des 10 articles/jour
- CasaValue autorise **10 consultations du contenu détaillé du glossaire par jour** (compte gratuit)
- **Compteur côté serveur** : La vérification est faite dans le RSC (React Server Components) côté serveur, pas côté client
- **Mécanisme** : Même avec un compte connecté, après 10 pages, le contenu est remplacé par un message "Passez au Premium"

### 4.2 Le contenu est dans le RSC — pas dans le HTML statique
- CasaValue est construit avec **Next.js** + React Server Components
- Le simplyPut et les sections sont chargés **dans le flux RSC** (`self.__next_f.push(...)`)
- Quand la limite est atteinte, le serveur **ne renvoie pas les données** — il renvoie le message Premium
- Les meta tags (description, title) sont **toujours** dans le HTML initial — c'est pour ça qu'on a pu les récupérer

### 4.3 Le compteur est lié au compte/session
- Le compteur est stocké dans la **session utilisateur** côté serveur
- Les cookies de session contiennent un token `__Secure-better-auth.session_token`
- Créer une **nouvelle session** = un nouveau compteur à 0/10

### 4.4 Comportement anonyme
- Même sans compte connecté, le serveur bloque après 10 requêtes (peut-être par IP ?)
- Le message affiché aux anonymes est "Connectez-vous" au lieu de "Passez au Premium"

---

## 5. HYPOTHÈSES DE SOLUTION POUR MANUS AI

### 5.1 Rotation de sessions
Créer plusieurs comptes gratuits Google, les connecter à CasaValue, consulter 10 pages chacun.
- **Avantage** : Simple, fonctionnel
- **Inconvénient** : Nécessite ~21 comptes pour 211 pages

### 5.2 Rotation de sessions + navigation automatisée
Manus AI ouvre un navigateur, se connecte, lit 10 pages, sauvegarde le contenu, change de compte, répète.
- **Risque** : CasaValue pourrait détecter le pattern automatisé (via PostHog analytics)

### 5.3 Compte Premium direct
Si tu peux acheter un compte Premium (même 1 mois), l'accès devient illimité.
- **Avantage** : Solution propre, légale, contenu officiel garanti
- **Inconvénient** : Coût

### 5.4 Version anglaise
La limite pourrait être calculée **par locale** (10 EN + 10 FR ?). À tester rapidement.

### 5.5 Wayback Machine / Google Cache
Si les pages ont été crawléees par Google ou archivées sur archive.org, le contenu complet est peut-être disponible.

---

## 6. CE QUE CHAQUE PAGE GLOSSAIRE CONTIENT (structure exacte)

```
URL : https://www.casavalue.app/fr/glossary/[slug]

┌─ META TAGS (toujours accessibles) ─────────────────┐
│  <title> : [Terme] – [Sous-titre] | Glossaire...   │
│  <meta description> : [Définition courte]           │
│  <breadcrumb> : Glossaire > [Catégorie] > [Terme]  │
└─────────────────────────────────────────────────────┘

┌─ CONTENU RSC (bloqué après 10/jour) ───────────────┐
│                                                      │
│  H1 : [Titre du terme]                               │
│                                                      │
│  [Badge catégorie] [Badge type]                      │
│                                                      │
│  Section "En clair" (SimplyPut) :                    │
│    → Paragraphe en langage simple                    │
│                                                      │
│  Section 1 : "Qu'est-ce que [terme] ?"              │
│    → Définition détaillée (2-3 paragraphes)          │
│                                                      │
│  Section 2 : "Comment l'interpréter ?"              │
│    → Guide d'analyse (2-3 paragraphes)               │
│                                                      │
│  Section 3 : "Exemple"                               │
│    → Cas concret chiffré (1-2 paragraphes)           │
│                                                      │
│  [Formule] (boîte de formule mathématique)           │
│                                                      │
│  Section 4 : "Ce qu'il faut retenir"                │
│    → Résumé (1 paragraphe)                           │
│                                                      │
│  [Tags associés]                                     │
│  [Termes connexes]                                   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 7. LISTE COMPLÈTE DES 213 TERMES À SCRAPER

Chaque URL se construit ainsi : `https://www.casavalue.app/fr/glossary/[slug]`

| # | Slug | URL |
|---|------|-----|
| 1 | `quality-score` | https://www.casavalue.app/fr/glossary/quality-score |
| 2 | `ebitda` | https://www.casavalue.app/fr/glossary/ebitda |
| 3 | `ebit` | https://www.casavalue.app/fr/glossary/ebit |
| 4 | `net-income` | https://www.casavalue.app/fr/glossary/net-income |
| 5 | `gross-margin` | https://www.casavalue.app/fr/glossary/gross-margin |
| 6 | `operating-margin` | https://www.casavalue.app/fr/glossary/operating-margin |
| 7 | `net-margin` | https://www.casavalue.app/fr/glossary/net-margin |
| 8 | `roe` | https://www.casavalue.app/fr/glossary/roe |
| 9 | `roa` | https://www.casavalue.app/fr/glossary/roa |
| 10 | `roic` | https://www.casavalue.app/fr/glossary/roic |
| 11 | `roce` | https://www.casavalue.app/fr/glossary/roce |
| 12 | `pe-ratio` | https://www.casavalue.app/fr/glossary/pe-ratio |
| 13 | `price-to-book` | https://www.casavalue.app/fr/glossary/price-to-book |
| 14 | `ev-ebitda` | https://www.casavalue.app/fr/glossary/ev-ebitda |
| 15 | `earnings-yield` | https://www.casavalue.app/fr/glossary/earnings-yield |
| 16 | `peg-ratio` | https://www.casavalue.app/fr/glossary/peg-ratio |
| 17 | `enterprise-value` | https://www.casavalue.app/fr/glossary/enterprise-value |
| 18 | `market-cap` | https://www.casavalue.app/fr/glossary/market-cap |
| 19 | `book-value` | https://www.casavalue.app/fr/glossary/book-value |
| 20 | `intrinsic-value` | https://www.casavalue.app/fr/glossary/intrinsic-value |
| 21 | `eps` | https://www.casavalue.app/fr/glossary/eps |
| 22 | `free-cash-flow` | https://www.casavalue.app/fr/glossary/free-cash-flow |
| 23 | `fcf-margin` | https://www.casavalue.app/fr/glossary/fcf-margin |
| 24 | `fcf-conversion` | https://www.casavalue.app/fr/glossary/fcf-conversion |
| 25 | `operating-cash-flow` | https://www.casavalue.app/fr/glossary/operating-cash-flow |
| 26 | `capex` | https://www.casavalue.app/fr/glossary/capex |
| 27 | `owner-earnings` | https://www.casavalue.app/fr/glossary/owner-earnings |
| 28 | `net-debt` | https://www.casavalue.app/fr/glossary/net-debt |
| 29 | `net-debt-ebitda` | https://www.casavalue.app/fr/glossary/net-debt-ebitda |
| 30 | `debt-to-equity` | https://www.casavalue.app/fr/glossary/debt-to-equity |
| 31 | `interest-coverage` | https://www.casavalue.app/fr/glossary/interest-coverage |
| 32 | `current-ratio` | https://www.casavalue.app/fr/glossary/current-ratio |
| 33 | `cagr` | https://www.casavalue.app/fr/glossary/cagr |
| 34 | `organic-growth` | https://www.casavalue.app/fr/glossary/organic-growth |
| 35 | `operating-leverage` | https://www.casavalue.app/fr/glossary/operating-leverage |
| 36 | `dividend-yield` | https://www.casavalue.app/fr/glossary/dividend-yield |
| 37 | `payout-ratio` | https://www.casavalue.app/fr/glossary/payout-ratio |
| 38 | `dps` | https://www.casavalue.app/fr/glossary/dps |
| 39 | `working-capital` | https://www.casavalue.app/fr/glossary/working-capital |
| 40 | `dso` | https://www.casavalue.app/fr/glossary/dso |
| 41 | `inventory-turnover` | https://www.casavalue.app/fr/glossary/inventory-turnover |
| 42 | `asset-turnover` | https://www.casavalue.app/fr/glossary/asset-turnover |
| 43 | `moat` | https://www.casavalue.app/fr/glossary/moat |
| 44 | `margin-of-safety` | https://www.casavalue.app/fr/glossary/margin-of-safety |
| 45 | `competitive-advantage` | https://www.casavalue.app/fr/glossary/competitive-advantage |
| 46 | `free-float` | https://www.casavalue.app/fr/glossary/free-float |
| 47 | `private-equity` | https://www.casavalue.app/fr/glossary/private-equity |
| 48 | `compounding` | https://www.casavalue.app/fr/glossary/compounding |
| 49 | `normalized-earnings` | https://www.casavalue.app/fr/glossary/normalized-earnings |
| 50 | `goodwill` | https://www.casavalue.app/fr/glossary/goodwill |
| 51 | `dilution` | https://www.casavalue.app/fr/glossary/dilution |
| 52 | `share-buyback` | https://www.casavalue.app/fr/glossary/share-buyback |
| 53 | `mean-reversion` | https://www.casavalue.app/fr/glossary/mean-reversion |
| 54 | `terminal-value` | https://www.casavalue.app/fr/glossary/terminal-value |
| 55 | `discount-rate` | https://www.casavalue.app/fr/glossary/discount-rate |
| 56 | `wacc` | https://www.casavalue.app/fr/glossary/wacc |
| 57 | `dcf` | https://www.casavalue.app/fr/glossary/dcf |
| 58 | `price-to-fcf` | https://www.casavalue.app/fr/glossary/price-to-fcf |
| 59 | `cfo-to-net-income` | https://www.casavalue.app/fr/glossary/cfo-to-net-income |
| 60 | `reinvestment-rate` | https://www.casavalue.app/fr/glossary/reinvestment-rate |
| 61 | `capex-to-revenue` | https://www.casavalue.app/fr/glossary/capex-to-revenue |
| 62 | `capex-to-depreciation` | https://www.casavalue.app/fr/glossary/capex-to-depreciation |
| 63 | `ebitda-margin` | https://www.casavalue.app/fr/glossary/ebitda-margin |
| 64 | `dividend-coverage` | https://www.casavalue.app/fr/glossary/dividend-coverage |
| 65 | `dupont-analysis` | https://www.casavalue.app/fr/glossary/dupont-analysis |
| 66 | `revenue-per-share` | https://www.casavalue.app/fr/glossary/revenue-per-share |
| 67 | `fcf-per-share` | https://www.casavalue.app/fr/glossary/fcf-per-share |
| 68 | `share-count-cagr` | https://www.casavalue.app/fr/glossary/share-count-cagr |
| 69 | `ev-ebit` | https://www.casavalue.app/fr/glossary/ev-ebit |
| 70 | `lynch-categories` | https://www.casavalue.app/fr/glossary/lynch-categories |
| 71 | `slow-grower` | https://www.casavalue.app/fr/glossary/slow-grower |
| 72 | `stalwart` | https://www.casavalue.app/fr/glossary/stalwart |
| 73 | `fast-grower` | https://www.casavalue.app/fr/glossary/fast-grower |
| 74 | `cyclical` | https://www.casavalue.app/fr/glossary/cyclical |
| 75 | `turnaround` | https://www.casavalue.app/fr/glossary/turnaround |
| 76 | `asset-play` | https://www.casavalue.app/fr/glossary/asset-play |
| 77 | `ccc` | https://www.casavalue.app/fr/glossary/ccc |
| 78 | `dpo` | https://www.casavalue.app/fr/glossary/dpo |
| 79 | `dio` | https://www.casavalue.app/fr/glossary/dio |
| 80 | `bfr` | https://www.casavalue.app/fr/glossary/bfr |
| 81 | `cogs` | https://www.casavalue.app/fr/glossary/cogs |
| 82 | `sga` | https://www.casavalue.app/fr/glossary/sga |
| 83 | `d-and-a` | https://www.casavalue.app/fr/glossary/d-and-a |
| 84 | `nopat` | https://www.casavalue.app/fr/glossary/nopat |
| 85 | `etr` | https://www.casavalue.app/fr/glossary/etr |
| 86 | `yoy` | https://www.casavalue.app/fr/glossary/yoy |
| 87 | `ltm` | https://www.casavalue.app/fr/glossary/ltm |
| 88 | `fy` | https://www.casavalue.app/fr/glossary/fy |
| 89 | `s1-semestre` | https://www.casavalue.app/fr/glossary/s1-semestre |
| 90 | `ifrs` | https://www.casavalue.app/fr/glossary/ifrs |
| 91 | `bvps` | https://www.casavalue.app/fr/glossary/bvps |
| 92 | `tailwind` | https://www.casavalue.app/fr/glossary/tailwind |
| 93 | `headwind` | https://www.casavalue.app/fr/glossary/headwind |
| 94 | `oligopoly` | https://www.casavalue.app/fr/glossary/oligopoly |
| 95 | `pass-through-pricing` | https://www.casavalue.app/fr/glossary/pass-through-pricing |
| 96 | `vertical-integration` | https://www.casavalue.app/fr/glossary/vertical-integration |
| 97 | `deleveraging` | https://www.casavalue.app/fr/glossary/deleveraging |
| 98 | `gearing` | https://www.casavalue.app/fr/glossary/gearing |
| 99 | `quick-ratio` | https://www.casavalue.app/fr/glossary/quick-ratio |
| 100 | `net-cash-position` | https://www.casavalue.app/fr/glossary/net-cash-position |
| 101 | `multiple-expansion` | https://www.casavalue.app/fr/glossary/multiple-expansion |
| 102 | `impairment` | https://www.casavalue.app/fr/glossary/impairment |
| 103 | `non-recurring-items` | https://www.casavalue.app/fr/glossary/non-recurring-items |
| 104 | `provision-accounting` | https://www.casavalue.app/fr/glossary/provision-accounting |
| 105 | `related-party-transactions` | https://www.casavalue.app/fr/glossary/related-party-transactions |
| 106 | `value-trap` | https://www.casavalue.app/fr/glossary/value-trap |
| 107 | `mid-cycle-earnings` | https://www.casavalue.app/fr/glossary/mid-cycle-earnings |
| 108 | `going-concern` | https://www.casavalue.app/fr/glossary/going-concern |
| 109 | `switching-costs` | https://www.casavalue.app/fr/glossary/switching-costs |
| 110 | `commoditization` | https://www.casavalue.app/fr/glossary/commoditization |
| 111 | `backlog` | https://www.casavalue.app/fr/glossary/backlog |
| 112 | `secular-growth` | https://www.casavalue.app/fr/glossary/secular-growth |
| 113 | `maintenance-capex` | https://www.casavalue.app/fr/glossary/maintenance-capex |
| 114 | `conglomerate-discount` | https://www.casavalue.app/fr/glossary/conglomerate-discount |
| 115 | `negative-working-capital` | https://www.casavalue.app/fr/glossary/negative-working-capital |
| 116 | `ipo` | https://www.casavalue.app/fr/glossary/ipo |
| 117 | `minority-interest` | https://www.casavalue.app/fr/glossary/minority-interest |
| 118 | `equity-method` | https://www.casavalue.app/fr/glossary/equity-method |
| 119 | `earnings-normalization-bridge` | https://www.casavalue.app/fr/glossary/earnings-normalization-bridge |
| 120 | `arpu` | https://www.casavalue.app/fr/glossary/arpu |
| 121 | `ftth` | https://www.casavalue.app/fr/glossary/ftth |
| 122 | `ott` | https://www.casavalue.app/fr/glossary/ott |
| 123 | `churn-rate` | https://www.casavalue.app/fr/glossary/churn-rate |
| 124 | `termination-rates` | https://www.casavalue.app/fr/glossary/termination-rates |
| 125 | `degroupage` | https://www.casavalue.app/fr/glossary/degroupage |
| 126 | `mobile-money` | https://www.casavalue.app/fr/glossary/mobile-money |
| 127 | `anrt` | https://www.casavalue.app/fr/glossary/anrt |
| 128 | `aisc` | https://www.casavalue.app/fr/glossary/aisc |
| 129 | `lme` | https://www.casavalue.app/fr/glossary/lme |
| 130 | `ore-grade` | https://www.casavalue.app/fr/glossary/ore-grade |
| 131 | `mineral-reserves` | https://www.casavalue.app/fr/glossary/mineral-reserves |
| 132 | `office-des-changes` | https://www.casavalue.app/fr/glossary/office-des-changes |
| 133 | `tailings-reprocessing` | https://www.casavalue.app/fr/glossary/tailings-reprocessing |
| 134 | `onhym` | https://www.casavalue.app/fr/glossary/onhym |
| 135 | `conservatory-seizure` | https://www.casavalue.app/fr/glossary/conservatory-seizure |
| 136 | `management-fee-convention` | https://www.casavalue.app/fr/glossary/management-fee-convention |
| 137 | `squeeze-out` | https://www.casavalue.app/fr/glossary/squeeze-out |
| 138 | `ffo` | https://www.casavalue.app/fr/glossary/ffo |
| 139 | `nav-reit` | https://www.casavalue.app/fr/glossary/nav-reit |
| 140 | `gla` | https://www.casavalue.app/fr/glossary/gla |
| 141 | `opci` | https://www.casavalue.app/fr/glossary/opci |
| 142 | `cap-rate` | https://www.casavalue.app/fr/glossary/cap-rate |
| 143 | `ltv` | https://www.casavalue.app/fr/glossary/ltv |
| 144 | `shareholder-yield` | https://www.casavalue.app/fr/glossary/shareholder-yield |
| 145 | `ias-40-fair-value` | https://www.casavalue.app/fr/glossary/ias-40-fair-value |
| 146 | `caisse-de-compensation` | https://www.casavalue.app/fr/glossary/caisse-de-compensation |
| 147 | `ebe` | https://www.casavalue.app/fr/glossary/ebe |
| 148 | `rnpg` | https://www.casavalue.app/fr/glossary/rnpg |
| 149 | `caf` | https://www.casavalue.app/fr/glossary/caf |
| 150 | `tvp` | https://www.casavalue.app/fr/glossary/tvp |
| 151 | `campagne-agricole` | https://www.casavalue.app/fr/glossary/campagne-agricole |
| 152 | `contrat-programme` | https://www.casavalue.app/fr/glossary/contrat-programme |
| 153 | `trituration` | https://www.casavalue.app/fr/glossary/trituration |
| 154 | `lfl-same-store-sales` | https://www.casavalue.app/fr/glossary/lfl-same-store-sales |
| 155 | `cash-and-carry` | https://www.casavalue.app/fr/glossary/cash-and-carry |
| 156 | `hard-discount` | https://www.casavalue.app/fr/glossary/hard-discount |
| 157 | `sca` | https://www.casavalue.app/fr/glossary/sca |
| 158 | `amo` | https://www.casavalue.app/fr/glossary/amo |
| 159 | `biosimilars` | https://www.casavalue.app/fr/glossary/biosimilars |
| 160 | `gmp` | https://www.casavalue.app/fr/glossary/gmp |
| 161 | `resultat-non-courant` | https://www.casavalue.app/fr/glossary/resultat-non-courant |
| 162 | `cotisation-minimale` | https://www.casavalue.app/fr/glossary/cotisation-minimale |
| 163 | `cnss` | https://www.casavalue.app/fr/glossary/cnss |
| 164 | `amm` | https://www.casavalue.app/fr/glossary/amm |
| 165 | `api-pharma` | https://www.casavalue.app/fr/glossary/api-pharma |
| 166 | `sterile-injectable` | https://www.casavalue.app/fr/glossary/sterile-injectable |
| 167 | `ppa` | https://www.casavalue.app/fr/glossary/ppa |
| 168 | `baseload` | https://www.casavalue.app/fr/glossary/baseload |
| 169 | `onee` | https://www.casavalue.app/fr/glossary/onee |
| 170 | `gpl` | https://www.casavalue.app/fr/glossary/gpl |
| 171 | `capacity-charges` | https://www.casavalue.app/fr/glossary/capacity-charges |
| 172 | `btp` | https://www.casavalue.app/fr/glossary/btp |
| 173 | `carnet-de-commandes` | https://www.casavalue.app/fr/glossary/carnet-de-commandes |
| 174 | `vefa` | https://www.casavalue.app/fr/glossary/vefa |
| 175 | `pcsi` | https://www.casavalue.app/fr/glossary/pcsi |
| 176 | `lgv` | https://www.casavalue.app/fr/glossary/lgv |
| 177 | `book-to-bill` | https://www.casavalue.app/fr/glossary/book-to-bill |
| 178 | `lotissement` | https://www.casavalue.app/fr/glossary/lotissement |
| 179 | `aide-directe-au-logement` | https://www.casavalue.app/fr/glossary/aide-directe-au-logement |
| 180 | `preventes` | https://www.casavalue.app/fr/glossary/preventes |
| 181 | `payment-switching` | https://www.casavalue.app/fr/glossary/payment-switching |
| 182 | `saas-j-curve` | https://www.casavalue.app/fr/glossary/saas-j-curve |
| 183 | `vp-vul` | https://www.casavalue.app/fr/glossary/vp-vul |
| 184 | `lld` | https://www.casavalue.app/fr/glossary/lld |
| 185 | `teu` | https://www.casavalue.app/fr/glossary/teu |
| 186 | `transshipment` | https://www.casavalue.app/fr/glossary/transshipment |
| 187 | `nwm` | https://www.casavalue.app/fr/glossary/nwm |
| 188 | `anp` | https://www.casavalue.app/fr/glossary/anp |
| 189 | `concession-portuaire` | https://www.casavalue.app/fr/glossary/concession-portuaire |
| 190 | `messagerie` | https://www.casavalue.app/fr/glossary/messagerie |
| 191 | `gestion-deleguee` | https://www.casavalue.app/fr/glossary/gestion-deleguee |
| 192 | `clinker` | https://www.casavalue.app/fr/glossary/clinker |
| 193 | `petcoke` | https://www.casavalue.app/fr/glossary/petcoke |
| 194 | `bpe` | https://www.casavalue.app/fr/glossary/bpe |
| 195 | `cbam` | https://www.casavalue.app/fr/glossary/cbam |
| 196 | `eaf` | https://www.casavalue.app/fr/glossary/eaf |
| 197 | `scrap-rebar-spread` | https://www.casavalue.app/fr/glossary/scrap-rebar-spread |
| 198 | `tio2` | https://www.casavalue.app/fr/glossary/tio2 |
| 199 | `micro-irrigation` | https://www.casavalue.app/fr/glossary/micro-irrigation |
| 200 | `agrofourniture` | https://www.casavalue.app/fr/glossary/agrofourniture |
| 201 | `roll-up-strategy` | https://www.casavalue.app/fr/glossary/roll-up-strategy |
| 202 | `ammc` | https://www.casavalue.app/fr/glossary/ammc |
| 203 | `masi` | https://www.casavalue.app/fr/glossary/masi |
| 204 | `pcg` | https://www.casavalue.app/fr/glossary/pcg |
| 205 | `comptes-sociaux` | https://www.casavalue.app/fr/glossary/comptes-sociaux |
| 206 | `comptes-consolides` | https://www.casavalue.app/fr/glossary/comptes-consolides |
| 207 | `rex` | https://www.casavalue.app/fr/glossary/rex |
| 208 | `ago` | https://www.casavalue.app/fr/glossary/ago |
| 209 | `pdg` | https://www.casavalue.app/fr/glossary/pdg |
| 210 | `controle-fiscal` | https://www.casavalue.app/fr/glossary/controle-fiscal |
| 211 | `tresorerie-nette` | https://www.casavalue.app/fr/glossary/tresorerie-nette |
| 212 | `emprunt-obligataire` | https://www.casavalue.app/fr/glossary/emprunt-obligataire |
| 213 | `bam` | https://www.casavalue.app/fr/glossary/bam |

---

## 8. FORMAT DE LIVRAISON ATTENDU

```
glossary-data/
├── structure.json           # Mapping slug → sections (optionnel)
├── [slug]/
│   ├── simplyPut.txt        # "En clair" — 1 paragraphe
│   ├── section-1.txt        # "Qu'est-ce que..."
│   ├── section-2.txt        # "Comment interpréter..."
│   ├── section-3.txt        # "Exemple"
│   ├── section-4.txt        # "Ce qu'il faut retenir"
│   ├── formula.txt          # Formule officielle (si présente)
│   └── meta.json            # JSON avec title + description + breadcrumb
├── quality-score/
│   ├── simplyPut.txt
│   ├── ...
├── roe/
│   ├── ...
└── rapport-scraping.txt     # Statistiques : succès, échecs, notes
```

Si le format dossier est trop lourd, un seul fichier JSON avec tous les termes est également parfait.

---

## 9. NOTES IMPORTANTES POUR LA QUALITÉ

1. **PAS de contenu généré par IA** — seulement du texte effectivement lu sur la page CasaValue
2. **Si une page est bloquée** (limite Premium) → le noter mais ne PAS générer un faux contenu
3. **Dans le doute, ne pas inclure** — un contenu erroné serait repéré par les professionnels du métier
4. **Vérifier la cohérence** — les formules mathématiques doivent être exactes
5. **Attention aux caractères spéciaux** — les fichiers doivent être en UTF-8

---

## 10. CONTACT / RÉFÉRENCES

- **Projet** : AfriMarket — African Financial Intelligence Platform
- **Envoyé par** : Jack Josias (chef de projet)
- **Stack technique** : Next.js 15 / TypeScript / React 19 / SCSS
- **Hébergement local** : localhost:3000 (actuellement)
- **Destination finale** : Déploiement public sous AfriMarket

---

*Document généré le 24 juin 2026 — À transmettre à Manus AI pour exécution*
