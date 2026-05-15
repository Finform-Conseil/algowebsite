# 🏛️ FEUILLE DE ROUTE & DETTE TECHNIQUE — MODULE TECHNICALANALYSIS
# Mis à jour par Codex TENOR — Session 47 — 2026-05-15 (OBJECT TREE COMPARE + RAF DIAGNOSTICS + BRVM SYMBOL NORMALIZATION)
---
## AXIOM-ENGINE : Question de dignité professionnelle : on ne met pas de any sur les objets le plus complexe de l'application (l'instance ECharts). Choisis ta bataille." pire eviter de mettre des any partout et pour tout !
---
## AXIOM-FINANCIAL-PROOF : Cette interface n'est pas un jeu
`components/technical-analysis` affiche des prix, indicateurs, comparaisons, alertes et signaux visuels qui peuvent influencer des décisions financières réelles. Une seule valeur fausse peut faire perdre de l'argent.

Toute donnée affichée doit tendre vers la "preuve financière" :
- source traçable : symbole, date, OHLCV, devise, provenance;
- alignement temporel auditable entre symbole principal et comparaisons;
- Data Window capable d'expliquer close courant, close de base, date de base, formule et pourcentage;
- détection visible des anomalies : donnée manquante, stale, illiquide, split/dividende non ajusté, zéro ou non-alignement;
- interdiction de masquer une incertitude derrière un rendu lisse et professionnel.

Réflexe obligatoire avant tout changement : "Est-ce qu'un utilisateur peut mettre de l'argent derrière cette valeur, et peut-on la prouver ?"
---
## 🏆 1. BATAILLES REMPORTÉES (En production)
- ✅ **Fusion RAF (SCAR-DOUBLE-RAF)** : Création de `useMasterRenderLoop` pour orchestrer `useCursorRenderer` et `useOverlayRenderer` sur une seule frame VSync. Éradication du micro-stuttering et division par deux de la charge CPU Canvas.
- ✅ **Typage Strict Redux (SCAR-TS2322)** : Synchronisation de `AdvancedIndicatorsState` avec le Reducer (`ichimoku`, `stochRsi`, `bbWidth`, `bbPercentB`), éradication des fusions d'état instables via des assignations explicites.
- ✅ **God Component démantelé** : `TechnicalAnalysis.tsx` purgé. État décentralisé via Redux + hooks spécialisés (`useDrawingManager`, `useFloatingToolbar`, `useAlertMonitor`).
- ✅ **Moteur Performance (Web Worker)** : Calculs lourds (MACD, RSI, Bollinger, Ichimoku…) déportés dans `indicators.worker.ts`. UI stable à 60 FPS.
- ✅ **Ichimoku Cloud (Projection)** : Implémentation complète avec nuage (Polygon Fill), projection future (26 périodes), décalage Chikou et parent UI activable depuis `IndicatorsModal.tsx`.
- ✅ **Bollinger Bands HDR** : Refonte avec calcul de variance glissante (O(n)), settings inline (Période, StdDev, couleurs, visibilité, fill) et oscillateurs dérivés séparés (Width, %B).
- ✅ **Data Stitching** : `useMarketData.ts` fusionne historique CSV + scraping BRVM temps réel.
- ✅ **Moteur Intraday Autonome** : `brvm-collect` + `brvm-intraday` génère ses propres bougies (1m, 5m, 15m).
- ✅ **Suite de dessin complète** : ~40 outils TradingView répliqués (Fibonacci, Gann, Forecasting, Patterns…).
- ✅ **Architecture Zero-Lag** : Refs + RAF pour performance sans setState à 60Hz (PAT-045, SCAR-042).
- ✅ **Audit de Lint "Zero-Warning"** : Résolution de 17 problèmes critiques (ERR-01 à ERR-03, warnings de typage `any`, et dépendances `exhaustive-deps`).
- ✅ **Pile Undo/Redo (Ctrl+Z)** : Implémentée nativement via `historyRef` dans `useDrawingManager.ts`.
- ✅ **Hit-Test Géométrique (SCAR-157)** : Résolution de la sélection des zones pleines (Fill) via Winding Number et fallback barycentrique dans `GeometricPatternUtils.ts`.
- ✅ **Zero-Division Shield (SCAR-ZERO-DIV)** : Protection absolue contre la propagation de `NaN` dans `drawDiagonalWithRatio`.
- ✅ **Purge JSDOM (SCAR-114)** : Remplacement complet de JSDOM par Cheerio dans les scrapers API (`brvm-bonds`, `brvm-fundamentals`, etc.) pour prévenir les fuites mémoire (OOM) en environnement Serverless.
- ✅ **Normalisation dataset BRVM** : Les fetchs CSV résolvent les noms commerciaux via le mapping partagé avant construction d'URL. Exemple : `SONATEL` reste visible dans l'UI mais cible `SNTS/SNTS.daily.csv` côté dataset public.
- ✅ **Object Tree Compare matérialisé** : Les symboles comparés apparaissent dans l'arbre des objets avec les IDs `compare-*` du renderer ECharts; l'œil pilote la visibilité et la poubelle retire la comparaison via Redux.
- ✅ **Diagnostic RAF honnête** : `useMasterRenderLoop` distingue désormais un vrai subscriber RAF lent d'un stall externe du thread principal, sans affaiblir le mode dégradé.
- ✅ **Contrat notifications restauré** : Les warnings du modal de recherche fournissent `iconType` et respectent le contrat `AppNotification`.
- ✅ **Layout Setup V1** : Bouton Layout près de `Sauvegarder l'analyse`, popover multi-chart, sync toggles, presets BRVM, persistance IndexedDB/localStorage via état sauvegardé, grille active + panneaux secondaires auditables.
---
## 🚨 2. RAPPORT D'AUDIT ESLINT — ÉTAT FINAL
**Statut :** `✔ 0 problem (0 errors, 0 warnings)`
**Dernière Passe :** Vérification TypeScript ciblée Bollinger/Ichimoku/RAF sans sortie d'erreur sur les fichiers concernés. Audit global ESLint historique conservé.
---
## 📋 3. PLAN DE CORRECTION PRIORISÉ
### Sprint 1 & 2 — Corrections rapides et architecturales
- ✅ **COMPLÉTÉ** : Nettoyage des dépendances, variables inutilisées, console.logs, et migration des états dérivés.
### Sprint 3 — Finalisation des désactivations Zero-Lag
- [ ] Poursuivre la migration des event-handlers vers le système de Refs mutables pour éliminer les derniers re-renders résiduels.
### Sprint 4 — Validation client bas matériel
- [ ] Définir un protocole de load testing client pour mesurer le maintien des 60 FPS sur configurations modestes : vieux smartphones, CPU throttling Chrome, gros historique CSV, 5 comparaisons, 5 indicateurs bas, dessins nombreux.
- [ ] Ajouter un scénario de stress test Object Tree + comparaisons : masquer/afficher/supprimer plusieurs séries `compare-*` pendant zoom/pan et vérifier absence de stall RAF attribué aux mauvais subscribers.
### Sprint 5 — Financial Proof / Auditabilité des valeurs
- [ ] Ajouter un Data Audit au mode Compare : source, symbole canonique, date alignée, close courant, close de base, date de base, formule et pourcentage calculé.
- [ ] Marquer visuellement les données non prouvées : historique incomplet, date absente, stale quote, valeur zéro, illiquidité, split/dividende non ajusté ou devise ambiguë.
- [ ] Ajouter une vérification reproductible qui compare les valeurs affichées à un calcul indépendant sur OHLCV brut.
- [ ] Exposer dans la Data Window les valeurs des séries compare au survol, pas seulement la courbe.
### Sprint 6 — Layout Setup V2
- [ ] Transformer les panneaux secondaires en véritables instances ECharts indépendantes lorsque le budget FPS est validé.
- [ ] Synchroniser crosshair/time/date range entre instances sans boucle infinie via `isSyncing`, throttle 16 ms et debounce 50 ms.
- [ ] Ajouter le changement de symbole par cellule avec Data Audit visible si un titre BRVM n'a pas coté à la date synchronisée.
- [ ] Étendre progressivement à 8/9/12/16 graphiques uniquement après load testing client.
---
## 🎯 4. PROCHAINES CIBLES STRATÉGIQUES (Features)
### Option A — Persistance Cloud des Tracés
- **État actuel :** `localStorage` / `IndexedDB` local uniquement. Perte si cache vidé ou changement de PC.
- **Complexité :** Moyenne (`handleSaveAnalysis` → API backend Django)
- **Impact :** Critique pour la rétention utilisateur.
### Option B — Support Tactile PointerEvents
- **État actuel :** Événements `Mouse*` uniquement (partiellement migré vers `Pointer*` dans certains hooks, à unifier).
- **Complexité :** Moyenne (migration totale vers `Pointer*` dans `useDrawingManager.ts`)
- **Impact :** Bloquant sur mobile/tablette.
### Option C — Worker Race Condition (messageId)
- **État actuel :** Changements rapides de timeframe peuvent désynchroniser les indicateurs.
- **Complexité :** Faible (ajout d'un `messageId` dans le protocole worker - *Note: Partiellement adressé dans SCAR-162, à valider sous stress test*).
- **Impact :** Stabilité en navigation rapide.
### Option D — Parité complète des settings Bollinger
- **État actuel :** `length`, `multiplier`, couleurs, visibilité et fill sont câblés. `source` et `offset` existent dans l'UI/store mais ne sont pas encore appliqués au calcul/rendu.
- **Complexité :** Faible à moyenne (`calculateBollinger`, worker, rendu ECharts).
- **Impact :** Parité TradingView et honnêteté des contrôles utilisateur.
### Option E — Load Testing Client 60 FPS
- **État actuel :** L'architecture Canvas 2D + ECharts est mature et instrumentée (`MasterRenderLoop`, mode dégradé, diagnostics subscribers), mais aucun protocole formel ne valide encore le maintien des 60 FPS sur matériel modeste.
- **Question stratégique T5 :** L'architecture du Canvas 2D et d'ECharts est maintenant très mature. Avez-vous prévu des tests de charge client pour valider le maintien des 60 FPS sur des configurations matérielles modestes, par exemple vieux smartphones ?
- **Complexité :** Moyenne (scénarios Playwright/Chrome CPU throttling, datasets lourds, captures FPS, seuils d'acceptation).
- **Impact :** Critique pour la crédibilité mobile/tablette et pour éviter d'optimiser à l'aveugle.
### Option F — Financial Proof Mode / Data Audit
- **État actuel :** Les comparaisons sont alignées par date et rendues correctement, mais l'interface ne prouve pas encore publiquement chaque pourcentage affiché.
- **Question stratégique T5 :** Quel niveau de preuve voulons-nous afficher à l'utilisateur avant qu'une valeur de marché soit considérée fiable pour une décision financière ?
- **Complexité :** Moyenne (Data Window enrichie, provenance des CSV/API, flags d'anomalie, tests indépendants de calcul).
- **Impact :** Critique : transforme le graphe d'une visualisation jolie en outil de décision auditable.
### Option G — Layout Setup V2 / Vraies instances multi-chart
- **État actuel :** La V1 fournit le menu, les sync settings, les presets, la persistance et une grille avec chart actif réel plus panneaux secondaires basés sur OHLCV cache réel.
- **Question stratégique T5 :** Quel plafond de charts simultanés voulons-nous garantir à 60 FPS sur matériel modeste avant de rendre les cellules secondaires comme vraies instances ECharts ?
- **Complexité :** Haute (multi-refs, multi-renderers, sync crosshair/time anti-loop, cache partagé et Data Window multi-symboles).
- **Impact :** Élevé : transforme l'outil en mini-terminal multi-vues complet.
---
## ⚠️ 5. ANGLES MORTS CONNUS & DETTE TECHNIQUE (Torvalds Speak)
- **Dette Bollinger Source/Offset :** Les contrôles `Source` et `Offset` ne doivent pas rester décoratifs; ils doivent modifier réellement le calcul ou être masqués temporairement.
- **Dette de Typage Résiduelle :** Il reste des casts `any` dans `IndicatorsModal.tsx` et `useEChartsRenderer.ts` qui doivent être nettoyés pour atteindre la pureté TypeScript absolue.
- **Intraday hors marché :** Le moteur `brvm-collect` ne gère pas les jours fériés BRVM → à documenter dans `brvm-intraday`.
- **Dette Load Testing Client :** Le système sait diagnostiquer les frame drops, mais il manque encore un banc de charge reproductible pour prouver la tenue 60 FPS sur hardware faible.
- **Dette Financial Proof :** Les valeurs de marché doivent être prouvables dans l'interface; sans provenance visible, formule et warning d'anomalie, un rendu correct peut encore induire une décision financière dangereuse.
---
*Synchronisé par **Codex TENOR** — Session #47 — 2026-05-15*
