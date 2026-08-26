# Feedback API — Dividends

Date d'observation : 2026-08-13
Surface : Technical Analysis — sidebar droit — sous-section « Dividends »
Titre testé : SICOR_CI
ISIN : CI0000000113
Action ID : 05b4ad30-3a83-451f-b91f-9133d5a968e2
Statut : anomalie API à corriger côté fournisseur

## 1. Résumé exécutif

Le frontend consomme exclusivement l'API officielle via le store et le repository existants. Il transmet :

  action_ticker=SICOR_CI

L'API répond HTTP 200, mais ignore ce filtre et renvoie une collection globale de dividendes appartenant à plusieurs titres.

Conséquences :

- données financières étrangères au titre courant ;
- impossibilité d'afficher la collection sans risque de mélange ;
- jusqu'à 118 pages à parcourir pour retrouver une ligne ;
- réponses HTTP 429 pendant les balayages ;
- panneau frontend indisponible si la page reçue ne contient pas SICOR_CI.

Aucun fallback financier local n'est utilisé.

## 2. Route et requête observées

Cible API via Chrome DevTools :

  http://a21mldhl1xhs0dumr7kfo1fg.85.190.99.121.sslip.io/api/v1/dividends/

Requête applicative :

  GET /api/proxy/10/api/v1/dividends/?action_ticker=SICOR_CI&page_size=100

Après normalisation du proxy :

  GET /api/proxy/10/api/v1/dividends?action_ticker=SICOR_CI&page_size=100

Réponse :

  HTTP 200
  count: 11792
  total_pages: 118
  current_page: 1
  page_size: 100

## 3. Réponse réelle : filtre ignoré

La première page demandée pour SICOR_CI contient notamment :

  action_ticker: FRONTIER_TRANSPORT
  action_ticker: CENTUM_INVESTMENT

Exemples observés :

  FRONTIER_TRANSPORT — amount 25.9 — pay_date 2024-12-17
  FRONTIER_TRANSPORT — amount 24.2 — pay_date 2024-06-18
  CENTUM_INVESTMENT — amount 0.32 — pay_date 2025-12-19

Invariant violé :

  Pour toute ligne r de data :
  r.action_ticker == "SICOR_CI"

Le défaut est serveur : le mapping frontend ne peut pas corriger une collection non filtrée sans rechercher toutes les pages.

## 4. Preuve que les données SICOR existent

Un balayage borné a trouvé au moins trois lignes SICOR_CI en page 2 :

  page: 2
  pay_date: 2000-09-25
  amount: 1075.803106

  page: 2
  pay_date: 1999-10-22
  amount: 504.54549

  page: 2
  pay_date: 1999-01-12
  amount: 1009.09098

Cela prouve que les données existent dans la collection API. Cela ne prouve pas que trois lignes constituent l'historique complet, car le balayage a été interrompu par les limitations de débit.

## 5. Anomalie de pagination et de débit

L'API annonce 118 pages. Lors d'un balayage CDP :

- plusieurs pages répondent HTTP 200 ;
- le fournisseur finit par répondre HTTP 429 Too Many Requests ;
- une stratégie frontend limitée à deux requêtes concurrentes a également atteint HTTP 429 autour des pages 89 et 90.

La pagination globale côté consommateur n'est pas acceptable pour une ouverture normale du sidebar :

- latence excessive ;
- charge inutile sur l'API ;
- risque de saturation ;
- résultat non déterministe selon la limite de débit ;
- impossibilité de garantir l'historique complet.

## 6. Paramètres alternatifs testés

Les paramètres suivants n'ont pas produit de filtrage effectif :

  action=<action ID>
  action_id=<action ID>
  action__id=<action ID>
  search=SICOR_CI
  ticker=SICOR_CI
  action__ticker=SICOR_CI
  action.ticker=SICOR_CI
  action_ticker__exact=SICOR_CI
  action_ticker__icontains=SICOR_CI

Ils renvoient la même collection globale ou le même count 11792. Aucun ne constitue un contrat exploitable par le frontend.

## 7. Transport frontend actuel

Le flux respecte API-first :

  API officielle
    -> core/infra/store/api/dividend.api.ts
       -> endpoint getAllDividends
    -> core/infra/repositories/dividend.repository.impl.ts
       -> getAllDividends(params)
    -> components/technical-analysis/components/sidebar/data/sidebarDataPortAdapter.ts
       -> action_ticker + page_size
       -> contrôle action_ticker
    -> BRVMFundamentals.dividends
    -> DividendsPanel / DividendHistoryModal

Le composant UI n'appelle pas directement l'API distante.

## 8. Protection actuelle côté consommateur

Le frontend :

- réutilise la route et le repository existants ;
- ne crée aucune route backend ;
- ne complète aucune donnée localement ;
- rejette toute ligne étrangère ou dépourvue de ticker ;
- n'affiche aucune ligne FRONTIER_TRANSPORT ou CENTUM_INVESTMENT pour SICOR_CI ;
- rend le bloc indisponible si aucune ligne SICOR valide n'est présente.

Cette protection est obligatoire : afficher une ligne d'un autre titre serait une erreur financière.

## 9. Correction API attendue

Pour :

  GET /api/v1/dividends/?action_ticker=SICOR_CI&page_size=100

l'API doit :

1. appliquer effectivement le filtre action_ticker ;
2. retourner uniquement les lignes SICOR_CI ;
3. calculer count sur le résultat filtré ;
4. calculer total_pages sur le résultat filtré ;
5. générer links.next et links.previous sur le résultat filtré ;
6. conserver action_ticker dans chaque élément ;
7. retourner une collection vide avec HTTP 200 si aucun dividende n'existe ;
8. retourner une erreur documentée pour un paramètre invalide ;
9. documenter le nom exact du filtre ;
10. fournir une pagination filtrée qui ne nécessite pas 118 appels globaux.

Réponse attendue conceptuellement :

  {
    "count": <nombre de lignes SICOR_CI>,
    "total_pages": <pagination filtrée>,
    "data": [
      {
        "action_ticker": "SICOR_CI",
        "pay_date": "...",
        "amount": 1075.803106
      }
    ]
  }

Invariant obligatoire :

  Pour toute ligne r de data :
  r.action_ticker == valeur action_ticker demandée

## 10. Critères de recette backend

  GET /api/v1/dividends/?action_ticker=SICOR_CI&page_size=100
    -> HTTP 200
    -> toutes les lignes ont action_ticker=SICOR_CI
    -> count ne vaut plus 11792
    -> total_pages correspond aux seules lignes SICOR_CI

  GET /api/v1/dividends/?action_ticker=FRONTIER_TRANSPORT&page_size=100
    -> aucune ligne SICOR_CI

  GET /api/v1/dividends/?action_ticker=SICOR_CI&page=2&page_size=100
    -> page 2 appartient à la collection filtrée SICOR_CI
    -> aucune ligne d'un autre ticker

  GET /api/v1/dividends/?action_ticker=UNKNOWN_TICKER&page_size=100
    -> collection vide ou erreur documentée
    -> jamais de collection globale non filtrée

La clé de cache doit inclure action_ticker et les paramètres de pagination.

## 11. Impact frontend après correction

Aucune nouvelle route frontend ne sera nécessaire.

Le frontend pourra conserver :

  getAllDividends({
    action_ticker: ticker,
    page_size: 100,
  })

Le contrôle strict actuel restera actif comme défense en profondeur.

## 12. Validation frontend actuelle

Validations :

  ./node_modules/.bin/tsc --noEmit --pretty false
  -> OK

  git diff --check
  -> OK

Preuve CDP :

  route Dividends HTTP 200
  filtre action_ticker transmis par l'application
  données étrangères observées dans la réponse API
  données étrangères absentes du rendu UI
  pagination massive interrompue après apparition de HTTP 429

Conclusion :

  Le frontend respecte API-first et protège l'utilisateur.
  La correction nécessaire se situe dans le filtre et la pagination côté API
  fournisseur.