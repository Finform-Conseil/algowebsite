# Graph Report - algowebsite  (2026-05-20)

## Corpus Check
- 373 files · ~363,895 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1395 nodes · 1510 edges · 41 communities detected
- Extraction: 83% EXTRACTED · 17% INFERRED · 0% AMBIGUOUS · INFERRED: 255 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 120|Community 120]]

## God Nodes (most connected - your core abstractions)
1. `distanceBetweenPoints()` - 17 edges
2. `LineMeasureStrategy` - 16 edges
3. `distToSegment()` - 16 edges
4. `handleRequest()` - 16 edges
5. `DrawingRenderer` - 14 edges
6. `renderForecastingGhostFeed()` - 14 edges
7. `diagonal()` - 12 edges
8. `fetchWithResilience()` - 11 edges
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
Cohesion: 0.04
Nodes (42): hitTestCurve(), renderCurve(), drawArrowhead(), hitTestPath(), renderPath(), hitTestPolyline(), renderPolyline(), hitTestProjection() (+34 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (33): renderABCD(), hitTestCyclicLines(), renderCyclicLines(), renderCypher(), hitTestElliottCorrectionWave(), renderElliottCorrectionWave(), hitTestElliottDoubleComboWave(), renderElliottDoubleComboWave() (+25 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (33): addToCache(), calculateVolumeProfileHDR(), getGridRect(), getPriceAxisInfo(), hitTestFixedRangeVolumeProfile(), renderFixedRangeVolumeProfile(), resolveBarIndex(), buildAnchoredVWAPSeries() (+25 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (27): GET(), cleanNumber(), extractFromPage(), fetchDividendDetails(), GET(), lookupTicker(), removeAccents(), stripSuffix() (+19 more)

### Community 4 - "Community 4"
Cohesion: 0.1
Nodes (24): hitTestFibChannel(), renderFibChannel(), hitTestFibRetracement(), renderFibRetracement(), hitTestFibSpeedResistanceArcs(), renderFibSpeedResistanceArcs(), getRenderRect(), hitTestFibSpeedResistanceFan() (+16 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (13): buildSecondarySymbolCandidates(), createDefaultMultiChartLayout(), createLayoutCells(), createPresetLayout(), getLayoutDefinition(), getUniqueLayoutSymbols(), hasCollapsedLayoutSymbols(), isDenseMultiChartLayout() (+5 more)

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (24): hitTestLongPosition(), renderLongPosition(), hitTestShortPosition(), renderShortPosition(), crisp(), drawCircleHandle(), drawLabelBar(), drawRRPill() (+16 more)

### Community 8 - "Community 8"
Cohesion: 0.1
Nodes (14): applyStyle(), clamp(), createCrosshairElement(), createDataWindowColumn(), fallbackCursorDateText(), formatCursorDateText(), getOverlayScale(), resolveChartPixelFromClient() (+6 more)

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (17): clampViewportWindow(), computeDirectionalZoomViewport(), computeHorizontalPanViewport(), getViewportSpanBounds(), lerp(), useChartViewport(), buildBandFillData(), buildComparisonPriceLookup() (+9 more)

### Community 10 - "Community 10"
Cohesion: 0.14
Nodes (17): DELETE(), GET(), handleRequest(), HEAD(), OPTIONS(), PATCH(), POST(), PUT() (+9 more)

### Community 11 - "Community 11"
Cohesion: 0.1
Nodes (6): getToolGroup(), getToolsByGroup(), getToolSpec(), handleChartClick(), applyMagnet(), pixelToPoint()

### Community 12 - "Community 12"
Cohesion: 0.1
Nodes (9): GlobalNotificationProvider(), useGlobalNotification(), useModalOrchestrator(), useTechnicalAnalysisActions(), getMockNotifications(), parseCSVLine(), parseIndicatorCSV(), useMarketData() (+1 more)

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (8): buildMiniChartOption(), buildMiniOhlcvOption(), buildMiniOhlcvTooltip(), buildMiniSparklineOption(), escapeHtml(), formatCompactNumber(), formatDate(), getMiniChartSeries()

### Community 14 - "Community 14"
Cohesion: 0.23
Nodes (17): buildPriceDrivenGeometry(), convertDataPointToPixel(), convertPixelToDataPoint(), hitTestForecastingGhostFeed(), renderForecastingGhostFeed(), resolveAnchorIndex(), resolveAnchorPrice(), analyzeProfile() (+9 more)

### Community 15 - "Community 15"
Cohesion: 0.12
Nodes (5): BaseSchema, BooleanSchema, NativeEnumSchema, ObjectSchema, StringSchema

### Community 16 - "Community 16"
Cohesion: 0.14
Nodes (8): getTADatabase(), idbGet(), idbSet(), isChartTimeValue(), isChartUsable(), safeConvertFromPixel(), safeConvertToPixel(), SpatialHashGrid

### Community 17 - "Community 17"
Cohesion: 0.23
Nodes (13): computeProportionalTimeRange(), dispatchCrosshair(), dispatchTimeRange(), findClosestIndex(), firstRecord(), getIntervalDays(), isRecord(), readAxisValue() (+5 more)

### Community 18 - "Community 18"
Cohesion: 0.2
Nodes (4): CircuitBreaker, getCircuitBreaker(), fetchWithRetry(), performFetchWithRetry()

### Community 20 - "Community 20"
Cohesion: 0.15
Nodes (4): calculateEMA(), calculateMACD(), calculateRSI(), calculateStochasticRSI()

### Community 21 - "Community 21"
Cohesion: 0.24
Nodes (7): handleClose(), findSecurityBySymbol(), handleEsc(), normalizeSearch(), renderInstrumentRow(), resolveSecurityTicker(), scoreSecurity()

### Community 23 - "Community 23"
Cohesion: 0.24
Nodes (4): formatPrice(), formatVolume(), initialOhlc(), updateOhlcFromPoint()

### Community 25 - "Community 25"
Cohesion: 0.33
Nodes (4): buildMiniChartOption(), buildMiniOhlcvOption(), buildMiniSparklineOption(), getMiniChartSeries()

### Community 27 - "Community 27"
Cohesion: 0.28
Nodes (3): generateInsights(), getTopGainers(), getTopLosers()

### Community 30 - "Community 30"
Cohesion: 0.32
Nodes (4): getOptionLabel(), getOptionValue(), getSelectedLabel(), toggleOption()

### Community 32 - "Community 32"
Cohesion: 0.32
Nodes (3): cloneIconWithActiveState(), renderCategoryToolIcon(), renderTrendToolIcon()

### Community 33 - "Community 33"
Cohesion: 0.29
Nodes (2): handleMove(), onMouseDown()

### Community 37 - "Community 37"
Cohesion: 0.48
Nodes (4): checkRateLimit(), checkRedisStatus(), InMemoryRateLimiter, markRedisDown()

### Community 39 - "Community 39"
Cohesion: 0.33
Nodes (2): calculatePortfolioValue(), calculateTotalGain()

### Community 40 - "Community 40"
Cohesion: 0.33
Nodes (2): getAllIndicators(), getIndicatorById()

### Community 43 - "Community 43"
Cohesion: 0.4
Nodes (2): getRatioTrend(), renderProfitability()

### Community 44 - "Community 44"
Cohesion: 0.4
Nodes (2): renderChart(), renderVolumeChart()

### Community 48 - "Community 48"
Cohesion: 0.4
Nodes (2): createUiId(), handleKeyDown()

### Community 49 - "Community 49"
Cohesion: 0.53
Nodes (4): getTradingViewControls(), handlePan(), handleReset(), handleZoom()

### Community 57 - "Community 57"
Cohesion: 0.7
Nodes (4): getAverageYTDReturn(), getSelectedExchangesData(), getTotalMarketCap(), getTotalVolume()

### Community 61 - "Community 61"
Cohesion: 0.5
Nodes (2): getColorForExchange(), getCountryColor()

### Community 84 - "Community 84"
Cohesion: 0.5
Nodes (2): updateDrawing(), handleClick()

### Community 85 - "Community 85"
Cohesion: 0.67
Nodes (2): handleOrderSubmit(), resetModal()

### Community 87 - "Community 87"
Cohesion: 0.67
Nodes (2): getCompareSeriesId(), normalizeCompareSymbol()

### Community 88 - "Community 88"
Cohesion: 0.67
Nodes (1): StrategyRegistry

### Community 97 - "Community 97"
Cohesion: 0.5
Nodes (2): StoreProvider(), makeStore()

### Community 120 - "Community 120"
Cohesion: 1.0
Nodes (2): formatCurrency(), formatLargeCurrency()

## Knowledge Gaps
- **2 isolated node(s):** `BooleanSchema`, `NativeEnumSchema`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 33`** (8 nodes): `handleAlphaChange()`, `handleHexChange()`, `handleHueChange()`, `handleMove()`, `handleSatValChange()`, `onMouseDown()`, `switch()`, `ProColorPicker.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (7 nodes): `WatchlistPortfolioData.ts`, `calculatePortfolioValue()`, `calculateTotalGain()`, `formatCurrency()`, `formatPercent()`, `getAlertColor()`, `getAlertIcon()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (7 nodes): `StockComparison.ts`, `getAllIndicators()`, `getIndicatorById()`, `getStocksByCountry()`, `getStocksByMarket()`, `getStocksBySector()`, `getTemplateById()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (6 nodes): `FinancialRatios.tsx`, `getRatioTrend()`, `renderEfficiency()`, `renderLeverage()`, `renderLiquidity()`, `renderProfitability()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (6 nodes): `PerformanceCharts.tsx`, `formatCurrency()`, `generateChartData()`, `getExchangeColor()`, `renderChart()`, `renderVolumeChart()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (6 nodes): `TechnicalAnalysis.tsx`, `createUiId()`, `formatPriceAxisTimeLabel()`, `handleKeyDown()`, `handleToggleClick()`, `initialSetup()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (5 nodes): `AfricaOPCVMMap.tsx`, `getColorForExchange()`, `getCountryColor()`, `handleBackToAfrica()`, `handleExchangeClick()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 84`** (4 nodes): `DrawingSettingsModal.tsx`, `ToolbarButton.tsx`, `updateDrawing()`, `handleClick()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 85`** (4 nodes): `BrokerModal.tsx`, `handleOrderSubmit()`, `renderConnectedBrokerFlow()`, `resetModal()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 87`** (4 nodes): `compareSeries.ts`, `getCompareSeriesColor()`, `getCompareSeriesId()`, `normalizeCompareSymbol()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 88`** (4 nodes): `DrawingStrategyRegistry.ts`, `StrategyRegistry`, `.getStrategy()`, `.initialize()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 97`** (4 nodes): `index.ts`, `StoreProvider.tsx`, `StoreProvider()`, `makeStore()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 120`** (3 nodes): `page.tsx`, `formatCurrency()`, `formatLargeCurrency()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `distanceBetweenPoints()` connect `Community 2` to `Community 0`, `Community 4`, `Community 7`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `distToSegment()` connect `Community 0` to `Community 2`, `Community 4`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Why does `getSafeGridRect()` connect `Community 4` to `Community 9`, `Community 2`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `distanceBetweenPoints()` (e.g. with `.hitTest()` and `.hitTest()`) actually correct?**
  _`distanceBetweenPoints()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 15 inferred relationships involving `distToSegment()` (e.g. with `.hitTest()` and `.hitTest()`) actually correct?**
  _`distToSegment()` has 15 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `handleRequest()` (e.g. with `getCachedResponse()` and `sanitizePath()`) actually correct?**
  _`handleRequest()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `BooleanSchema`, `NativeEnumSchema` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._