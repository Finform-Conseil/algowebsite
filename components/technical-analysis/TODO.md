# 🏛️ FEUILLE DE ROUTE & DETTE TECHNIQUE — MODULE TECHNICALANALYSIS
# Mis à jour par Codex TENOR — Session 90 — 2026-05-12 (SYNCHRONISATION POST-IMPLÉMENTATION BOLLINGER/ICHIMOKU)
---
## AXIOM-ENGINE : Question de dignité professionnelle : on ne met pas de any sur les objets le plus complexe de l'application (l'instance ECharts). Choisis ta bataille." pire eviter de mettre des any partout et pour tout !
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
---
## ⚠️ 5. ANGLES MORTS CONNUS & DETTE TECHNIQUE (Torvalds Speak)
- **Dette Bollinger Source/Offset :** Les contrôles `Source` et `Offset` ne doivent pas rester décoratifs; ils doivent modifier réellement le calcul ou être masqués temporairement.
- **Dette de Typage Résiduelle :** Il reste des casts `any` dans `IndicatorsModal.tsx` et `useEChartsRenderer.ts` qui doivent être nettoyés pour atteindre la pureté TypeScript absolue.
- **Intraday hors marché :** Le moteur `brvm-collect` ne gère pas les jours fériés BRVM → à documenter dans `brvm-intraday`.
---
*Synchronisé par **Codex TENOR** — Session #90 — 2026-05-12*
