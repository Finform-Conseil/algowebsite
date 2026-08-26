# API Sidebar Right — Rapport d’audit API-first

Date de l’audit : 17 août 2026
Périmètre : sidebar droit de l’analyse technique, mode réel BRVM
Type : audit de provenance, de transformation et de fallback
Mise à jour : revue finale API-first et preuves CDP du 18 août 2026.

## 1. Verdict exécutif

Le flux API-first existe pour les données brutes : API officielle → repositories → hooks/adaptateurs → modèle du sidebar → interface.

Le sidebar respecte l’exigence API-first en mode réel pour les données métier : les valeurs financières disponibles sont lues depuis les réponses API, les champs absents restent N/D ou indisponibles, et aucune donnée financière locale ne les remplace.

Les libellés, formats, messages d’indisponibilité et états de présentation restent générés par l’interface.

Les dérivations conservées dans le code sont limitées au mode mock. En mode réel, une donnée API native absente rend le bloc indisponible ou affiche N/D.

Statut global : CONFORME À L’EXIGENCE STRICTE DISPLAY-ONLY POUR LE FLUX RÉEL.

## 2. Règles appliquées

- API officielle comme source primaire de toute donnée métier ;
- flux API → repository/domain adapter → hook → modèle de présentation → interface ;
- aucun composant ne contourne les repositories ;
- aucun catalogue local ne remplace une entité API ;
- aucune valeur financière fabriquée ou silencieusement complétée ;
- donnée API absente → N/D, N/A ou état indisponible ;
- les dérivations locales ne satisfont pas l’exigence actuelle « afficher uniquement » ;
- un fallback de démonstration ne doit jamais être nominal en mode réel.

Références : Docs/API_FIRST_ABSOLUTE_RULE.md et Docs/ARCHITECTURE_DATA_FLOW.md.

## 3. Preuve CDP du mode réel

Page contrôlée :

~~~text
http://localhost:3000/en/equity/technical-analysis?profile_verify=20260813
~~~

Titre observé : SICOR_CI, ISIN CI0000000113, SICOR COTE D’IVOIRE. Le sélecteur indique la source BRVM vérifiée.

Requêtes observées :

~~~text
GET /api/proxy/10/api/v1/actions?isin=CI0000000113&page_size=1
GET /api/proxy/10/api/v1/cours?instrument=403a8fa9-5b09-4266-9b4a-ea0c761a18b3&page=1&page_size=100
GET /api/proxy/10/api/v1/cours?instrument=403a8fa9-5b09-4266-9b4a-ea0c761a18b3&page=2&page_size=100
GET /api/proxy/10/api/v1/cours?instrument=403a8fa9-5b09-4266-9b4a-ea0c761a18b3&page=3&page_size=100
GET /api/proxy/10/api/v1/results?action_ticker=SICOR_CI&page_size=500
GET /api/proxy/10/api/v1/dividends?action_ticker=SICOR_CI&page_size=100
GET /api/proxy/10/api/v1/fixed-income/bond-securities?page_size=100
GET /api/market-data/brvm-news
~~~

Réponses observées :

- actions : HTTP 200 ;
- cours : HTTP 200, 3 325 cours et 34 pages ;
- dividends : HTTP 200 ;
- fixed-income/bond-securities : HTTP 200 ;
- brvm-news : HTTP 200 ;
- results : HTTP 401, sans authentification.

Le frontend affiche les champs absents en N/D ou en état indisponible, sans fabriquer de valeur. Lorsqu’un champ API est présent mais vaut explicitement `null`, le frontend affiche `null` afin de distinguer cette situation d’un champ absent.

## 4. Chaîne applicative

~~~text
API officielle
  → core/infra/store/api/*.api.ts
  → core/infra/repositories/*.repository.impl.ts
  → hooks MarketData / sidebar data feeds
  → sidebarDataPortAdapter
  → useTechnicalAnalysisSidebarController
  → useSidebarDerivedMetrics
  → TechnicalAnalysisSidebarContent
  → panneaux du sidebar droit
~~~

Le composant du sidebar ne doit pas appeler directement l’API distante. Les actualités utilisent l’exception applicative documentée /api/market-data/brvm-news.

## 5. Audit des sous-sections

### 5.1 Identité et cotation

Bloc : nom, BRVM, prix, XOF, variation, dernière mise à jour, état du marché, volume, secteur et pays.

Routes :

~~~text
GET /api/proxy/10/api/v1/actions?isin=CI0000000113&page_size=1
GET /api/proxy/10/api/v1/cours?instrument={instrumentId}&page={N}&page_size=100
~~~

Correspondance : nom/ticker depuis society.name et action.ticker ; marché depuis bourse.ticker ; prix et volume depuis latest_price_metric ; pourcentage depuis latest_price_metric.change_1d_pct ; devise depuis bourse.currency.symbol ; secteur/pays depuis society. La réponse SICOR ne fournit pas de champ absolu change_1d ou price_change : la variation absolue est donc N/D, sans calcul local.

Verdict : données principales API, oui. La variation absolue N/D et le pourcentage (+0.00%) reflètent respectivement l.absence du champ API absolu et change_1d_pct. Formats et labels locaux de présentation, acceptables. Le fallback de synchronisation décrit dans l’audit précédent est corrigé : Redux vide la sélection jusqu’à la résolution de l’action API correspondante ; aucune entrée BRVM_SECURITIES n’est injectée dans ce flux.

Fichiers : components/technical-analysis/hooks/MarketData/useMarketData.ts ; components/technical-analysis/context/TechnicalAnalysisProviders.tsx ; components/technical-analysis/TechnicalAnalysis.tsx.



| Élément affiché | Provenance réelle | Si absent |
|---|---|---|
| SICOR COTE D’IVOIRE | API → `actions` → `society.name` | N/D |
| BRVM | API → `actions` → `bourse.ticker` | N/D |
| 3995,00 | API → `actions` → `latest_price_metric.price` | N/D |
| XOF | API → `actions` → `bourse.currency.symbol` | N/D |
| N/D variation absolue | API → Champ natif absent `change_1d` ou `price_change` | N/D, aucun calcul local |
| (+0.00%) | API → `actions` → `latest_price_metric.change_1d_pct` | N/D |
| Last update | API → `actions` → `latest_price_metric.timestamp`, formaté localement | N/D |
| Market closed | `useSidebarMarketClock` et calendrier de séance configuré | Statut de séance indisponible |
| Volume: 468 | API → `actions` → `latest_price_metric.volume` | N/D |
| Sector | API → `actions` → `society.industry.name` | N/D |
| Côte d’Ivoire | API → `actions` → `society.country.name` | N/D |

### 5.2 Actualités

Route :

~~~text
GET /api/market-data/brvm-news
~~~

La réponse est validée et filtrée. Un cache applicatif court et une conservation stale sont présents.

Verdict : source distante oui ; API officielle du store core/infra/store/api non ; exception contrôlée oui ; fallback catalogue financier non ; cache stale après erreur oui.

Fichiers : components/technical-analysis/components/sidebar/data/sidebarDataPortAdapter.ts ; components/technical-analysis/components/sidebar/hooks/useSidebarDataFeeds.ts.



| Élément affiché | Provenance réelle | Si absent |
|---|---|---|
| Date de l’actualité | API → `/api/market-data/brvm-news` → date de l’article | Bloc indisponible |
| Titre de l’actualité | API → `/api/market-data/brvm-news` → titre de l’article | Bloc indisponible |
| Libellé Récents | Présentation UI locale | Masqué si aucune actualité |

### 5.3 Statistiques clés

Route :

~~~text
GET /api/proxy/10/api/v1/actions?isin=CI0000000113&page_size=1
~~~

Correspondance : rendement YTD depuis total_return_ytd_pct/change_ytd_pct ; P/E depuis latest_valuation_ratio.pe_ttm ; volume depuis latest_price_metric.volume ; revenu FY depuis results si exploitable ; volume moyen depuis vol_avg_20d ; capitalisation depuis market_cap.

Valeurs API observées pour SICOR : volume 468 ; vol_avg_20d 104.05 ; change_ytd_pct 21.060606... ; market_cap 2397000000 ; pe_ttm null.

Preuve de rendu CDP : le bloc affiche `P/E Ratio` avec la valeur `null`. Les autres valeurs observées restent `Rendement YTD +21,06%`, `Volume 468`, `Volume moyen (20) 104` et `Capitalisation boursière 2.397.000,00 B FCFA`.

Verdict : données directes API conformes. `pe_ttm` est un champ API présent dont la valeur est explicitement `null` ; l’interface affiche donc `null` pour distinguer « champ fourni mais sans valeur » de « champ absent ». Un champ non transmis reste `N/D` ; aucun fallback financier réel n’est utilisé.

Fichier principal : components/technical-analysis/components/sidebar/hooks/useTechnicalAnalysisSidebarController.ts.



| Élément affiché | Provenance réelle | Si absent |
|---|---|---|
| Rendement YTD | API → `actions` → `latest_price_metric.change_ytd_pct` ou `total_return_ytd_pct` | N/D |
| P/E Ratio | API → `actions` → `latest_valuation_ratio.pe_ttm` (champ présent, valeur `null` pour SICOR) | `null` si la valeur API est `null`, sinon `N/D` si le champ est absent |
| Volume | API → `actions` → `latest_price_metric.volume` | N/D |
| Revenu/PNB (FY) | `results` si réponse API authentifiée et exploitable | N/D |
| Volume moyen (20) | API → `actions` → `latest_price_metric.vol_avg_20d` | N/D |
| Capitalisation boursière | API → `actions` → `latest_valuation_ratio.market_cap` | N/D |
| Titres et formats | Présentation UI locale | Sans objet |

### 5.4 Dividends

Routes :

~~~text
GET /api/proxy/10/api/v1/dividends?action_ticker=SICOR_CI&page_size=100
GET /api/proxy/10/api/v1/results?action_ticker=SICOR_CI&page_size=500
~~~

Le repository existant est réutilisé via `getAllDividends`. Comme le backend ignore actuellement le paramètre `action_ticker`, l’adapter demande les pages séquentiellement (maximum 5), filtre strictement `action_ticker` côté frontend, puis conserve uniquement les lignes avec `amount` et `pay_date` valides. Il s’arrête dès qu’une page contient des lignes du ticker demandé. Aucun catalogue local n’est injecté.

La route Actions expose bien des champs natifs de rendement dans latest_valuation_ratio : dividend_yield est présent et vaut 64.81701066332916 pour SICOR_CI. Le champ payout_ratio existe également dans le contrat API et dans la réponse, mais sa valeur est null pour ce titre. La route Dividends expose des montants et dates de dividendes, pas un payout_ratio natif. La vérification CDP a confirmé HTTP 200, 11 792 lignes et 118 pages ; la page 1 ne contient aucune ligne SICOR, tandis que la page 2 contient 3 lignes `SICOR_CI` valides. La route Results reste en HTTP 401 sans authentification ; elle ne permet donc pas de conclure sur les résultats financiers protégés. Le frontend n’affiche aucun ratio calculé localement en mode réel ; il conserve l’état d’indisponibilité lorsque la valeur native requise est absente ou null.

Classification : dividend_yield = API_FIELD_PRESENT ; payout_ratio = API_FIELD_PRESENT mais non exploitable pour SICOR_CI ; résultats financiers = API_ROUTE_NOT_VERIFIED.

Verdict : données brutes API oui ; 3 lignes de dividendes SICOR ont été retrouvées par pagination API bornée ; `dividend_yield` natif est présent ; `payout_ratio` est présent mais null pour SICOR_CI ; aucun calcul financier local ni fallback n’est utilisé. Le bloc devient disponible uniquement lorsque des lignes API valides sont effectivement résolues.

Fichiers : components/technical-analysis/components/sidebar/data/sidebarDataPortAdapter.ts ; components/technical-analysis/components/sidebar/hooks/useSidebarDerivedMetrics.ts.



| Élément affiché | Provenance réelle | Si absent |
|---|---|---|
| Lignes de dividendes | API → `/api/v1/dividends/?action_ticker={ticker}` | Données de dividendes indisponibles |
| Date ex-dividende | API → Réponse API Dividends | N/D |
| Date de paiement | API → Réponse API Dividends | N/D |
| Montant | API → Réponse API Dividends | N/D |
| Dividend yield | API → `actions` → `latest_valuation_ratio.dividend_yield` | N/D |
| Payout ratio | API → `actions` → `latest_valuation_ratio.payout_ratio` | N/D si null |
| Message d’indisponibilité | Présentation UI locale | Sans objet |

### 5.5 Performance

Les lignes 1W, 1M, 3M, 6M, YTD et 1Y utilisent les champs API change_*_pct ou total_return_*_pct de latest_price_metric.

Verdict : valeurs API directes en mode réel ; champ absent → indisponible ; aucun fallback local réel identifié. La formule UI « Close actuel - Close ancre » est obsolète pour le mode réel.

Fichier : components/technical-analysis/components/sidebar/hooks/useSidebarDerivedMetrics.ts.



| Élément affiché | Provenance réelle | Si absent |
|---|---|---|
| 1W | API → `latest_price_metric.change_1w_pct` ou `total_return_1w_pct` | N/D |
| 1M | API → `latest_price_metric.change_1m_pct` ou `total_return_1m_pct` | N/D |
| 3M | API → `latest_price_metric.change_3m_pct` ou `total_return_3m_pct` | N/D |
| 6M | API → `latest_price_metric.change_6m_pct` ou `total_return_6m_pct` | N/D |
| YTD | API → `latest_price_metric.change_ytd_pct` ou `total_return_ytd_pct` | N/D |
| 1Y | API → `latest_price_metric.change_1y_pct` ou `total_return_1y_pct` | N/D |
| Labels et formats | Présentation UI locale | Sans objet |

### 5.6 Seasonals

Source primaire :

~~~text
GET /api/proxy/10/api/v1/cours?instrument={instrumentId}&page={N}&page_size=100
~~~

Les clôtures OHLCV API restent disponibles pour le graphique principal, mais elles ne servent plus à fabriquer une saisonnalité affichée en mode réel. Le bloc exige désormais une saisonnalité native API ; à défaut, il reste indisponible.

La réponse Actions, la réponse Cours et le schéma OpenAPI public ne contiennent aucun champ ou endpoint natif de saisonnalité. Les clôtures OHLCV restent disponibles, mais elles ne servent plus à fabriquer une saisonnalité affichée en mode réel.

Verdict : OHLCV API = API_FIELD_PRESENT ; saisonnalité native = API_FIELD_ABSENT_VERIFIED ; calcul local réel désactivé ; display-only conforme.

Fichiers : useSidebarDerivedMetrics.ts ; useSidebarCharts.ts ; sidebarSeasonalityChartOptions.ts.



| Élément affiché | Provenance réelle | Si absent |
|---|---|---|
| Années 2026, 2025, 2024 | Aucun champ natif de saisonnalité API identifié | Saisonnalité native indisponible via l’API |
| Rendements saisonniers | Aucun champ natif de saisonnalité API identifié | Bloc indisponible |
| More seasonals | Présentation UI locale | Masqué ou inactif |

Les clôtures de la route Cours ne sont pas transformées localement en saisonnalité visible en mode réel.

### 5.7 Technicals

Route vérifiée via CDP :

~~~text
GET /api/proxy/10/api/v1/actions/?ticker=SICOR_CI&page_size=1
Réponse observée : HTTP 200
~~~

La réponse Actions fournit bien des indicateurs techniques natifs dans
`latest_technical_indicator`. La réponse observée contient notamment :

~~~text
rsi_14 = 49.87729812226126
sma_20 = 4021.5000000000027
sma_50 = 3966.2999999999906
macd_signal
parabolic_sar_signal
supertrend_signal
kst_signal
tsi_signal
rvi_signal
fisher_transform_signal
klinger_signal
pattern_separating_lines
~~~

En revanche, l’objet Actions ne contient aucun champ agrégé exploitable par ce bloc,
notamment `recommendation`, `technical_recommendation`, `buy_hold_sell`, `score` ou
un classement natif Buy/Hold/Sell. Les champs de signaux individuels ne constituent
pas une recommandation agrégée API.

Le frontend n’additionne donc plus RSI, SMA ou signaux individuels pour fabriquer une
recommandation en mode réel. `useSidebarDerivedMetrics` retourne `null` pour
`technicalData` en mode réel ; le panneau affiche alors explicitement son indisponibilité.

| Élément affiché | Provenance réelle | Si absent |
|---|---|---|
| RSI et moyennes mobiles | API → `actions` → `latest_technical_indicator` | N/D ou bloc indisponible |
| Signaux techniques individuels | API → `actions` → `latest_technical_indicator.*_signal` | N/D |
| Buy/Hold/Sell | Aucun champ agrégé natif de recommandation trouvé dans la réponse API vérifiée | Recommandation technique native indisponible via l’API |
| Pourcentages Buy/Hold/Sell | Aucun calcul local autorisé en mode réel | Bloc indisponible |
| More technicals | Présentation UI locale | Masqué ou inactif |

Verdict contractuel : indicateurs bruts = `API_FIELD_PRESENT` ; recommandation native
agrégée = `API_FIELD_ABSENT_VERIFIED` ; état du panneau = `UI_UNAVAILABLE` ; calcul
local et fallback financier désactivés en mode réel.

Fichier : components/technical-analysis/components/sidebar/hooks/useSidebarDerivedMetrics.ts.

### 5.8 Model heuristic

Les indicateurs RSI/SMA, le P/E, le prix et la capitalisation sont disponibles dans les objets API correspondants. La réponse Actions et le schéma OpenAPI public n’exposent toutefois aucun champ natif de recommandation, de score modèle ou d’objectif de cours. Le frontend ne calcule plus de score composite ni de cible en mode réel et affiche explicitement l’indisponibilité.

Verdict : entrées API = API_FIELD_PRESENT selon le champ ; recommandation/objectif natifs = API_FIELD_ABSENT_VERIFIED ; modèle local réel désactivé ; display-only conforme.

Fichier : components/technical-analysis/components/sidebar/hooks/useSidebarDerivedMetrics.ts.



| Élément affiché | Provenance réelle | Si absent |
|---|---|---|
| RSI/SMA/P-E utilisés par le modèle | API → Champs API correspondants | N/D |
| Recommandation | Aucun champ natif de recommandation API identifié | Recommandation native indisponible via l’API |
| Objectif de cours | Aucun champ natif d’objectif API identifié | Objectif natif indisponible via l’API |
| Score composite | Aucun calcul local affiché en mode réel | Bloc indisponible |

### 5.9 Highest clearing yield bonds

Route :

~~~text
GET /api/proxy/10/api/v1/fixed-income/bond-securities?page_size=100
~~~

Le frontend utilise issue_lots.maturity_date et issue_lots.clearing_yield, filtre les lots actifs, trie et limite les résultats. Conversion décimale → pourcentage et formatage sont des normalisations d’affichage.

Verdict : source API oui ; fallback local non ; tri/formatage locaux acceptables. Problème documentaire : le panneau dit YTM alors que l’adaptateur lit clearing_yield. L’équivalence YTM n’est pas prouvée.

Fichiers : sidebarDataPortAdapter.ts ; TechnicalAnalysisSidebarContent.tsx.



| Élément affiché | Provenance réelle | Si absent |
|---|---|---|
| Date de maturité | API → `/api/v1/fixed-income/bond-securities` → `issue_lots.maturity_date` | N/D |
| 17.62%, 4.80% | API → Même route → `issue_lots.clearing_yield`, formaté en pourcentage | N/D |
| Classement | Tri local de lignes API par `clearing_yield` décroissant | Bloc indisponible si aucune ligne valide |
| Libellé YTM | Présentation UI ; équivalence avec `clearing_yield` non prouvée | À revoir si le backend expose un YTM natif |

### 5.10 Historical volatility term structure

Route :

~~~text
GET /api/proxy/10/api/v1/actions?isin=CI0000000113&page_size=1
~~~

Champs utilisés : hv_10, hv_20, hv_30, hv_60, hv_90 et hv_252. Labels UI : 10D, 20D, 30D, 60D, 90D et 252D.

En mode réel, le graphique lit exclusivement les champs API suivants, observés numériquement pour SICOR_CI :

~~~text
hv_10  = 46.24475788275271
hv_20  = 55.78485323242879
hv_30  = 62.58097423637291
hv_60  = 61.20236083733066
hv_90  = 60.224997474544
hv_252 = 52.02844586330107
~~~

Le graphique ne bascule pas sur la structure mock.

Verdict : valeurs API = API_FIELD_PRESENT ; calcul local réel non ; fallback local réel non ; conforme.

Fichiers : sidebarVolatilityChartOptions.ts ; useSidebarCharts.ts.



| Élément affiché | Provenance réelle | Si absent |
|---|---|---|
| 10D | API → `actions` → `latest_technical_indicator.hv_10` | N/D |
| 20D | API → `actions` → `latest_technical_indicator.hv_20` | N/D |
| 30D | API → `actions` → `latest_technical_indicator.hv_30` | N/D |
| 60D | API → `actions` → `latest_technical_indicator.hv_60` | N/D |
| 90D | API → `actions` → `latest_technical_indicator.hv_90` | N/D |
| 252D | API → `actions` → `latest_technical_indicator.hv_252` | N/D |
| Axes, labels et tracé | Présentation UI des valeurs API | Bloc indisponible si aucune valeur native |

### 5.11 Historical volatility curve (28 days)

Route API vérifiée via CDP :

~~~text
GET /api/proxy/10/api/v1/actions/?ticker=SICOR_CI&page_size=1
Réponse observée : HTTP 200
~~~

La réponse Actions fournit une structure native de volatilité ponctuelle :

~~~text
hv_10  = 46.24475788275271
hv_20  = 55.78485323242879
hv_30  = 62.58097423637291
hv_60  = 61.20236083733066
hv_90  = 60.224997474544
hv_252 = 52.02844586330107
~~~

En revanche, aucun champ `hv_28`, aucune série native 28 jours et aucune propriété
`curve`, `series` ou `historical_volatility_curve` n’est fournie par la réponse API.

La route Cours fournit uniquement les clôtures OHLCV. Les transformer en rendements
et en courbe de volatilité constituerait un calcul local ; ce calcul reste donc désactivé
en mode réel conformément à la règle API-first.

| Élément affiché | Provenance réelle | Si absent |
|---|---|---|
| Volatilités 10D à 252D | API → `actions` → `latest_technical_indicator.hv_*` | N/D |
| Courbe native 28 jours | Aucun champ ou série native API ; `hv_28 = null` | Courbe native indisponible via l’API |
| Clôtures OHLCV | API → `/api/v1/cours` → `close` | Non transformées en courbe visible en mode réel |
| Texte d’indisponibilité | Présentation UI locale conforme au contrat d’absence | Sans objet |

Verdict contractuel : volatilités ponctuelles = `API_FIELD_PRESENT` ; courbe native 28 jours
= `API_FIELD_ABSENT_VERIFIED` ; calcul local réel désactivé ; état du bloc = `UI_UNAVAILABLE`.

Fichiers : sidebarVolatilityChartOptions.ts ; shared/utils/volatility-engine.ts ; useSidebarCharts.ts.

### 5.12 Profile

Pour SICOR, la réponse actions contient l’ISIN et la description ; website est vide, employee_count null et FIGI absent.

Correspondance : website et employee_count depuis society ; ISIN depuis action.isin ; FIGI depuis le champ API s’il existe, sinon N/A ; description depuis society.description, sinon indisponible.

Verdict : source API oui ; absence → N/A conforme ; fallback FIGI réel non dans le provider actuel ; l’identité du sidebar principal est désormais bloquée sur une action API correspondant au ticker demandé.

Fichiers : TechnicalAnalysisSidebarContent.tsx ; TechnicalAnalysisProviders.tsx.



| Élément affiché | Provenance réelle | Si absent |
|---|---|---|
| Website | API → `actions` → `society.website` | N/A |
| Employees (FY) | API → `actions` → `society.employee_count` | N/A |
| ISIN | API → `actions` → identifiant ISIN de l’action | N/A |
| FIGI | API → Champ FIGI API s’il est fourni | N/A |
| Description | API → `actions` → `society.description` | Description indisponible via l’API |

## 6. Non-conformités transversales

### 6.1 Calculs locaux affichés

Les dérivations suivantes restent implémentées uniquement pour le mode mock :

~~~text
Dividends:
  calculatedYield
  payoutRatio

Seasonals:
  années et rendements depuis chartData

Technicals:
  score RSI/SMA
  Buy/Hold/Sell

Model heuristic:
  score composite
  target price

Historical volatility curve:
  rendements logarithmiques
  noyau gaussien
  annualisation
~~~

En mode réel, chaque bloc correspondant est indisponible lorsque l’API ne fournit pas le champ natif attendu. Aucune de ces dérivations locales n’est affichée dans le flux réel.

### 6.2 Fallback catalogue — synchronisation principale et rail d’alertes corrigés

Le risque de réinjection d’une entrée catalogue locale est supprimé sur les deux flux concernés :

~~~text
Redux ticker
  → sélection courante vidée
  → useMarketData résout l’action via le repository API
  → actionToSelectedTicker(action API)
  → contexte réhydraté uniquement si action.ticker === ticker Redux

Alertes
  → fetchAllActions via useActionRepository
  → métadonnées action.society / action.bourse
  → contexte live ou historique
  → N/D si l’API ne fournit pas le champ
~~~

Garanties appliquées :

- TechnicalAnalysis.tsx ne fait plus de BRVM_SECURITIES.find(...) pour synchroniser Redux vers le contexte ;
- une réponse API tardive pour un autre ticker est ignorée ;
- TechnicalAnalysisProviders.tsx n’utilise plus selectedTicker comme source de données quand l’action API est absente ou incohérente ;
- alertsRailLiveContexts.ts ne consulte plus BRVM_SECURITIES ;
- nom, marché, pays et devise du rail d’alertes sont lus depuis ActionEntity API ;
- l’absence de métadonnée API produit N/D, jamais BRVM, UEMOA ou XOF inventé localement ;
- le mapping du screener applique la même règle : pays, devise et secteur absents deviennent N/D ;
- UNAVAILABLE_SECURITY reste uniquement un état neutre d’indisponibilité ;
- la sélection visible du modal reste construite depuis le catalogue reçu par l’API.

Preuve CDP après rechargement complet :

~~~text
GET /api/proxy/10/api/v1/actions?ticker=SICOR_CI&page_size=1 200
GET /api/proxy/10/api/v1/actions?isin=CI0000000113&page_size=1 200
Titre affiché : SICOR COTE D'IVOIRE
Console après reload : aucune erreur
~~~

### 6.3 Provenance mal étiquetée

createFundamentalsProvenance("API") retourne désormais « API officielle ». Une source absente retourne « Source API indisponible » ; elle ne peut plus être présentée comme un catalogue local.

### 6.4 Cache stale

Les actualités et indices peuvent conserver la dernière réponse API après un nouvel échec réseau. Ce n’est pas un catalogue local, mais ce n’est pas non plus une réponse courante. Le statut stale doit être explicite sous une politique display-only stricte.

### 6.5 Résultats financiers

La requête results observée par CDP échoue en HTTP 401. Le frontend affiche N/D sans inventer de revenu ou de résultat. Le comportement frontend est correct ; la disponibilité métier dépend de l’authentification API.

### 6.6 Clearing yield versus YTM

L’API fournit clearing_yield, tandis que l’interface dit YTM. L’équivalence n’est pas prouvée.

## 7. Matrice finale

| Zone | API directe | Calcul local affiché en réel | Fallback local en réel | Statut |
|---|---:|---:|---:|---|
| Identité/cotation | Oui | Formatage uniquement | Non | Conforme API |
| Actualités | Route applicative | Non | Cache stale explicite | Exception contrôlée |
| Statistiques clés | Oui ; `pe_ttm` peut être présent et `null` | Formatage uniquement ; `null` API reste `null` | Non | Conforme |
| Dividends | Oui ; pagination API bornée + filtrage ticker strict ; payout_ratio null pour SICOR_CI | Non ; valeurs et disponibilité proviennent des lignes API | Non | Conforme display-only |
| Performance | Oui | Non | Non | Conforme |
| Seasonals | OHLCV API ; saisonnalité native absente | Non ; bloc indisponible | Non | Conforme display-only |
| Technicals | Indicateurs API ; recommandation native absente | Non ; bloc indisponible | Non | Conforme display-only |
| Model heuristic | API → Champs API ; score/objectif natifs absents | Non ; bloc indisponible | Non | Conforme display-only |
| Bonds | Oui | Tri/normalisation d’affichage | Non | Conforme source |
| HV term structure | Oui | Non | Non | Conforme |
| HV curve 28j | Clôtures API ; courbe native absente | Non ; bloc indisponible | Non | Conforme display-only |
| Profile | Oui | Formatage uniquement | Non | Conforme API |

## 8. Conclusion et actions restantes

Le sidebar droit est désormais strictement API-first et display-only en mode réel. Les routes API sont consommées par les repositories et les hooks ; les champs absents restent N/D ou rendent leur bloc indisponible.

Les calculs locaux subsistent uniquement pour le mode mock et ne peuvent plus fournir de valeur visible dans le flux réel. Les fallbacks de catalogue et les valeurs locales UEMOA/XOF/Other du mapping screener ont été supprimés au profit de N/D.

Actions restantes, hors correction frontend :

1. conserver le libellé « Highest clearing yield bonds » : l’API fournit `clearing_yield`, pas un champ YTM natif ;
2. rendre le statut stale explicite pour les réponses API conservées après erreur ;
3. corriger l’authentification API à l’origine du HTTP 401 sur results ;
4. ne pas demander globalement au backend les champs de rendement ou de volatilité : l’API fournit déjà le rendement YTD/les performances, dividend_yield et la structure HV hv_10 à hv_252. Les besoins backend encore démontrés concernent uniquement la saisonnalité native, la recommandation/objectif natifs et, si elle doit rester affichée, une courbe de volatilité 28 jours native. Le champ payout_ratio est déjà exposé mais vaut null pour SICOR_CI.

~~~text
API-first pour les données directes : OUI
Display-only sans calcul local en mode réel : OUI
Fallback catalogue dans la synchronisation Redux → contexte : éliminé
Fallback métadonnées UEMOA/XOF/Other dans le mapping screener : éliminé, absence => N/D
Calculs locaux affichés en mode réel : NON
Calculs locaux conservés pour le mode mock : OUI, isolés
Sidebar globalement conforme : OUI, sous réserve des limites API documentées
~~~

## 9. Fichiers vérifiés

- Docs/API_FIRST_ABSOLUTE_RULE.md
- Docs/ARCHITECTURE_DATA_FLOW.md
- components/technical-analysis/components/sidebar/TechnicalAnalysisSidebarContent.tsx
- components/technical-analysis/components/sidebar/hooks/useTechnicalAnalysisSidebarController.ts
- components/technical-analysis/components/sidebar/hooks/useSidebarDerivedMetrics.ts
- components/technical-analysis/components/sidebar/hooks/useSidebarDataFeeds.ts
- components/technical-analysis/components/sidebar/data/sidebarDataPortAdapter.ts
- components/technical-analysis/components/sidebar/data/sidebarProvenance.ts
- components/technical-analysis/components/sidebar/data/sidebarDataTypes.ts
- components/technical-analysis/components/sidebar/charts/sidebarVolatilityChartOptions.ts
- components/technical-analysis/components/sidebar/hooks/useSidebarCharts.ts
- shared/utils/volatility-engine.ts
- components/technical-analysis/context/TechnicalAnalysisProviders.tsx
- components/technical-analysis/TechnicalAnalysis.tsx
- components/technical-analysis/components/toolbar/ChartToolbar.tsx
- components/technical-analysis/components/sidebar/panels/WatchlistPanel.tsx

## 10. Correctifs et validation finale du 14 août 2026

Correctifs appliqués :

- `useSidebarDerivedMetrics.ts` : saisonnalité, recommandation technique, modèle heuristic et ratios de dividendes locaux désactivés en mode réel ;
- `useSidebarCharts.ts` : courbe de volatilité 28 jours locale limitée au mode mock ;
- `TechnicalAnalysisSidebarContent.tsx` : états indisponibles et libellés de provenance API explicitement affichés ; faute `sono` corrigée en `sont` ;
- `sidebarProvenance.ts` et `sidebarDataTypes.ts` : provenance absente affichée `Source API indisponible` ou `Source API non vérifiée`, jamais catalogue local ;
- `sidebarDataPortAdapter.ts` : pays, devise et secteur absents du payload API affichés `N/D`, sans fallback `UEMOA`, `XOF` ou `Other`.

Preuves :

- changesets TENOR terminaux : `cs-db4862017e3847f4aec8`, `cs-7e9a7207755c40c4aa08`, `cs-19e90a2f2c624943b502`, `cs-8a152b05abc24d48a966` ;
- `git diff --check` validé par les workers TENOR ;
- ESLint ciblé validé sur les fichiers corrigés ;
- CDP : routes `actions` API observées, états réels Seasonals/Technicals/Model/volatilité affichés indisponibles lorsque les champs natifs manquent ;
- console CDP : HTTP 401 sur `results` identifié, aucune substitution locale observée.

Verdict final : le frontend respecte désormais API_FIRST_ABSOLUTE_RULE.md et ARCHITECTURE_DATA_FLOW.md pour le flux réel ; les limites restantes relèvent de la disponibilité et du contrat de l’API backend.
- components/technical-analysis/components/sidebar/hooks/useSidebarMarketClock.ts

Note : ce rapport est documentaire. Aucun code applicatif n’a été modifié pour sa création.


## 11. Mise a jour de verification — 18 aout 2026

Le recheck final du flux reel confirme :

- la variation absolue n.est pas calculée depuis les clôtures OHLCV ; pour SICOR, l.API fournit price, prev_close et change_1d_pct, mais aucun champ natif change_1d ou price_change ; le sidebar affiche donc 3995,00 XOF, N/D et (+0.00%) ;
- prix, volume et devise absents ne sont plus remplaces par 0 ou XOF ;
- performance et volatilite utilisent uniquement les champs natifs API ;
- la courbe Historical volatility curve (28 days) reste indisponible tant quaucune courbe native API nest fournie ;
- le statut de séance affiché Market closed est un état de présentation produit par le market-clock et son calendrier de séance configuré ; il ne constitue pas un champ financier API et ne remplace aucune donnée de marché.
- le catalogue BRVM nest pas charge comme source runtime du flux marche ; UNAVAILABLE_SECURITY est uniquement un etat vide dindisponibilite.

### 11.1 Frontiere API et presentation

Les valeurs financières disponibles sont API-only en mode réel. Un champ absent reste N/D ou indisponible ; aucune différence de prix n.est calculée localement. Restent locales par nature : titres et labels UI, messages N/D, formatage numerique, locale, tri et limitation des obligations, rendu graphique et normalisation d unite. Ces transformations ne constituent ni une source financiere locale ni un fallback metier.

### 11.2 Validation du recheck

~~~text
Recherche ciblee des fallbacks et calculs locaux : effectuee
git diff --check : valide
tsc --noEmit : valide
~~~

Verdict actualise : API-first et display-only confirmes pour le mode reel ; aucune valeur financiere mock ou calculee localement ne complete le sidebar.


## 12. Cloture de l audit des 12 sous-sections

La revue finale couvre les douze sous-sections du sidebar droit, dans leur ordre d affichage : identite et cotation, actualites, statistiques cles, dividendes, performance, saisonnalite, technicals, model heuristic, obligations a plus haut clearing yield, term structure de volatilite, courbe de volatilite 28 jours et profil.

Pour chaque sous-section, le rapport distingue la donnee API native, la valeur null, l absence de champ, la presentation UI et les transformations de transport autorisees. En mode reel, aucun calcul financier local et aucun fallback catalogue ne complete une reponse API. Les blocs sans contrat API natif affichent N/D ou un etat indisponible.

Etat final :

~~~text
Sous-sections auditees                         12 / 12
Donnees financieres API-first en mode reel     OUI
Calcul financier local visible en mode reel    NON
Fallback financier local en mode reel          NON
Champs API absents signales explicitement      OUI
Limites backend documentees                     OUI
Rapport coherent et finalise                   OUI
~~~

Limites restantes : elles concernent le contrat ou la disponibilite backend (results HTTP 401, saisonnalite native, recommandation et objectif natifs, courbe native 28 jours), et non une substitution locale du frontend.

Document finalise pour revue manageriale. Extrait de code applicatif non modifie dans cette revue.
