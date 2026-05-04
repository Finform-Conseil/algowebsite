# Graph Report - algowebsite  (2026-05-04)

## Corpus Check
- 360 files · ~331,143 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1229 nodes · 1272 edges · 31 communities detected
- Extraction: 80% EXTRACTED · 20% INFERRED · 0% AMBIGUOUS · INFERRED: 249 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 108|Community 108]]
- [[_COMMUNITY_Community 110|Community 110]]

## God Nodes (most connected - your core abstractions)
1. `distanceBetweenPoints()` - 17 edges
2. `LineMeasureStrategy` - 16 edges
3. `distToSegment()` - 16 edges
4. `handleRequest()` - 16 edges
5. `renderForecastingGhostFeed()` - 14 edges
6. `diagonal()` - 12 edges
7. `fetchWithResilience()` - 11 edges
8. `DrawingRenderer` - 11 edges
9. `renderForecastingLongPosition()` - 11 edges
10. `renderForecastingShortPosition()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `getCircuitBreaker()` --calls--> `handleRequest()`  [INFERRED]
  shared/utils/circuit-breaker.ts → app/api/proxy/[...path]/route.ts
- `fetchWithResilience()` --calls--> `GET()`  [INFERRED]
  shared/utils/resilient-scraper.ts → app/api/market-data/brvm-bonds/route.ts
- `fetchWithResilience()` --calls--> `GET()`  [INFERRED]
  shared/utils/resilient-scraper.ts → app/api/market-data/brvm-news/route.ts
- `fetchWithResilience()` --calls--> `getBrvmCapHTML()`  [INFERRED]
  shared/utils/resilient-scraper.ts → app/api/market-data/brvm-live-capitalisation/route.ts
- `fetchWithResilience()` --calls--> `getBrvmIndicesHTML()`  [INFERRED]
  shared/utils/resilient-scraper.ts → app/api/market-data/indices/route.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (36): hitTestFibChannel(), renderFibChannel(), hitTestFibCircles(), renderFibCircles(), hitTestFibRetracement(), renderFibRetracement(), hitTestFibSpeedResistanceArcs(), renderFibSpeedResistanceArcs() (+28 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (33): renderABCD(), hitTestCyclicLines(), renderCyclicLines(), renderCypher(), hitTestElliottCorrectionWave(), renderElliottCorrectionWave(), hitTestElliottDoubleComboWave(), renderElliottDoubleComboWave() (+25 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (29): hitTestCurve(), renderCurve(), drawArrowhead(), hitTestPath(), renderPath(), hitTestPolyline(), renderPolyline(), hitTestProjection() (+21 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (35): addToCache(), calculateVolumeProfileHDR(), getGridRect(), getPriceAxisInfo(), hitTestFixedRangeVolumeProfile(), renderFixedRangeVolumeProfile(), resolveBarIndex(), buildAnchoredVWAPSeries() (+27 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (27): GET(), cleanNumber(), extractFromPage(), fetchDividendDetails(), GET(), lookupTicker(), removeAccents(), stripSuffix() (+19 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (19): DELETE(), GET(), handleRequest(), HEAD(), OPTIONS(), PATCH(), POST(), PUT() (+11 more)

### Community 7 - "Community 7"
Cohesion: 0.1
Nodes (6): getToolGroup(), getToolsByGroup(), getToolSpec(), handleChartClick(), applyMagnet(), pixelToPoint()

### Community 8 - "Community 8"
Cohesion: 0.17
Nodes (16): hitTestLongPosition(), renderLongPosition(), hitTestShortPosition(), renderShortPosition(), crisp(), drawCircleHandle(), drawLabelBar(), drawRRPill() (+8 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (5): BaseSchema, BooleanSchema, NativeEnumSchema, ObjectSchema, StringSchema

### Community 10 - "Community 10"
Cohesion: 0.13
Nodes (9): GlobalNotificationProvider(), useGlobalNotification(), useModalOrchestrator(), useTechnicalAnalysisActions(), getMockNotifications(), parseCSVLine(), parseIndicatorCSV(), useMarketData() (+1 more)

### Community 11 - "Community 11"
Cohesion: 0.26
Nodes (15): buildPriceDrivenGeometry(), convertDataPointToPixel(), convertPixelToDataPoint(), renderForecastingGhostFeed(), resolveAnchorIndex(), resolveAnchorPrice(), analyzeProfile(), asFiniteNumber() (+7 more)

### Community 13 - "Community 13"
Cohesion: 0.24
Nodes (9): clampViewportWindow(), computeDirectionalZoomViewport(), computeHorizontalPanViewport(), getViewportSpanBounds(), lerp(), useChartViewport(), useChartBadges(), useChartIndicators() (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.17
Nodes (2): calculateEMA(), calculateMACD()

### Community 18 - "Community 18"
Cohesion: 0.53
Nodes (8): crisp(), drawCircleHandle(), drawLabelBar(), drawRRPill(), drawSqHandle(), getLatestCloseData(), getMainGridRect(), renderForecastingLongPosition()

### Community 20 - "Community 20"
Cohesion: 0.28
Nodes (3): generateInsights(), getTopGainers(), getTopLosers()

### Community 23 - "Community 23"
Cohesion: 0.32
Nodes (4): getOptionLabel(), getOptionValue(), getSelectedLabel(), toggleOption()

### Community 25 - "Community 25"
Cohesion: 0.32
Nodes (3): cloneIconWithActiveState(), renderCategoryToolIcon(), renderTrendToolIcon()

### Community 26 - "Community 26"
Cohesion: 0.29
Nodes (2): handleMove(), onMouseDown()

### Community 31 - "Community 31"
Cohesion: 0.33
Nodes (3): handleClose(), handleEsc(), handleSearchSubmit()

### Community 32 - "Community 32"
Cohesion: 0.48
Nodes (4): checkRateLimit(), checkRedisStatus(), InMemoryRateLimiter, markRedisDown()

### Community 34 - "Community 34"
Cohesion: 0.33
Nodes (2): calculatePortfolioValue(), calculateTotalGain()

### Community 35 - "Community 35"
Cohesion: 0.33
Nodes (2): getAllIndicators(), getIndicatorById()

### Community 38 - "Community 38"
Cohesion: 0.4
Nodes (2): getRatioTrend(), renderProfitability()

### Community 39 - "Community 39"
Cohesion: 0.4
Nodes (2): renderChart(), renderVolumeChart()

### Community 49 - "Community 49"
Cohesion: 0.7
Nodes (4): getAverageYTDReturn(), getSelectedExchangesData(), getTotalMarketCap(), getTotalVolume()

### Community 53 - "Community 53"
Cohesion: 0.5
Nodes (2): getColorForExchange(), getCountryColor()

### Community 75 - "Community 75"
Cohesion: 0.5
Nodes (2): updateDrawing(), handleClick()

### Community 77 - "Community 77"
Cohesion: 0.67
Nodes (1): StrategyRegistry

### Community 86 - "Community 86"
Cohesion: 0.5
Nodes (2): StoreProvider(), makeStore()

### Community 108 - "Community 108"
Cohesion: 1.0
Nodes (2): createIndicatorsWorker(), getBlobUrl()

### Community 110 - "Community 110"
Cohesion: 1.0
Nodes (2): formatCurrency(), formatLargeCurrency()

## Knowledge Gaps
- **2 isolated node(s):** `BooleanSchema`, `NativeEnumSchema`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 14`** (13 nodes): `TechnicalIndicators.ts`, `calculateATR()`, `calculateBollinger()`, `calculateCCI()`, `calculateEMA()`, `calculateMACD()`, `calculateOBV()`, `calculateROC()`, `calculateRSI()`, `calculateSMA()`, `calculateStochastic()`, `calculateWilliamsR()`, `generateInitialData()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (8 nodes): `handleAlphaChange()`, `handleHexChange()`, `handleHueChange()`, `handleMove()`, `handleSatValChange()`, `onMouseDown()`, `switch()`, `ProColorPicker.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (7 nodes): `WatchlistPortfolioData.ts`, `calculatePortfolioValue()`, `calculateTotalGain()`, `formatCurrency()`, `formatPercent()`, `getAlertColor()`, `getAlertIcon()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (7 nodes): `StockComparison.ts`, `getAllIndicators()`, `getIndicatorById()`, `getStocksByCountry()`, `getStocksByMarket()`, `getStocksBySector()`, `getTemplateById()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (6 nodes): `FinancialRatios.tsx`, `getRatioTrend()`, `renderEfficiency()`, `renderLeverage()`, `renderLiquidity()`, `renderProfitability()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (6 nodes): `PerformanceCharts.tsx`, `formatCurrency()`, `generateChartData()`, `getExchangeColor()`, `renderChart()`, `renderVolumeChart()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (5 nodes): `AfricaOPCVMMap.tsx`, `getColorForExchange()`, `getCountryColor()`, `handleBackToAfrica()`, `handleExchangeClick()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (4 nodes): `DrawingSettingsModal.tsx`, `ToolbarButton.tsx`, `updateDrawing()`, `handleClick()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 77`** (4 nodes): `DrawingStrategyRegistry.ts`, `StrategyRegistry`, `.getStrategy()`, `.initialize()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 86`** (4 nodes): `index.ts`, `StoreProvider.tsx`, `StoreProvider()`, `makeStore()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 108`** (3 nodes): `createIndicatorsWorker.ts`, `createIndicatorsWorker()`, `getBlobUrl()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 110`** (3 nodes): `page.tsx`, `formatCurrency()`, `formatLargeCurrency()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `distanceBetweenPoints()` connect `Community 3` to `Community 0`, `Community 8`, `Community 2`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `distToSegment()` connect `Community 2` to `Community 0`, `Community 3`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `hitTestGeometric()` connect `Community 2` to `Community 1`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `distanceBetweenPoints()` (e.g. with `.hitTest()` and `.hitTest()`) actually correct?**
  _`distanceBetweenPoints()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 15 inferred relationships involving `distToSegment()` (e.g. with `.hitTest()` and `.hitTest()`) actually correct?**
  _`distToSegment()` has 15 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `handleRequest()` (e.g. with `getCachedResponse()` and `sanitizePath()`) actually correct?**
  _`handleRequest()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `renderForecastingGhostFeed()` (e.g. with `.render()` and `asFiniteNumber()`) actually correct?**
  _`renderForecastingGhostFeed()` has 8 INFERRED edges - model-reasoned connections that need verification._