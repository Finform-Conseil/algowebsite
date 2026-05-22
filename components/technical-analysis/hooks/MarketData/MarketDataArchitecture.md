# Architecture des Donnees de Marche - Technical Analysis

Revision verifiee le 2026-05-20.

Ce document decrit le flux reel utilise par la page
`/equity/technical-analysis`, notamment la zone du graphique principal et la
sidebar droite. Il est ecrit pour qu'un autre LLM, un backend engineer ou un
fournisseur de donnees puisse comprendre exactement ce qui existe, ce qui est
simule, et ce qui manque.

## 1. Synthese Operationnelle

La route `app/equity/technical-analysis/page.tsx` monte le composant client
`components/technical-analysis/TechnicalAnalysis.tsx`.

Le graphique principal utilise aujourd'hui principalement des donnees
historiques journalieres OHLCV chargees depuis un CSV public GitHub via le
proxy Next.js. La sidebar droite combine ces memes donnees chart, un snapshot
live quand il est disponible, des metadonnees statiques locales, et plusieurs
routes Next.js qui scrappent `brvm.org`.

Point critique : le code contient un hook et une route pour l'intraday, mais
ils ne sont pas branches a la page visible aujourd'hui. La route de collecte
mentionnee par le hook (`/api/market-data/brvm-collect`) n'existe pas dans le
projet actuel. Le systeme affiche donc de l'historique de marche et un
snapshot live, mais pas encore un vrai flux de seance intraday branche au
chart principal.

Attention : ce constat ne signifie pas qu'il faut automatiquement reconstruire
une route de collecte maison. Avant de creer une nouvelle "roue" Redis/collect,
il faut verifier s'il existe deja une API officielle, commerciale, open data ou
communautaire capable de fournir le flux de seance BRVM. La construction interne
ne doit venir qu'apres cette verification.

## 2. Reponse Courte Aux 6 Questions Data

### 2.1 Source des donnees

Sources utilisees :

1. Historique daily OHLCV :
   `Fredysessie/brvm-data-public` via
   `/api/proxy/9/Fredysessie/brvm-data-public/main/data/{TICKER}/{TICKER}.daily.csv`.

2. Snapshot indicator CSV :
   `Fredysessie/brvm-data-public` via
   `/api/proxy/9/Fredysessie/brvm-data-public/main/data/{TICKER}/{TICKER}.indicator.csv`.

3. Scraping BRVM officiel :
   routes Next.js sous `/api/market-data/*`, principalement `brvm-live`,
   `brvm-live-capitalisation`, `brvm-fundamentals`, `brvm-news`, `brvm-bonds`
   et `indices`.

4. Metadonnees statiques internes :
   `core/data/brvm-securities.ts` pour le nom, secteur, pays, logo, P/E,
   rendement YTD, revenu T12M, market cap fallback, ISIN et FIGI.

Pas de fichier Excel ou PDF directement branche sur cet ecran. Pas de base
interne pour les bougies daily visibles. Redis/Upstash est prevu pour
l'intraday, mais le flux n'est pas actif sur la page actuelle.

### 2.2 Frequence de mise a jour

| Donnee | Frequence actuelle | Cache / polling |
| --- | --- | --- |
| CSV daily action | En pratique une ligne par jour | Fetch initial + polling frontend 5 min |
| CSV indicator | Selon mise a jour GitHub externe | Fallback si scraper live echoue |
| Scraper `brvm-live` | A la requete | Cache serveur 15 min, stale 24h |
| Scraper capitalisation | A la requete | Cache serveur 30 min, stale 24h |
| News BRVM | A la requete | Frontend 30 min, serveur 1h |
| Fondamentaux | Au changement de ticker | Cache HTTP 24h |
| Intraday Redis | Route existe | Non branche, retourne `[]` sans snapshots |

### 2.3 Type de donnees disponibles

Donnees disponibles pour le chart principal :

- `time`
- `open`
- `high`
- `low`
- `close`
- `volume`

Donnees disponibles pour la sidebar :

- prix live ou dernier close
- variation et variation pourcentage
- volume courant
- volume moyen 30 periodes
- capitalisation globale et nombre de titres, si scraper capitalisation OK
- fondamentaux scrappes : earnings, revenues, dividends, profile, website,
  employees
- metadonnees statiques : secteur, pays, P/E, return YTD, revenue T12M,
  market cap fallback

Donnees non disponibles aujourd'hui sur l'ecran visible :

- transactions intraday reelles
- carnet d'ordres
- bid/ask depth
- tick-by-tick
- flux websocket
- vraies bougies 1m/5m/15m branchees au renderer principal

### 2.4 Backend

Le backend utilise par cet ecran est Next.js App Router. Les routes Django
mentionnees dans certains commentaires du proxy ne sont pas le flux effectif
du chart BRVM visible.

Routes Next.js impliquees :

- `app/api/proxy/[...path]/route.ts`
- `app/api/market-data/brvm-live/route.ts`
- `app/api/market-data/brvm-live-capitalisation/route.ts`
- `app/api/market-data/brvm-fundamentals/route.ts`
- `app/api/market-data/brvm-news/route.ts`
- `app/api/market-data/brvm-bonds/route.ts`
- `app/api/market-data/indices/route.ts`
- `app/api/market-data/brvm-intraday/route.ts`

La route intraday lit Upstash Redis si `UPSTASH_REDIS_REST_URL` et
`UPSTASH_REDIS_REST_TOKEN` existent. Elle retourne `[]` si Redis est absent,
vide ou si aucune cle snapshot n'est trouvee.

### 2.5 Frontend

Le frontend lit directement les routes API Next.js. Il ne lit pas directement
une API Django pour le chart BRVM actuel.

Les bougies daily sont deja donnees par le CSV source puis parsees cote
frontend par `parseBRVMCSV()`. ECharts recoit ensuite :

- `dates`: axe X
- `values`: `[open, close, low, high]`
- `volumes`: `[index, volume, direction]`

Les indicateurs techniques sont calcules cote frontend dans un worker via
`useEChartsRenderer`.

### 2.6 Exemple de payload actuel

Dernieres lignes reelles du CSV daily BOAB observees via localhost :

```csv
Date,Open,High,Low,Close,Volume
2026-05-12,9405,9445,9405,9420,11117
2026-05-13,9420,9420,9405,9410,2844
2026-05-15,9415,9420,9320,9400,2830
2026-05-18,9400,9400,9320,9400,4370
2026-05-19,9400,9400,9365,9400,4953
```

Equivalent `ChartDataPoint` apres parsing :

```json
{
  "time": "2026-05-19",
  "open": 9400,
  "high": 9400,
  "low": 9365,
  "close": 9400,
  "volume": 4953
}
```

Snapshot indicator BOAB observe :

```csv
Ticker,URL_Ticker,Cours_Actuel,Variation_Cours,Volume_Titres,Volume__,Ouverture,Plus_Haut,Plus_Bas,Cloture_Veille,Beta_1_An,RSI,Capital_Echange,Valorisation
BOAB,BOAB.bj,9400.0,"0,00%",1906.0,17916400.0,9420.0,9420.0,9400.0,9400.0,0.17,83.2,0.0,381 274 M
```

Capitalisation BOAB observee :

```json
{
  "symbol": "BOAB",
  "name": "BANK OF AFRICA BENIN",
  "sharesCount": 40561048,
  "lastPrice": 9415,
  "floatingMarketCap": 86215.108,
  "globalMarketCap": 381882.26692,
  "source": "BRVM_CAPITALIZATION",
  "cacheStatus": "HIT"
}
```

Etat live observe :

```json
{
  "error": "Ticker BOAB not found"
}
```

Etat intraday observe :

```json
[]
```

## 3. Cartographie Des Fichiers

| Fichier | Role |
| --- | --- |
| `app/equity/technical-analysis/page.tsx` | Route client qui rend `TechnicalAnalysis` |
| `components/technical-analysis/TechnicalAnalysis.tsx` | Orchestration UI chart, sidebar, toolbar, layout |
| `components/technical-analysis/context/TechnicalAnalysisProviders.tsx` | Initialise ticker, devise, refs chart, market data |
| `components/technical-analysis/hooks/MarketData/useMarketData.ts` | Charge daily CSV, enrichit snapshot live, expose chartData |
| `components/technical-analysis/hooks/useEChartsRenderer.ts` | Transforme chartData en series ECharts et calcule indicateurs |
| `components/technical-analysis/components/sidebar/TechnicalAnalysisSidebar.tsx` | Affiche watchlist, stats, news, fondamentaux, bonds, indices |
| `components/technical-analysis/hooks/MarketData/useIntradayData.ts` | Hook intraday prevu, non importe par la page actuelle |
| `app/api/market-data/brvm-intraday/route.ts` | Agregateur Redis prevu pour bougies intraday |
| `core/data/brvm-securities.ts` | Source statique locale pour les titres BRVM |
| `shared/utils/resilient-scraper.ts` | Scraping resilient avec cache L1, Redis, SWR et circuit breaker |

## 4. Flux Du Graphique Principal

### 4.1 Initialisation

`TechnicalAnalysisProviderTree` initialise :

- ticker initial : `BOAB`
- devise initiale : `XOF`
- mode data Redux par defaut : `real`

`MarketDataProvider` appelle :

```ts
useMarketData(dataMode, selectedTicker?.ticker)
```

### 4.2 Chargement daily

Pour un ticker `BOAB`, le hook construit :

```txt
/api/proxy/9/Fredysessie/brvm-data-public/main/data/BOAB/BOAB.daily.csv
```

Le CSV est parse par `parseBRVMCSV()` :

- detection du separateur `;` ou `,`
- detection colonnes date/open/high/low/close/volume
- support des formats francais `DD/MM/YYYY`
- conversion des virgules decimales
- filtrage des points invalides
- tri chronologique

Le resultat est stocke dans `chartData` et, au chargement initial, dans Redux
via `updateMarketData({ symbol, data })`.

### 4.3 Enrichissement snapshot

Apres le daily, le hook lance en arriere-plan :

```txt
/api/market-data/brvm-live?ticker=BOAB
/api/market-data/brvm-live-capitalisation?ticker=BOAB
```

Si `brvm-live` echoue ou ne trouve pas le ticker, le hook tente :

```txt
/api/proxy/9/Fredysessie/brvm-data-public/main/data/BOAB/BOAB.indicator.csv
```

Le snapshot final est stocke dans Redux via :

```ts
updateMarketSnapshot({ symbol, snapshot })
```

### 4.4 Rendering ECharts

`useEChartsRenderer` recoit `chartState.displayChartData`, puis extrait :

```ts
dates.push(item.time)
values.push([item.open, item.close, item.low, item.high])
volumes.push([i, item.volume, item.close > item.open ? 1 : -1])
```

La serie principale est :

- `candlestick` si `chartConfig.chartType === "candlestick"`
- `line` sinon

Le panneau volume est une serie `bar` separee.

## 5. Flux De La Sidebar Droite

La sidebar recoit ses props depuis `ConnectedSidebar` dans
`TechnicalAnalysis.tsx`.

Elle combine :

1. `security`
   Donnees statiques de `BRVM_SECURITIES`.

2. `chartData`
   Historique daily du hook `useMarketData`.

3. `liveSnapshot`
   Snapshot Redux du prix, variation, volume, open/high/low/prevClose et
   capitalisation enrichie.

4. `fundamentals`
   Donnees scrappees par `/api/market-data/brvm-fundamentals`.

5. `news`
   Donnees scrappees par `/api/market-data/brvm-news`.

6. `indices`
   Donnees scrappees par `/api/market-data/indices`, seulement quand le
   panneau indices est ouvert.

7. `bonds`
   Donnees scrappees par `/api/market-data/brvm-bonds`.

La section watchlist de la capture utilise principalement :

- `security.name`
- `security.logoUrl`
- `livePrice`
- `liveChange`
- `liveChangePercent`
- `lastUpdate`
- `liveVolume`
- `security.sector`
- `security.country`

La section statistiques cles utilise :

- `displayReturnYTD = liveReturnYTD ?? security.returnYTD`
- `displayPeRatio = livePeRatio ?? security.peRatio`
- `currentVolume`
- `avgVolume`
- `financialMetrics.calculatedYield` ou `security.revenueT12M`
- `displayMarketCap = liveMarketCap ?? security.marketCap`

## 6. Backend Next.js Et Scraping

### 6.1 Proxy GitHub / API externe

`/api/proxy/[...path]` lit l'identifiant d'API dans le premier segment de
chemin. Pour les donnees BRVM GitHub, l'identifiant utilise est `9`, donc
`API_TARGET_9` doit pointer vers la base externe attendue.

Le proxy ajoute :

- sanitization de chemin
- rate limit optionnel
- cache optionnel
- circuit breaker
- retry pour GET/HEAD
- headers securises

### 6.2 Scraper resilient

`fetchWithResilience()` fournit :

- cache L1 memoire 60 secondes
- cache Redis si disponible
- stale-while-revalidate
- circuit breaker pour `brvm.org`
- timeouts undici
- fallback stale quand la source BRVM ralentit

Ce mecanisme protege les routes :

- `brvm-live`
- `brvm-live-capitalisation`
- `brvm-fundamentals`
- `brvm-news`
- `brvm-bonds`
- `indices`

## 7. Etat Exact De L'Intraday

### 7.1 Ce qui existe

Le projet contient :

- `components/technical-analysis/hooks/MarketData/useIntradayData.ts`
- `app/api/market-data/brvm-intraday/route.ts`

Le hook prevoyait :

1. collecter toutes les minutes via `brvm-live?ticker=ALL`
2. poster les snapshots vers `/api/market-data/brvm-collect`
3. relire les bougies via `/api/market-data/brvm-intraday`

La route `brvm-intraday` sait :

- lire des snapshots Redis
- filtrer et trier chronologiquement
- agreger en timeframes `5m`, `15m`, `30m`, `1H`, `4H`
- retourner des bougies OHLCV synthetiques

### 7.2 Ce qui n'est pas actif

Verification 2026-05-20 :

- aucun import de `useIntradayData` dans `TechnicalAnalysis.tsx`
- aucune route `app/api/market-data/brvm-collect/route.ts`
- `/api/market-data/brvm-intraday?ticker=BOAB&timeframe=5m` retourne `[]`

Conclusion : l'intraday est une architecture prevue, pas le flux actif de
l'ecran visible. Le deficit actuel est bien un manque de flux de seance.

## 8. Ce Qu'il Faut Fournir Pour Un Vrai Flux De Seance

Avant d'implementer une collecte maison, il faut chercher une source existante :

- API officielle BRVM ou endpoint public non documente mais stable
- fournisseur de donnees de marche couvrant la BRVM
- dataset open data avec mises a jour de seance
- API communautaire fiable
- endpoint Django deja disponible dans un autre service interne

Si une API externe fiable existe, elle est preferable a une collecte
crowdsourced maison. La route interne `brvm-collect` ne doit etre envisagee que
si aucune source fiable ne fournit les snapshots ou bougies attendus.

Un fournisseur de donnees ou un autre backend doit fournir au minimum un
snapshot de seance regulier :

```json
{
  "symbol": "BOAB",
  "timestamp": "2026-05-20T10:05:00Z",
  "lastPrice": 9400,
  "open": 9420,
  "high": 9420,
  "low": 9400,
  "prevClose": 9400,
  "cumulativeVolume": 1906,
  "valueTraded": 17916400,
  "sessionStatus": "open"
}
```

Avec ce payload, Algoway peut construire des bougies intraday par delta de
volume :

- `open`: premier `lastPrice` du bucket
- `high`: maximum du bucket
- `low`: minimum du bucket
- `close`: dernier `lastPrice` du bucket
- `volume`: `cumulativeVolume` courant moins `cumulativeVolume` precedent

Payload ideal pour une bougie deja agregee :

```json
{
  "symbol": "BOAB",
  "timeframe": "5m",
  "time": "2026-05-20T10:05:00Z",
  "open": 9400,
  "high": 9420,
  "low": 9400,
  "close": 9415,
  "volume": 320,
  "source": "session-feed"
}
```

## 9. Schema De Decision Recommande

```mermaid
graph TD
  PAGE["/equity/technical-analysis"] --> PROVIDERS["TechnicalAnalysisProviderTree"]
  PROVIDERS --> MARKET["useMarketData(mode=real, ticker)"]
  MARKET --> DAILY["GitHub daily CSV via /api/proxy/9"]
  DAILY --> PARSE["parseBRVMCSV -> ChartDataPoint[]"]
  PARSE --> ECHARTS["useEChartsRenderer -> candlestick + volume"]
  MARKET --> LIVE["/api/market-data/brvm-live"]
  LIVE --> SNAPSHOT["Redux marketSnapshot"]
  MARKET --> INDICATOR["indicator.csv fallback"]
  INDICATOR --> SNAPSHOT
  MARKET --> CAP["/api/market-data/brvm-live-capitalisation"]
  CAP --> SNAPSHOT
  SNAPSHOT --> SIDEBAR["ConnectedSidebar"]
  PARSE --> SIDEBAR
  SIDEBAR --> FUND["/api/market-data/brvm-fundamentals"]
  SIDEBAR --> NEWS["/api/market-data/brvm-news"]
  SIDEBAR --> BONDS["/api/market-data/brvm-bonds"]
  SIDEBAR --> INDICES["/api/market-data/indices"]
  INTRA_HOOK["useIntradayData"] -. "existe mais non branche" .-> INTRA_API["/api/market-data/brvm-intraday"]
  COLLECT["/api/market-data/brvm-collect"] -. "manquant" .-> REDIS["Upstash Redis snapshots"]
  REDIS -.-> INTRA_API
```

## 10. Recommandations D'Integration

### Priorite 1 : rendre l'etat intraday honnete

L'UI ne doit pas laisser croire qu'un flux intraday est actif tant que
`useIntradayData` n'est pas branche et tant que `brvm-collect` n'existe pas.

### Priorite 2 : chercher d'abord une API existante

Ne pas recreer une infrastructure de collecte si une source fiable existe deja.
Ordre de decision :

1. Verifier les APIs officielles, commerciales, open data et communautaires BRVM.
2. Verifier si un backend interne ou Django expose deja les snapshots de seance.
3. Si une source fiable existe, adapter `useMarketData` ou un nouveau hook pour
   la consommer directement.
4. Si aucune source fiable n'existe, alors seulement implementer
   `/api/market-data/brvm-collect` ou une aggregation Redis equivalente.

### Priorite 3 : brancher les timeframes intraday au renderer

Quand `selectedTimeRange` ou un timeframe chart vaut `1m`, `5m`, `15m`, `1H`
ou `4H`, le chart doit utiliser `intradayData` au lieu de `chartData` daily.

### Priorite 4 : normaliser les tickers BRVM

`brvm-live?ticker=BOAB` retourne actuellement une erreur, alors que le daily
CSV et la capitalisation BOAB fonctionnent. Il faut aligner les symboles entre :

- tickers internes (`BOAB`)
- tickers BRVM officiels avec suffixe eventuel (`BOABC`, etc.)
- chemins GitHub (`BOAB/BOAB.daily.csv`)
- mapping `BRVM_NAME_TO_TICKER`

### Priorite 5 : marquer clairement la provenance des chiffres sidebar

Les champs `returnYTD`, `peRatio`, `revenueT12M` et certains fondamentaux
peuvent venir de donnees statiques ou d'estimations. Chaque valeur exposee a un
autre LLM devrait avoir une provenance :

```json
{
  "value": 18.45,
  "field": "returnYTD",
  "source": "core/data/brvm-securities.ts",
  "freshness": "static"
}
```

## 11. Verite Finale

Algoway possede deja une bonne base daily OHLCV, une architecture de scraping
resiliente, et un squelette intraday. Ce qui manque pour passer d'un historique
de marche a un vrai flux de seance est d'abord une decision source-of-truth :

1. verifier s'il existe deja une API ou un fournisseur de donnees de seance,
2. choisir cette source si elle est fiable,
3. construire une collecte interne seulement si aucune source fiable n'existe,
4. brancher l'aggregation OHLCV au chart,
5. normaliser strictement les tickers,
6. exposer la provenance explicite des metriques sidebar.

Tant que ces cinq points ne sont pas en place, l'ecran doit etre considere
comme un terminal daily enrichi par snapshot, pas comme un terminal intraday
professionnel.
