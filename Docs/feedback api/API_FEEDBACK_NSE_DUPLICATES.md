# Feedback API — doublons dans le catalogue NSE

**Statut :** anomalie backend à corriger par l’équipe API  
**Vérification :** 18 août 2026  
**API :** http://a21mldhl1xhs0dumr7kfo1fg.85.190.99.121.sslip.io/  
**Route :** `GET /api/v1/actions/`

## Résumé

Le modal NSE affiche **63 titres uniques**, mais la réponse API contient **69
enregistrements NSE**. La différence ne vient pas du frontend : six lignes sont
retournées deux fois avec le même `id` et le même ticker.

Le frontend déduplique volontairement les résultats par ticker avant affichage.
Le compteur `63 titres` est donc le nombre de titres uniques réellement
présentables, et non le nombre brut de lignes reçues.

## Reproduction

```text
GET /api/v1/actions/?format=json&bourse=NSE&page_size=100&page=1
GET /api/v1/actions/?format=json&bourse=NSE&page_size=100&page=2
GET /api/v1/actions/?format=json&bourse=NSE&page_size=100&page=3
GET /api/v1/actions/?format=json&bourse=NSE&page_size=100&page=4
GET /api/v1/actions/?format=json&bourse=NSE&page_size=100&page=5
GET /api/v1/actions/?format=json&bourse=NSE&page_size=100&page=6
GET /api/v1/actions/?format=json&bourse=NSE&page_size=100&page=7
```

Réponse observée :

```text
HTTP 200
count: 635
total_pages: 7
page_size: 100
```

Le paramètre `bourse=NSE` n’est pas appliqué côté serveur : les 635 actions
multi-bourses sont retournées, puis le frontend filtre
`action.bourse.ticker === "NSE"` localement.

## Résultat du comptage

| Étape | Nombre |
|---|---:|
| Actions retournées par l’API | 635 |
| Lignes dont `action.bourse.ticker` vaut `NSE` | 69 |
| Tickers NSE distincts | 63 |
| Doublons exacts | 6 |

## Doublons exacts détectés

Chaque entrée ci-dessous apparaît deux fois avec le même identifiant API.

| Ticker | Société | ID API |
|---|---|---|
| `CENTUM_INVESTMENT` | CENTUM INVESTMENT | `01ccc976-75ef-4348-b328-6174413a8bd7` |
| `KURWITU_VENTURES_LTD` | KURWITU VENTURES LTD | `1492cc3d-9448-4b6a-972e-80c70958b675` |
| `UNGAR_GROUP_LTD` | UNGAR GROUP LTD | `1996e2b7-f017-4406-b7f4-e429a8bdf11e` |
| `NATION_MEDIA_GROUP` | NATION MEDIA GROUP | `1cdb6202-03c3-4c60-b4ff-b142eaa129fd` |
| `CROWN_PAINTS_KENYA` | CROWN PAINTS KENYA | `1eec4c76-93fd-470c-b16b-3545888cdb9a` |
| `TRANS-CENTURY_LTD` | TRANS-CENTURY LTD | `2305235e-d711-4a1b-a68e-0c12a77e7b97` |

## Impact

- Le catalogue brut NSE est gonflé de six lignes.
- Toute consommation backend qui compte les lignes sans déduplication peut
  afficher un total incorrect.
- Une pagination ou un export peut contenir deux fois le même titre.
- Les clients qui ne dédupliquent pas par `id` ou ticker subiront le doublon.
- Le frontend masque actuellement le problème, mais cela ne corrige pas la
  qualité de la source API.

## Correction backend demandée

1. Corriger la source d’import NSE afin qu’un même titre ne soit pas inséré
   deux fois avec le même identifiant.
2. Ajouter une contrainte d’unicité adaptée au modèle métier, au minimum sur
   l’identifiant source ; si nécessaire, compléter par `(bourse, ticker)`.
3. Nettoyer les six doublons déjà présents via une migration réversible ou un
   script d’assainissement contrôlé.
4. Rendre effectif le filtre canonique `bourse=NSE` sur `GET /actions/`, ou
   documenter explicitement si le filtrage doit rester client-side.
5. Recalculer `count`, `total_pages` et `data` après filtrage serveur.
6. Ajouter un test API qui vérifie qu’une page NSE ne contient jamais deux fois
   le même `id` ou le même ticker.

## Critères d’acceptation

Après correction, cette requête doit retourner uniquement les titres NSE :

```text
GET /api/v1/actions/?format=json&bourse=NSE&page_size=100
```

Résultat attendu :

```text
HTTP 200
count: 63
total_pages: 1
data: 63 éléments
```

Et les invariants suivants doivent être vrais :

```text
Tous les éléments ont action.bourse.ticker == "NSE"
Tous les IDs sont uniques
Tous les tickers sont uniques
count == longueur(data) lorsque page_size >= count
```

## Comportement frontend actuel

Le frontend conserve une protection défensive : il filtre localement par
`action.bourse.ticker`, puis déduplique les titres par ticker avant de calculer
le compteur affiché. Cette protection doit rester en place même après la
correction backend afin de résister à une éventuelle régression d’import.

## Verdict

```text
API_NSE_RAW_RECORDS       = 69
API_NSE_UNIQUE_TICKERS    = 63
FRONTEND_DISPLAYED_TITLES = 63
BACKEND_DUPLICATES        = 6
SERVER_SIDE_MARKET_FILTER = NON_EFFECTIF
```


## Preuve API-FIRST — code du store et CDP Chrome

Chemin vérifié : `core/infra/store/api/action.api.ts` → `core/infra/repositories/action.repository.impl.ts` → `components/design-system/commons/TickerSelectorModal/TickerSelectorModal.tsx`. Le modal filtre localement `action.bourse.ticker` puis déduplique les tickers dans `rebuildCatalog()`.

Sondage exécuté le 18 août 2026 depuis Chrome via CDP :

| Route | HTTP | count | total_pages | data_length | Marchés présents |
|---|---:|---:|---:|---:|---|
| `actions/?format=json&bourse=NSE&page_size=100&page=1` | 200 | 635 | 7 | 100 | JSE, NSE, GSE, NGX, BRVM, CSE |
| `actions/?format=json&bourse=JSE&page_size=100&page=1` | 200 | 635 | 7 | 100 | JSE, NSE, GSE, NGX, BRVM, CSE |
| `actions/?format=json&page_size=100&page=1` | 200 | 635 | 7 | 100 | JSE, NSE, GSE, NGX, BRVM, CSE |

Classification : `API_FIELD_PRESENT` pour `action.bourse.ticker` ; `API_FIELD_DERIVED` pour le compteur NSE unique. Le champ marché est bien fourni. L’anomalie confirmée concerne uniquement le filtrage serveur : les trois réponses CDP sont identiques malgré des paramètres différents. Le DOM du modal affiche `63 titres`, correspondant aux 63 tickers NSE uniques après filtrage et déduplication frontend.
