# Feedback API — données OHLCV multi-timeframes pour le graphique d’analyse technique

**Statut :** retour frontend pour l’équipe backend/API  
**Priorité :** haute — bloque le fonctionnement réel du sélecteur d’intervalle du graphique  
**Vérification :** 24 août 2026, localhost via Chrome/CDP  
**API :** http://a21mldhl1xhs0dumr7kfo1fg.85.190.99.121.sslip.io/  
**Contrat de preuve appliqué :** `Docs/API_FIRST_EVIDENCE_CONTRACT.md`

## 1. Constat fonctionnel

Le graphique d’analyse technique possède un sélecteur d’intervalle comparable à celui de TradingView. Pour que cette fonctionnalité soit réelle, le frontend doit recevoir des séries OHLCV correspondant effectivement à la granularité sélectionnée.

La route actuellement consommée est :

```text
GET /api/v1/cours
```

Le contrat backend est bien conscient de la notion de timeframe : chaque entrée peut contenir notamment :

```json
{
  "timeframe": 86400,
  "timeframe_display": "1d",
  "timestamp": "2026-04-09T00:00:00+0000",
  "open": 28800.0,
  "high": null,
  "low": null,
  "close": 28795.0,
  "volume": 3476
}
```

Le problème n’est donc pas l’absence du concept de timeframe dans l’API. Le problème observé est que les données actuellement exposées par `/cours` sont disponibles uniquement en `1D` parmi les granularités nécessaires au sélecteur du graphique.

## 2. Preuve côté frontend

Le store API utilise :

```text
core/infra/store/api/cours.api.ts
```

avec :

```text
GET cours/
```

Le repository et le hook utilisés par le graphique sont :

```text
core/infra/repositories/cours.repository.impl.ts
components/technical-analysis/hooks/MarketData/useMarketData.ts
```

Le type domain principal est :

```text
core/domain/entities/cours.entity.ts
```

Il contient notamment :

```ts
interface CoursEntity {
  timestamp: string;
  timeframe: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

Le frontend ne doit pas fabriquer localement une granularité intraday à partir de chandeliers journaliers. Une bougie `1D` ne permet pas de reconstruire fidèlement les OHLCV de `1m`, `5m`, `15m`, `1h` ou `4h`.

## 3. Vérification CDP réelle de `/cours`

Instrument vérifié pendant la session :

```text
5f2f8e3a-35f4-4c37-9493-0a8165f98eb3
```

Page applicative :

```text
http://localhost:3000/en/equity/technical-analysis
```

Route observée :

```text
GET /api/proxy/10/api/v1/cours?instrument=5f2f8e3a-35f4-4c37-9493-0a8165f98eb3&page=1&page_size=100
HTTP 200
```

Une réponse réelle contient :

```json
{
  "timeframe": 86400,
  "timeframe_display": "1d",
  "timestamp": "2026-04-09T00:00:00+0000"
}
```

Des requêtes explicites ont ensuite été exécutées via Chrome/CDP sur la même ressource.

| Timeframe demandé | Signification | Statut | Résultat observé |
|---:|---|---:|---|
| `60` | 1 minute | 200 | `count=0`, `data=[]` |
| `300` | 5 minutes | 200 | `count=0`, `data=[]` |
| `900` | 15 minutes | 200 | `count=0`, `data=[]` |
| `3600` | 1 heure | 200 | `count=0`, `data=[]` |
| `14400` | 4 heures | 200 | `count=0`, `data=[]` |
| `86400` | 1 jour | 200 | données présentes |
| `604800` | 1 semaine | 200 | `count=0`, `data=[]` |
| `2592000` | environ 1 mois | 200 | `count=0`, `data=[]` |

Pour l’instrument testé, `timeframe=86400` retourne notamment :

```text
count = 6107
```

La vérification a également été répétée sur la ressource `/cours` sans filtrer par instrument. Résultat global observé :

```text
60       -> count = 0
300      -> count = 0
900      -> count = 0
3600     -> count = 0
14400    -> count = 0
86400    -> count = 501648
604800   -> count = 0
2592000  -> count = 0
```

Cette deuxième vérification est importante : l’absence de données intraday ne semble pas limitée au seul instrument testé. Dans la ressource `/cours` observée pendant cette vérification, les données disponibles correspondent exclusivement au timeframe journalier `86400` parmi les valeurs testées.

## 4. Format du paramètre `timeframe`

L’API accepte le filtre sous forme numérique en secondes.

Exemple valide :

```text
?timeframe=3600
```

La requête est acceptée mais retourne actuellement :

```json
{
  "count": 0,
  "data": []
}
```

En revanche :

```text
?timeframe=1h
```

retourne `HTTP 400` avec :

```json
{
  "timeframe": [
    "Select a valid choice. 1h is not one of the available choices."
  ]
}
```

Le contrat backend attend donc bien une valeur numérique correspondant à la durée du timeframe.

## 5. Impact frontend actuel

Le frontend peut afficher honnêtement `1D`, car les données OHLCV journalières existent réellement.

En revanche, activer aujourd’hui un sélecteur complet de type :

```text
1m | 5m | 15m | 1h | 4h | 1D | 1W | 1M
```

sans évolution backend produirait une fonctionnalité partiellement fictive ou vide.

Les granularités intraday ne peuvent pas être dérivées correctement à partir de `1D`. Toute reconstruction locale de `1m`, `5m`, `15m`, `1h` ou `4h` à partir des seules bougies journalières inventerait l’ordre réel des prix, les plus hauts/bas intraday et la distribution des volumes.

Pour `1W` et `1M`, une agrégation locale à partir du `1D` est mathématiquement possible, mais elle devrait être explicitement considérée comme une donnée dérivée et non comme une série brute fournie par l’API. Le besoin produit privilégié reste que le backend expose les timeframes réellement supportés de manière claire et documentée.

## 6. Classification selon `API_FIRST_EVIDENCE_CONTRACT.md`

### `timeframe`

```text
API_FIELD_PRESENT
```

Le champ est présent dans la réponse réelle et typé côté frontend.

### `timeframe_display`

```text
API_FIELD_PRESENT_UNTYPED
```

Le champ est présent dans la réponse CDP (`"1d"`) mais n’est pas actuellement déclaré dans `CoursEntity`.

### Granularité `1D`

```text
API_FIELD_PRESENT
```

Des données OHLCV réelles existent pour `timeframe=86400`.

### Granularités `1m`, `5m`, `15m`, `1h`, `4h`, `1W`, `1M`

```text
UI_UNAVAILABLE
```

La route est réelle, le filtre est accepté sous forme numérique, mais les réponses observées sont vides pour ces valeurs.

## 7. Demande backend

Merci d’étudier l’alimentation réelle de `/cours` pour les granularités nécessaires au graphique d’analyse technique.

Besoin cible recommandé :

```text
60       = 1m
300      = 5m
900      = 15m
3600     = 1h
14400    = 4h
86400    = 1D
604800   = 1W
2592000  = 1M, si cette convention est retenue par le backend
```

Pour chaque timeframe effectivement supporté, la réponse devrait exposer des chandeliers OHLCV cohérents :

```json
{
  "instrument": "<id>",
  "timeframe": 3600,
  "timeframe_display": "1h",
  "timestamp": "<timestamp début/fin de bougie documenté>",
  "open": 0.0,
  "high": 0.0,
  "low": 0.0,
  "close": 0.0,
  "volume": 0
}
```

Les valeurs de cet exemple sont uniquement contractuelles ; elles ne constituent pas des valeurs de marché attendues.

## 8. Points à documenter côté backend

Le contrat devrait préciser :

- la liste officielle des timeframes supportés ;
- l’unité exacte du paramètre `timeframe` ;
- la correspondance entre `timeframe` et `timeframe_display` ;
- la convention temporelle des bougies : timezone, début/fin de période et timestamp retourné ;
- la source des données intraday ;
- la méthode d’agrégation éventuelle pour `1W` et `1M` ;
- la gestion des jours sans cotation et des séances incomplètes ;
- la nullabilité de `open`, `high`, `low`, `close`, `volume` ;
- le tri des données ;
- la pagination et la profondeur historique disponibles par timeframe ;
- le comportement lorsqu’un timeframe est valide mais non disponible pour un instrument ;
- les limites de rétention et de fréquence de mise à jour.

## 9. Critères d’acceptation backend

1. `GET /cours?instrument=<id>&timeframe=<valeur>` retourne uniquement des chandeliers correspondant au timeframe demandé.
2. Les timeframes annoncés comme supportés possèdent réellement des données pour les instruments concernés.
3. `timeframe` et `timeframe_display` sont cohérents dans chaque élément retourné.
4. Les bougies OHLCV sont ordonnées de manière documentée et paginables sans doublon ni trou artificiel.
5. Les données intraday sont issues d’une source marché réelle ou d’une agrégation backend documentée ; elles ne sont pas synthétisées arbitrairement.
6. Un timeframe valide mais indisponible retourne un état contractuel clair et documenté.
7. Le contrat couvre au minimum `1D` et les granularités retenues pour le sélecteur final du produit.
8. Des tests backend couvrent la sélection du timeframe, la pagination, l’absence de données et la cohérence `timeframe/timeframe_display`.
9. Une vérification réseau/CDP frontend peut confirmer la présence réelle des séries avant activation du sélecteur correspondant.

## 10. Verdict actuel

```text
TIMEFRAME_CONCEPT_API      = PRESENT
TIMEFRAME_PARAMETER        = PRESENT_NUMERIC_SECONDS
TIMEFRAME_DISPLAY_API      = PRESENT_BUT_FRONTEND_UNTYPED
OHLCV_1D                   = AVAILABLE
OHLCV_1M                   = UNAVAILABLE
OHLCV_5M                   = UNAVAILABLE
OHLCV_15M                  = UNAVAILABLE
OHLCV_1H                   = UNAVAILABLE
OHLCV_4H                   = UNAVAILABLE
OHLCV_1W                   = UNAVAILABLE
OHLCV_1MONTH               = UNAVAILABLE
INTRADAY_LOCAL_SYNTHESIS   = REFUSED
CURRENT_INTERVAL_SELECTOR  = REAL_ONLY_FOR_1D
BACKEND_ACTION_REQUIRED    = YES
```

## 11. Conclusion

La fonctionnalité de sélection d’intervalle du graphique ne doit pas être considérée comme un simple problème frontend. Le frontend dispose déjà de la route et du champ `timeframe`, mais l’API observée ne fournit actuellement des données OHLCV que pour `1D` parmi les granularités testées.

L’évolution attendue côté backend est donc principalement une évolution de disponibilité et de contrat des séries temporelles : alimenter et documenter les timeframes réellement supportés afin que le frontend puisse activer le sélecteur d’intervalle sans simulation, fallback fictif ni reconstruction intraday non fiable.
