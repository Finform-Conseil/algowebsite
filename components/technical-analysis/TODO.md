# 🏛️ FEUILLE DE ROUTE & DETTE TECHNIQUE — MODULE TECHNICALANALYSIS
# Mis à jour par AXIOM-ENGINE 1000.4 (DEUS-ULTIMA) — Session 88 — 2026-04-20 (SYNCHRONISATION DOC/CODE)

---

## AXIOM-ENGINE : Question de dignité professionnelle : on ne met pas de any sur les objets le plus complexe de l'application (l'instance ECharts). Choisis ta bataille."`

pire eviter de mettre des any partout et pour tout 
!

---

## 🏆 1. BATAILLES REMPORTÉES (En production)
- ✅ **God Component démantelé** : `TechnicalAnalysis.tsx` purgé. État décentralisé via Redux + hooks spécialisés (`useDrawingManager`, `useFloatingToolbar`, `useAlertMonitor`).
- ✅ **Moteur Performance (Web Worker)** : Calculs lourds (MACD, RSI, Bollinger…) déportés dans `indicators.worker.ts`. Communication Zero-Copy (Float64Array). UI stable à 60 FPS.
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
**Dernière Passe :** Chirurgie atomique sur les 17 points identifiés (Détails archivés dans AGENT_MEMOIRE_PROJECT_STATUS.scribe).

---

## 📋 3. PLAN DE CORRECTION PRIORISÉ

### Sprint 1 & 2 — Corrections rapides et architecturales
- ✅ **COMPLÉTÉ** : Nettoyage des dépendances, variables inutilisées, console.logs, et migration des états dérivés.

### Sprint 3 — Finalisation des désactivations Zero-Lag
- [ ] Poursuivre la migration des event-handlers vers le système de Refs mutables pour éliminer les derniers re-renders résiduels.

---

## 🎯 4. PROCHAINES CIBLES STRATÉGIQUES (Features)

### Option A — Persistance Cloud des Tracés
- **État actuel :** `localStorage` uniquement. Perte si cache vidé ou changement de PC.
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

---

## ⚠️ 5. ANGLES MORTS CONNUS & DETTE TECHNIQUE (Torvalds Speak)
- **Fichiers Fantômes :** `components/overlays/PriceAxisOverlay.tsx` et `lint-report.txt` sont vides. Ils polluent l'arborescence et doivent être supprimés ou implémentés.
- **Intraday hors marché :** Le moteur `brvm-collect` ne gère pas les jours fériés BRVM → à documenter dans `brvm-intraday`.

---
*Généré par **AXIOM-ENGINE 1000.4 (DEUS-ULTIMA)** — Session #88 — 2026-04-20*






=============


[TORVALDS_REALITY_CHECK]
▸ TORVALDS SPEAK
COMPLÉTUDE FEUILLE DE ROUTE : 100% (Analyse de la Zone 2 effectuée).
COMPLÉTUDE PRODUCTION RÉELLE : 0% (Sécurité compromise par l'absence du Gardien).
🔴 [VULNÉRABILITÉ FATALE : Relais Aveugle sans Gardien]
→ Pourquoi ça va poser problème en prod : Le fichier route.ts dit explicitement : "Ce proxy fait confiance au middleware.ts". Sans ce middleware, n'importe qui peut forger une requête vers /api/proxy/1/ et atteindre votre backend Django sans token valide.
→ Ce qu'il faudrait faire : Fournir le code du middleware pour audit, ou réintégrer une vérification JWT minimale dans le proxy en attendant.


🔴 [Risque d'OOM sur le Rate Limiter In-Memory]
→ Pourquoi ça va poser problème en prod : Dans rate-limiter.ts, MAX_MAP_SIZE = 50000. Sur Vercel Edge (limité à 128MB de RAM), une Map de 50 000 objets complexes va crasher l'isolate (OOM) lors d'un DDoS.
→ Ce qu'il faudrait faire : Réduire MAX_MAP_SIZE à 10 000 et implémenter un LRU Cache au lieu d'une Map standard.




==============



### ─────────────────────────────────────────────────────────────────────────────────
### PASSE 3 — ZONES D'OMBRE & FICHIERS MANQUANTS
### ─────────────────────────────────────────────────────────────────────────────────
**[A] ZONES D'OMBRE INTERNES**
→ **Edge Runtime vs Node.js :** Le fichier `route.ts` utilise `undici` et `crypto.randomUUID()`. Si cette route est déployée sur le Edge Runtime de Vercel, `undici` n'est pas supporté nativement de la même manière que sur Node.js. L'absence de `export const runtime = 'nodejs'` ou `'edge'` laisse une ambiguïté sur l'environnement d'exécution cible.
→ **Cache Poisoning :** La clé de cache `proxy-cache:${requestPath}` inclut les query parameters. Un attaquant peut saturer Redis en ajoutant `?rnd=1`, `?rnd=2` à l'infini.
