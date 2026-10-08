# Undo/Redo — couverture vérifiée et limites (2026-10-08)

| Domaine | Couverture code | Preuve E2E | Suite |
|---|---|---|---|
| Outils Keep/Magnet/Snap | snapshots + restore | Keep drawing Undo/Redo, reload PASS | autres outils à tester |
| Dessins, propriétés, déplacement | snapshots et replaceDrawings | pas exhaustif | tests par outil |
| Indicateurs, Bollinger, comparaisons, apparence | Redux historique | RSI 9 activé → journal rsi=true → Undo rsi=false PASS ; autres familles non exhaustives | tests par famille |
| Multigraphique | snapshot hors viewport | single → two_horizontal → Undo → Redo PASS | tester presets |
| Type de graphique | chartConfig capturé | Chrome PASS : Candles → Line → Undo Candles → Redo Line → Undo Candles | autres types à tester |
| Symbole / intervalle / plage | état capturé | pas exhaustif | test navigateur |
| Redo après nouvelle mutation | troncature code | Chrome PASS : Line → Undo Candles → modifier Volume ; ancienne branche Redo supprimée (index 2/3) → Undo rétablit Candles + volume | autres combinaisons à tester |
| Recharge de page | IndexedDB | Keep drawing + curseur PASS | vérifier analyse A → B → A |
| Analyses enregistrées | scope activeSavedAnalysisId, refus de replay obsolète après changement explicite | Chrome A → B → A → B PASS : A Candles, B Line, journal B distinct ; deux analyses QA supprimées et journal QA B retiré | autres configurations sauvegardées à tester |
| Corruption | contrôle forme/index et validation snapshots | entrée QA index invalide rejetée; nettoyée | test intégration complet |
| Transaction interrompue | IDB tx.oncomplete, onabort | transaction QA avortée, état précédent intact PASS | pas de test de quota |
| Deux connexions simultanées | compare-and-swap par révision atomique dans IndexedDB | QA deux connexions : 1 succès, 1 conflit rejeté, révision finale 2 PASS | un onglet obsolète conserve son Undo mémoire ; pas de fusion automatique |
| Quota | catch, Undo mémoire conservé | Chrome : QuotaExceededError synthétique intercepté sur un vrai put IndexedDB (1 injection), Undo fonctionnel après échec, journal cohérent, patch restauré | quota physique disque saturé non testé |
| Pan/zoom et cotations | exclus volontairement | non applicable | éviter churn |

Le journal `finform-ta-undo-history` est borné à 100 états et à un budget approximatif de fingerprint. Les écritures concurrentes sont désormais rejetées par révision si un autre onglet a modifié la même analyse : cette sécurité n'est pas une synchronisation ni une fusion multi-onglets. Ne jamais annoncer une recette exhaustive sans parcours observés. Tests globaux, lint, build Node 22 et diagnostics IDE étaient verts avant cet audit. Aucun commit/push ni mutation GSM.
