# Revue d’architecture — Redux Toolkit, RTK Query et IndexedDB

## Document de décision à soumettre à un LLM expert

**Statut :** document de réflexion et de cadrage — aucune décision finale prise  
**Périmètre :** Technical Analysis, données OHLCV, ticker sélectionné, sidebar droit, cache mémoire et persistance navigateur  
**Objectif :** remettre en question l’architecture actuelle avant d’ajouter davantage de logique de cache

---

## 1. Pourquoi ce document existe

Une optimisation du chargement initial a progressivement conduit à utiliser plusieurs niveaux de cache :

```text
API distante
   ↓
RTK Query / repositories
   ↓
Redux Toolkit — état de session
   ↓
IndexedDB — persistance entre deux chargements de page
   ↓
Interface Technical Analysis
```

L’intention initiale était légitime : réduire l’attente au premier affichage, éviter que le graphique et le sidebar restent trop longtemps en skeleton et rendre l’application plus agréable après un rechargement.

Cependant, plusieurs questions importantes sont apparues :

- Redux Toolkit ne conserve-t-il pas déjà les données tant que l’utilisateur reste dans la session ?
- Si l’utilisateur change de ticker puis revient à l’ancien, pourquoi ne pas réutiliser simplement les données encore présentes en mémoire ?
- Un `Ctrl+R` détruit la mémoire JavaScript : dans ce cas, l’API ne doit-elle pas naturellement refournir les données fraîches ?
- IndexedDB est-il réellement nécessaire pour le sidebar ?
- La persistance OHLCV actuelle écrit-elle trop de données ?
- Si IndexedDB conserve de nombreux tickers, devient-il progressivement une seconde base de données locale ?
- Comment afficher immédiatement un cache sans donner l’impression qu’il s’agit de données temps réel ?
- Quelle architecture sera compatible avec l’arrivée future d’un WebSocket ?

Ce document rassemble ces questions, les objections de l’utilisateur, les faits observés dans le code et les orientations possibles. Il doit être remis à un LLM avancé afin qu’il tranche avec une analyse indépendante et argumentée.

---

## 2. Conclusion provisoire issue de la réflexion

La direction qui semble actuellement la plus saine est la suivante, sous réserve de validation par l’expert :

```text
Pendant la session : Redux / RTK Query est le cache principal.

Après changement de ticker : réutiliser les données encore présentes en mémoire.

Après Ctrl+R : l’API redevient la source de vérité et recharge les données.

IndexedDB : uniquement un petit bootstrap optionnel et strictement borné,
principalement pour afficher rapidement une courte portion OHLCV.

Sidebar : ne pas le persister automatiquement dans IndexedDB tant qu’un besoin
réel et mesuré ne le justifie pas.

Plus tard : le WebSocket met à jour Redux en temps réel et IndexedDB ne reçoit
que des snapshots occasionnels, jamais chaque tick.
```

Cette conclusion n’est pas encore une décision d’implémentation. Le rôle du LLM expert sera de confirmer, corriger ou rejeter cette orientation.

---

## 3. Faits observés dans l’interface et dans le code

### 3.1 Observation IndexedDB sur localhost

Dans Chrome DevTools, pour `http://localhost:3000/`, on a observé :

- `AlgowayMarketData_DB`
  - store `ohlcv_cache`
- `AlgowaySidebar_DB`
- plusieurs autres bases IndexedDB liées aux alertes, screeners, éditeur Pine et sélection de ticker
- environ **2,5 MB utilisés** sur un quota affiché d’environ **253 840 MB**

La remarque importante n’est pas que `2,5 MB` soit proche de la limite navigateur : ce n’est pas le cas. La vraie inquiétude est la trajectoire de croissance.

Si chaque ticker consulté, chaque marché et chaque flux conserve durablement ses données, le cache peut grossir sans limite fonctionnelle claire. Un cache persistant doit avoir une politique de rétention même lorsque le quota technique du navigateur est très élevé.

Autre nuance : la présence de `AlgowaySidebar_DB` prouve que la base a été créée, mais ne prouve pas à elle seule qu’elle contient beaucoup d’enregistrements. Il faut inspecter le store et ses entrées pour attribuer précisément les octets.

### 3.2 Observation simultanée sur TradingView

Dans Chrome DevTools, pour `https://www.tradingview.com/`, on a observé environ :

- **1,2 MB utilisés au total**
- environ **1,1 MB de Cache Storage**
- environ **29,7 KB d’IndexedDB**

Cette comparaison est une alerte utile, mais elle ne constitue pas une preuve directe de l’architecture interne de TradingView. Les deux applications n’ont pas le même nombre de fonctionnalités, les mêmes ressources, la même durée de session ni les mêmes caches réseau.

La leçon à retenir est néanmoins pertinente : l’IndexedDB ne doit pas devenir le lieu où l’on recopie durablement toute l’histoire des données de marché. TradingView semble, dans cette observation, utiliser IndexedDB de manière très légère par rapport à son cache réseau.

### 3.3 Redux Toolkit et RTK Query dans le projet

Le store actif est construit par `core/infra/store/index.ts` :

- un reducer RTK Query sous `api.reducerPath` ;
- le reducer `technicalAnalysis` ;
- un reducer de devise ;
- un middleware RTK Query ;
- une configuration spéciale pour éviter les contrôles coûteux sur les gros tableaux OHLCV.

RTK Query est configuré dans `core/infra/store/api/base.api.ts` avec `createApi`, `fetchBaseQuery`, timeout HTTP et gestion de renouvellement de session.

Mais il faut éviter une confusion : **Redux Toolkit n’est pas automatiquement un cache persistant**.

- Redux conserve l’état tant que l’instance du store vit.
- RTK Query conserve ses résultats en mémoire selon ses règles de cache et ses abonnements.
- Un rechargement complet de page recrée le store et détruit l’état mémoire.
- Sans `redux-persist`, `extractRehydrationInfo` ou mécanisme équivalent, le store n’est pas restauré depuis IndexedDB.
- IndexedDB est un système séparé, qui nécessite des lectures et écritures explicites.

### 3.4 Le graphique OHLCV n’est pas uniquement un cache RTK Query

Le flux Technical Analysis utilise également le slice classique `technicalAnalysis` :

```text
technicalAnalysis.marketData: Record<string, ChartDataPoint[]>
```

`useMarketData.ts` :

- charge le ticker actif ;
- place les séries dans l’état local et Redux ;
- réutilise `marketDataCacheRef` lorsque le ticker a déjà été chargé ;
- charge davantage d’historique lors d’une demande de frontière ;
- appelle `requestMoreHistory` pour obtenir des lots supplémentaires ;
- utilise actuellement des chargements historiques par lots de trois pages ;
- appelle `writePersistedMarketData` après avoir commis une série.

Le cache mémoire Redux est donc naturellement adapté au scénario :

```text
Ticker A → données chargées en Redux
Ticker B → données chargées en Redux
Retour à Ticker A → réutilisation rapide des données de Ticker A
```

Ce comportement ne nécessite pas IndexedDB tant que l’utilisateur ne recharge pas la page.

### 3.5 Persistance OHLCV actuelle

Le fichier concerné est :

```text
components/technical-analysis/hooks/MarketData/marketDataPersistence.ts
```

Il utilise :

```text
Database : AlgowayMarketData_DB
Store    : ohlcv_cache
Clé      : ohlcv:<MARKET>:<TICKER>
```

Chaque enregistrement contient actuellement :

```text
key
marketTicker
ticker
data: ChartDataPoint[]
updatedAt
```

La lecture considère les données visibles comme utilisables pendant dix minutes :

```text
MAX_VISIBLE_STALE_AGE_MS = 10 minutes
```

Mais cette règle est seulement une règle de fraîcheur de lecture. Elle ne supprime pas l’enregistrement expiré. Une donnée ancienne peut donc rester physiquement dans IndexedDB, même si l’interface refuse de l’afficher.

La méthode d’écriture sauvegarde la série validée entière reçue en paramètre. Cela signifie que si `series` contient déjà plusieurs milliers ou dizaines de milliers de bougies, la persistance recopie toute cette série dans IndexedDB.

Le même ticker et le même marché sont écrasés grâce à la même clé, ce qui évite les doublons pour une clé identique. En revanche, le nombre de clés différentes — marchés, tickers, variantes — n’est pas globalement limité.

### 3.6 Persistance sidebar actuellement ajoutée

Le fichier ajouté récemment est :

```text
components/technical-analysis/components/sidebar/data/sidebarPersistence.ts
```

Il crée :

```text
Database : AlgowaySidebar_DB
Store    : sidebar_snapshots
```

Il prévoit quatre catégories :

- `fundamentals` : par ticker ;
- `news` : globale ;
- `indices` : globale ;
- `bonds` : globale.

Les TTL prévus sont :

```text
fundamentals : 1 heure
news         : 15 minutes
indices      : 10 minutes
bonds        : 30 minutes
```

Le hook `useSidebarDataFeeds.ts` lit le snapshot puis lance une requête réseau en parallèle. Il conserve la donnée en mémoire en cas d’échec réseau lorsque cela est possible.

Cette implémentation répond au problème du skeleton après `Ctrl+R`, mais elle soulève une question d’architecture : le sidebar est-il assez lourd ou assez lent pour justifier une deuxième persistance durable ? Si Redux/RTK Query suffit pendant la session et que l’API doit de toute façon être interrogée après un rechargement, cette base peut être une complexité inutile.

---

## 4. Les scénarios réels à distinguer

### Scénario A — L’utilisateur change de ticker sans recharger

```text
Ticker A actif
→ Ticker B sélectionné
→ Ticker A sélectionné à nouveau
```

Attente : Ticker A doit revenir rapidement grâce à Redux/RTK Query ou à une structure mémoire équivalente.

IndexedDB n’apporte rien à ce scénario si les données de Ticker A sont encore dans le store.

### Scénario B — L’utilisateur force `Ctrl+R`

```text
Page rechargée
→ nouveau runtime JavaScript
→ nouveau store Redux
→ ancien état mémoire perdu
```

Attente prioritaire : l’API doit refournir les données fraîches.

Un petit snapshot IndexedDB peut éventuellement accélérer le premier rendu, mais il doit être considéré comme un aperçu temporaire, jamais comme la source de vérité.

### Scénario C — L’utilisateur scrolle vers l’historique

L’utilisateur doit voir rapidement une portion initiale du graphique, puis l’API fournit les plages historiques supplémentaires au fur et à mesure.

L’idée discutée est de ne persister que les **deux ou trois premières plages nécessaires au bootstrap**, et non toute la série historique.

Attention à la direction de l’API :

- si l’API renvoie les données les plus récentes en premier, les premières pages sont adaptées ;
- si l’API renvoie les données les plus anciennes en premier, il faut conserver les pages contenant les données les plus récentes ;
- le code doit donc définir “premières plages” sémantiquement comme “plage de démarrage utile”, et non comme un simple index arbitraire.

### Scénario D — Données quasi temps réel sans WebSocket

Tant qu’il n’existe pas de WebSocket, l’API ou le polling reste la source de mise à jour.

Le snapshot IndexedDB peut être affiché instantanément, mais il doit être remplacé dès que la réponse API arrive. L’interface devrait connaître et éventuellement afficher `updatedAt` pour ne pas présenter une donnée ancienne comme du temps réel.

### Scénario E — WebSocket futur

L’architecture cible devrait devenir :

```text
IndexedDB : petit bootstrap après Ctrl+R
API       : synchronisation initiale et historique
Redux     : état courant consommé par l’interface
WebSocket : mutations temps réel dans Redux
```

Il ne faut pas écrire chaque tick WebSocket dans IndexedDB. Cela créerait des écritures permanentes, de la contention et une croissance inutile. IndexedDB devrait recevoir au mieux un snapshot périodique ou un snapshot lors d’un changement de ticker / d’une mise en veille.

---

## 5. Questions précises à soumettre au LLM expert

Le LLM chargé de trancher doit répondre explicitement aux questions suivantes.

### 5.1 Sur Redux Toolkit et RTK Query

1. Quelles données sont réellement dans RTK Query et lesquelles sont dans le slice classique `technicalAnalysis` ?
2. Les résultats RTK Query restent-ils disponibles lorsqu’un composant n’est plus abonné, et pendant combien de temps avec la configuration actuelle ?
3. Lors d’un retour sur un ticker, le code réutilise-t-il bien Redux ou déclenche-t-il inutilement une nouvelle requête ?
4. Faut-il utiliser RTK Query pour les séries OHLCV, ou le slice spécialisé est-il préférable pour les gros tableaux et la pagination historique ?
5. Une persistance complète du store serait-elle dangereuse pour les données OHLCV volumineuses ?

### 5.2 Sur IndexedDB

1. IndexedDB doit-il être supprimé du sidebar ?
2. Faut-il le conserver uniquement pour le bootstrap OHLCV après `Ctrl+R` ?
3. Quelle quantité exacte doit être conservée : deux pages, trois pages, nombre maximum de bougies ou budget en octets ?
4. Faut-il stocker une copie tronquée de `series` au lieu de la série complète ?
5. Comment supprimer les entrées expirées, anciennes ou dépassant un budget ?
6. Le budget doit-il être global, par marché, par ticker ou par fonctionnalité ?
7. La base doit-elle stocker les métadonnées de pagination afin que le scroll puisse reprendre proprement ?

### 5.3 Sur la fraîcheur

1. Quelle donnée peut être affichée depuis IndexedDB comme bootstrap ?
2. Quelle donnée doit obligatoirement attendre l’API avant d’être affichée ?
3. Comment distinguer dans l’UI `cached`, `fetching`, `fresh`, `stale` et `live` ?
4. Quelle stratégie de polling faut-il appliquer avant le WebSocket ?
5. Quelle stratégie de reconnexion et de resynchronisation faudra-t-il avec le WebSocket ?

### 5.4 Sur le sidebar

1. Les fondamentaux, statistiques, profil, performance, obligations, indices et actualités doivent-ils vraiment survivre à un `Ctrl+R` ?
2. Le gain du cache sidebar justifie-t-il la complexité d’une base supplémentaire ?
3. La bonne stratégie ne serait-elle pas : Redux en session, API après rechargement, skeleton ciblé uniquement sur les panneaux lents ?
4. Si un snapshot sidebar est conservé, doit-il être limité au ticker sélectionné et aux données globales les plus récentes ?

---

## 6. Options d’architecture

### Option A — Redux/RTK Query uniquement pendant la session

```text
Session normale : Redux/RTK Query
Ctrl+R         : API
WebSocket futur: Redux
IndexedDB      : supprimé du cache fonctionnel
```

**Avantages :** simplicité, fraîcheur claire, peu de maintenance, aucune croissance persistante.  
**Inconvénients :** après `Ctrl+R`, l’utilisateur attend l’API et voit potentiellement des skeletons.

### Option B — Redux principal + petit bootstrap OHLCV IndexedDB

```text
Session normale : Redux/RTK Query
Ctrl+R         : petite portion OHLCV IndexedDB puis API
Scroll         : API historique
Sidebar        : Redux/RTK Query, sans IndexedDB
WebSocket      : Redux
```

**Avantages :** réduit l’attente du graphique tout en gardant IndexedDB petit et spécialisé.  
**Inconvénients :** nécessite une troncature claire, une politique d’expiration et une gestion de cohérence.

### Option C — Persistance complète OHLCV et sidebar

```text
Redux + RTK Query + IndexedDB pour toutes les données
```

**Avantages :** premier affichage potentiellement très rapide après rechargement.  
**Inconvénients :** duplication des responsabilités, données potentiellement périmées, croissance persistante, nettoyage complexe, risque de transformer IndexedDB en seconde base de données.

Cette option ne devrait être retenue que si des mesures démontrent que les options A et B ne suffisent pas.

### Option D — Persistance complète du store Redux

Cette option consisterait à rehydrater Redux depuis IndexedDB ou un mécanisme similaire.

Elle doit être abordée avec prudence : persister indistinctement `technicalAnalysis.marketData`, les métadonnées, les états UI et les caches RTK Query pourrait stocker beaucoup plus que nécessaire et mélanger état de présentation, données distantes et données historiques.

La persistance doit être sélective, jamais une copie aveugle du store.

---

## 7. Orientation technique candidate pour OHLCV

Si l’Option B est retenue, le modèle recommandé à évaluer est :

```text
CacheKey = marché + ticker

PersistedBootstrap = {
  key,
  marketTicker,
  ticker,
  points: seulement les 2 ou 3 plages de démarrage,
  oldestCachedTime,
  newestCachedTime,
  source: "indexeddb-bootstrap",
  updatedAt,
  schemaVersion,
}
```

Règles proposées :

1. Ne jamais persister automatiquement toute la série reçue.
2. Tronquer la série avant `put()`.
3. Garder la portion utile au premier rendu, normalement la plus récente.
4. Conserver les métadonnées de bornes temporelles.
5. Charger cette portion sans bloquer l’API.
6. Lancer immédiatement la revalidation API.
7. Laisser `requestMoreHistory` charger les anciennes plages depuis l’API.
8. Remplacer le snapshot après une réponse fraîche, en le retronquant.
9. Supprimer les entrées dépassant le TTL ou le budget.
10. Ne jamais écrire chaque mise à jour temps réel dans IndexedDB.

La limite devrait être exprimée à la fois en nombre de plages et en nombre maximal de points. Une limite uniquement basée sur le nombre de pages pourrait rester trop lourde si la taille d’une page change.

---

## 8. Orientation candidate pour le sidebar

Le sidebar contient des données de nature différente :

| Donnée | Nature | Besoin probable après Ctrl+R |
|---|---|---|
| Prix et volume | très dynamique | API obligatoire puis WebSocket futur |
| Fondamentaux | relativement stable | API ; snapshot optionnel |
| Profil société | stable | API ; snapshot optionnel |
| Performance | calculée/dynamique | API ou calcul contrôlé |
| Actualités | temporelle | API avec TTL court |
| Indices | temporelle | API avec TTL court |
| Obligations | relativement stable | API avec TTL moyen |

La proposition la plus simple est :

```text
Sidebar pendant la session : Redux / RTK Query / refs de hook
Sidebar après Ctrl+R     : API
Prix temps réel futur    : WebSocket → Redux
IndexedDB sidebar        : supprimé ou réservé à un besoin démontré
```

Si un cache sidebar persistant est conservé, il doit être conçu comme un snapshot facultatif, non comme une autorité :

- aucune donnée cached ne doit empêcher la requête API ;
- le ticker doit faire partie de la clé pour les données spécifiques ;
- les flux globaux doivent avoir leur propre clé ;
- chaque entrée doit avoir `updatedAt` et `schemaVersion` ;
- une entrée expirée doit être supprimée ou compactée ;
- l’échec API doit être visible dans l’état de fraîcheur, pas masqué.

---

## 9. Ce qu’il ne faut surtout pas faire

- Ne pas persister tout le store Redux sans sélection explicite.
- Ne pas considérer IndexedDB comme une source temps réel.
- Ne pas afficher une donnée ancienne sans connaître son âge.
- Ne pas écrire chaque tick WebSocket dans IndexedDB.
- Ne pas conserver toutes les plages historiques de chaque ticker par défaut.
- Ne pas confondre TTL de lecture et suppression physique.
- Ne pas ajouter une base IndexedDB simplement parce qu’un skeleton est visible sans mesurer la cause réelle.
- Ne pas supposer que TradingView utilise exactement la même architecture à partir de son usage mémoire.
- Ne pas déclencher une nouvelle requête lorsque Redux contient déjà une donnée acceptable, sauf revalidation volontaire.
- Ne pas supprimer la revalidation API parce qu’un snapshot local existe.
- Ne pas cacher l’état de fraîcheur à l’utilisateur lorsque la donnée affichée peut être ancienne.

---

## 10. Critères de décision et de validation

Le LLM expert devra proposer une décision qui réponde à ces critères :

### Exactitude

- Après `Ctrl+R`, les données API fraîches remplacent bien le snapshot.
- Le cache ne peut pas écraser une réponse réseau plus récente.
- Les données d’un ticker ne sont jamais affichées pour un autre ticker.
- Les bornes historiques et la pagination restent cohérentes.

### Performance

- Retour sur un ticker déjà chargé quasi instantané en session.
- Premier rendu utile après rechargement sans bloquer la requête API.
- Scroll historique sans saut du viewport.
- Aucun gros tableau inutilement dupliqué dans Redux et IndexedDB.

### Rétention

- Nombre maximal de points par snapshot défini.
- Nombre maximal d’entrées défini.
- Budget de taille défini ou mécanisme d’éviction mesurable.
- Entrées expirées supprimées réellement.
- Migration possible via `schemaVersion`.

### Temps réel futur

- Redux est la surface de rendu live.
- WebSocket peut mettre à jour Redux sans dépendre d’IndexedDB.
- Une reconnexion WebSocket peut déclencher une resynchronisation API.
- IndexedDB reste un bootstrap, pas un flux.

### Observabilité

- Taille IndexedDB mesurable.
- Nombre d’entrées et âge moyen mesurables.
- Origine de l’affichage identifiable : `memory`, `indexeddb`, `api`, `websocket`.
- Temps entre affichage cache et remplacement API mesurable.
- Échecs de lecture/écriture journalisés sans casser l’interface.

---

## 11. Demande finale adressée au LLM expert

Tu dois analyser ce document et le code réel du projet avant de trancher.

Ne pars pas du principe qu’IndexedDB est nécessaire parce qu’il existe déjà. Ne pars pas non plus du principe que Redux est suffisant sans vérifier la durée de vie réelle du store, les abonnements RTK Query et le slice OHLCV classique.

Réponds avec :

1. l’architecture que tu recommandes ;
2. les responsabilités exactes de Redux, RTK Query, IndexedDB, API et WebSocket ;
3. ce qui doit être supprimé de la mise en cache actuelle ;
4. ce qui doit être conservé ;
5. la politique exacte de rétention OHLCV ;
6. la décision concernant le cache sidebar ;
7. les risques de fraîcheur et de concurrence ;
8. le plan de migration minimal sans régression ;
9. les tests nécessaires pour `Ctrl+R`, changement de ticker, retour sur ticker, scroll historique, API lente et WebSocket futur ;
10. les mesures permettant de prouver que le cache est réellement plus petit et plus rapide.

La décision finale doit privilégier la séparation nette des responsabilités :

```text
Redux / RTK Query = cache mémoire et état de session
API               = autorité distante et fraîcheur
IndexedDB         = bootstrap persistant strictement borné, si nécessaire
WebSocket         = flux temps réel futur vers Redux
```

Toute déviation doit être justifiée par une mesure ou une contrainte concrète du projet.


======

BREF:[ bon je pense qu eon exagere un peu trop et qu eon par acote d ela plaque avec index-db! si utilsiateur force un CRTL+R alors focment l'api doit tout refournir! et donc tant quil ne fait
  pas de CTRL+R alors le redux-tooltit a tu en lui donc si on change de ticker et on passe us un autre ticker, cela va cherger aussi les vougi de ce tikc rne quesiton! mainstenant si on
  revinet sur l'ancine ticker e tbien figure toi que normetken le reduc-tooolkit doit afficher ces donnes rapidment en temp normele  puis que il est encor en mmeioire n'est ce pas ?


• Oui, tu as raison : on était en train de trop utiliser IndexedDB.

  Le comportement idéal est :

  - Changement de ticker : Redux/RTK garde les données en mémoire et les réaffiche rapidement.
  - Retour sur un ticker déjà consulté : les données doivent revenir immédiatement depuis la mémoire.
  - Ctrl+R : la mémoire JavaScript est détruite, donc l’API doit naturellement recharger les données.
  - WebSocket plus tard : il mettra à jour Redux en temps réel.

  Point important : dans cette codebase, tout le cache n’est pas réellement géré par RTK Query. Une partie des données OHLCV est dans un slice Redux classique, et la persistance IndexedDB a
  été ajoutée manuellement.

  Donc la meilleure architecture est probablement :

  - Redux/RTK Query pour le cache pendant la session ;
  - API après un Ctrl+R ;
  - IndexedDB uniquement éventuellement pour un petit bootstrap OHLCV, avec une limite stricte ;
  - pas de cache IndexedDB persistant pour tout le contenu du sidebar.

  Le cache IndexedDB du sidebar que nous venons d’ajouter est donc probablement superflu. Il faudrait le retirer et laisser Redux/RTK gérer le sidebar en mémoire.
]
