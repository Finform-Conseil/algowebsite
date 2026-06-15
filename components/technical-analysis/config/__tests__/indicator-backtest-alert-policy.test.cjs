/* eslint-env node */
const assert = require("node:assert/strict");
const test = require("node:test");

require("../../store/__tests__/testTypeScriptLoader.cjs");

const indicatorBacktestAlertPolicy = require("../indicators/indicatorBacktestAlertPolicy.ts");
const indicatorBacktestBatchCache = require("../indicators/indicatorBacktestBatchCache.ts");
const indicatorBacktestSupplementalData = require("../indicators/indicatorBacktestSupplementalData.ts");
const indicatorBacktestDashboard = require("../indicators/indicatorBacktestDashboard.ts");
const indicatorBacktestWorkerProtocol = require("../indicators/indicatorBacktestWorkerProtocol.ts");
const indicatorResearchGradePolicy = require("../indicators/indicatorResearchGradePolicy.ts");
const indicatorRuntimeAlertCatalog = require("../indicators/indicatorRuntimeAlertCatalog.ts");

const buildInventory = () => indicatorResearchGradePolicy.buildIndicatorResearchGradeInventory({
  indicatorPeriods: { sma1: 5, sma2: 10, sma3: 20, rsiPeriod: 14 },
});

const makeFamilyBacktestSeries = (count = 260) => Array.from({ length: count }, (_, index) => {
  const wave = Math.sin(index / 4) * 9 + Math.cos(index / 11) * 5;
  const close = 120 + index * 0.08 + wave;
  const open = close - Math.sin(index / 3) * 1.6;
  return {
    close,
    high: Math.max(open, close) + 1.4 + (index % 5) * 0.08,
    low: Math.min(open, close) - 1.3 - (index % 3) * 0.06,
    open,
    time: new Date(Date.UTC(2025, 0, index + 1)).toISOString(),
    volume: 2000 + index * 17 + (index % 7) * 53,
  };
});

const getEntry = (id) => {
  const entry = buildInventory().find((candidate) => candidate.id === id);
  assert.ok(entry, 'missing inventory entry ' + id);
  return entry;
};

test("every research-grade inventory entry has explicit alert and backtest policy", () => {
  const inventory = buildInventory();
  assert.equal(inventory.length, 224);

  const uncovered = inventory
    .filter((entry) => {
      const alert = indicatorBacktestAlertPolicy.getIndicatorAlertTemplate(entry);
      const backtest = indicatorBacktestAlertPolicy.getIndicatorBacktestPolicy(entry);
      return !alert.route || !alert.reason || !backtest.reason || backtest.horizonBars < 0;
    })
    .map((entry) => entry.id);

  assert.deepEqual(uncovered, []);
});

test("alert routes are honest about current engine compatibility", () => {
  const byId = new Map(buildInventory().map((entry) => [entry.id, entry]));
  const rsi = indicatorBacktestAlertPolicy.getIndicatorAlertTemplate(byId.get("advanced:rsi"));
  const sma200 = indicatorBacktestAlertPolicy.getIndicatorAlertTemplate(byId.get("trend:is_above_sma200"));
  const volumeProfile = indicatorBacktestAlertPolicy.getIndicatorAlertTemplate(byId.get("advanced:volumeProfile"));
  const doji = indicatorBacktestAlertPolicy.getIndicatorAlertTemplate(byId.get("advanced:doji"));

  assert.equal(rsi.route, "indicator-runtime");
  assert.equal(rsi.metric, "indicator");
  assert.equal(sma200.route, "legacy-price-modal");
  assert.equal(sma200.condition, "GREATER_THAN");
  assert.equal(volumeProfile.route, "indicator-runtime");
  assert.equal(volumeProfile.metric, "indicator");
  assert.equal(doji.route, "legacy-price-modal");
  assert.equal(doji.requiresConfirmation, true);
});

test("runtime indicator route covers every scalar advanced family entry", () => {
  const inventory = buildInventory();
  const routes = inventory.reduce((counts, entry) => {
    const alert = indicatorBacktestAlertPolicy.getIndicatorAlertTemplate(entry);
    counts[alert.route] = (counts[alert.route] || 0) + 1;
    return counts;
  }, {});
  const runtimeEntries = inventory.filter((entry) => indicatorRuntimeAlertCatalog.isIndicatorRuntimeAlertInventoryId(entry.id));
  const badRuntimeRoutes = runtimeEntries
    .filter((entry) => indicatorBacktestAlertPolicy.getIndicatorAlertTemplate(entry).route !== "indicator-runtime")
    .map((entry) => entry.id);
  const missingRuntimeKey = runtimeEntries
    .filter((entry) => !indicatorRuntimeAlertCatalog.getIndicatorRuntimeAlertKeyForInventoryId(entry.id))
    .map((entry) => entry.id);

  assert.equal(inventory.length, 224);
  assert.equal(runtimeEntries.length, 105);
  assert.equal(routes["indicator-runtime"], 105);
  assert.equal(routes["indicator-engine-required"] || 0, 0);
  assert.deepEqual(badRuntimeRoutes, []);
  assert.deepEqual(missingRuntimeKey, []);
});


test("every research-grade family has an explicit backtest signal strategy", () => {
  const inventory = buildInventory();
  const missing = inventory
    .filter((entry) => !indicatorBacktestAlertPolicy.getIndicatorFamilyBacktestStrategy(entry).reason)
    .map((entry) => entry.id);
  const families = new Set(inventory.map((entry) => entry.policy.family));
  const models = new Set(inventory.map((entry) => indicatorBacktestAlertPolicy.getIndicatorFamilyBacktestStrategy(entry).signalModel));

  assert.deepEqual(missing, []);
  assert.deepEqual([...families].sort(), [
    "candlestick-pattern",
    "moving-average",
    "oscillator",
    "price-action",
    "price-vs-average",
    "support-resistance",
    "trend",
    "trend-signal",
    "volatility",
    "volume-liquidity",
  ]);
  assert.ok(models.has("price-cross"));
  assert.ok(models.has("threshold-cross"));
  assert.ok(models.has("state-transition"));
  assert.ok(models.has("event-confirmation"));
  assert.ok(models.has("volatility-expansion"));
});

test("family signal builder produces directional signals for oscillator, MA, volatility and volume", () => {
  const data = makeFamilyBacktestSeries();
  const rsiSignals = indicatorBacktestAlertPolicy.buildIndicatorFamilyBacktestSignals(data, getEntry("advanced:rsi"));
  const smaSignals = indicatorBacktestAlertPolicy.buildIndicatorFamilyBacktestSignals(data, getEntry("ma:sma_20"));
  const bbSignals = indicatorBacktestAlertPolicy.buildIndicatorFamilyBacktestSignals(data, getEntry("advanced:bollinger"));
  const obvSignals = indicatorBacktestAlertPolicy.buildIndicatorFamilyBacktestSignals(data, getEntry("advanced:obv"));

  assert.ok(rsiSignals.some((signal) => signal.direction === "bullish"));
  assert.ok(rsiSignals.some((signal) => signal.direction === "bearish"));
  assert.ok(smaSignals.length > 0);
  assert.ok(bbSignals.some((signal) => signal.direction === "bullish" || signal.direction === "bearish"));
  assert.ok(obvSignals.some((signal) => signal.direction === "bullish" || signal.direction === "bearish"));
});

test("volatility-only indicators backtest as neutral context instead of fake direction", () => {
  const data = makeFamilyBacktestSeries();
  const hvEntry = getEntry("advanced:hv20");
  const strategy = indicatorBacktestAlertPolicy.getIndicatorFamilyBacktestStrategy(hvEntry);
  const signals = indicatorBacktestAlertPolicy.buildIndicatorFamilyBacktestSignals(data, hvEntry);
  const summary = indicatorBacktestAlertPolicy.summarizeIndicatorBacktest(
    data,
    signals,
    indicatorBacktestAlertPolicy.getIndicatorBacktestPolicy(hvEntry),
  );

  assert.equal(strategy.signalModel, "volatility-expansion");
  assert.equal(strategy.directionModel, "neutral");
  assert.ok(signals.length > 0);
  assert.equal(signals.every((signal) => signal.direction === "neutral"), true);
  assert.equal(summary.trades, 0);
  assert.equal(summary.ignored, signals.length);
});

test("built family signals plug into the existing walk-forward summary", () => {
  const data = makeFamilyBacktestSeries();
  const entry = getEntry("advanced:macd");
  const policy = indicatorBacktestAlertPolicy.getIndicatorBacktestPolicy(entry);
  const signals = indicatorBacktestAlertPolicy.buildIndicatorFamilyBacktestSignals(data, entry);
  const summary = indicatorBacktestAlertPolicy.summarizeIndicatorBacktest(data, signals, policy);

  assert.ok(signals.length > 0);
  assert.ok(summary.trades > 0);
  assert.equal(summary.ignored >= 0, true);
  assert.equal(typeof summary.winRate, "number");
});

test("backtest batch cache normalizes symbols, skips empty comparisons and fingerprints periods", () => {
  const data = makeFamilyBacktestSeries(90);
  const altData = makeFamilyBacktestSeries(90).map((point, index) => (
    index === 89 ? { ...point, close: point.close + 3 } : point
  ));
  const periods = { sma1: 5, sma2: 10, sma3: 20, rsiPeriod: 14 };
  const inputs = indicatorBacktestBatchCache.normalizeIndicatorBacktestBatchInputs(
    { symbol: " boab ", data },
    [
      { symbol: "snts", data },
      { symbol: "SNTS", data: altData },
      { symbol: "empty", data: [] },
    ],
  );
  const baseKey = indicatorBacktestBatchCache.createIndicatorBacktestCacheKey(inputs[0], periods);
  const changedDataKey = indicatorBacktestBatchCache.createIndicatorBacktestCacheKey({ symbol: "BOAB", data: altData }, periods);
  const changedPeriodsKey = indicatorBacktestBatchCache.createIndicatorBacktestCacheKey(inputs[0], {
    ...periods,
    rsiPeriod: 9,
  });

  assert.deepEqual(inputs.map((entry) => entry.symbol), ["BOAB", "SNTS"]);
  assert.equal(indicatorBacktestBatchCache.resolveIndicatorBacktestWorkerTimeoutMs(inputs), 4000 + 1200);
  assert.equal(indicatorBacktestBatchCache.resolveIndicatorBacktestWorkerTimeoutMs([
    { symbol: "BOAB", data: makeFamilyBacktestSeries(6000) },
    { symbol: "SNTS", data: makeFamilyBacktestSeries(6000) },
  ]), 4000 + 12 * 1200);
  assert.equal(indicatorBacktestBatchCache.resolveIndicatorBacktestWorkerTimeoutMs([
    { symbol: "BOAB", data: makeFamilyBacktestSeries(80000) },
  ]), 30000);
  assert.notEqual(baseKey, changedDataKey);
  assert.notEqual(baseKey, changedPeriodsKey);
});

test("backtest supplemental data selects missing comparison series and merges fetched data", () => {
  const data = makeFamilyBacktestSeries(90);
  const supplemental = makeFamilyBacktestSeries(80);
  const comparisons = [
    { symbol: "snts", data: [] },
    { symbol: "BOAB", data: [] },
    { symbol: "sgbc", data },
    { symbol: "SNTS", data: [] },
  ];
  const missing = indicatorBacktestSupplementalData.selectMissingIndicatorBacktestSupplementalSymbols(
    "boab",
    comparisons,
    {},
  );
  const merged = indicatorBacktestSupplementalData.mergeIndicatorBacktestSupplementalInputs(
    comparisons,
    { SNTS: supplemental },
  );

  assert.deepEqual(missing, ["SNTS"]);
  assert.equal(merged[0].symbol, "SNTS");
  assert.equal(merged[0].data, supplemental);
  assert.equal(merged[1].symbol, "BOAB");
  assert.equal(merged[1].data.length, 0);
  assert.equal(merged[2].symbol, "SGBC");
  assert.equal(merged[2].data, data);
});

test("backtest worker protocol round-trips OHLCV data and preserves nullable trades", () => {
  const data = makeFamilyBacktestSeries(3).map((point, index) => ({
    ...point,
    tradesCount: index === 1 ? null : 10 + index,
  }));
  const payload = indicatorBacktestWorkerProtocol.serializeIndicatorBacktestWorkerPayload(
    data,
    7,
    { indicatorPeriods: { sma1: 5, sma2: 10, sma3: 20, rsiPeriod: 14 } },
  );
  const restored = indicatorBacktestWorkerProtocol.deserializeIndicatorBacktestWorkerData(
    payload.request.buffer,
    payload.request.length,
  );

  assert.equal(payload.request.messageId, 7);
  assert.equal(payload.transferables.length, 1);
  assert.equal(restored.length, data.length);
  assert.equal(restored[0].close, data[0].close);
  assert.equal(restored[0].volume, data[0].volume);
  assert.equal(restored[0].tradesCount, 10);
  assert.equal(restored[1].tradesCount, null);
  assert.match(restored[0].time, /^2025-/);
});

test("backtest worker protocol serializes a multi-ticker batch", () => {
  const first = makeFamilyBacktestSeries(4);
  const second = makeFamilyBacktestSeries(5).map((point) => ({ ...point, trades_count: 12 }));
  const payload = indicatorBacktestWorkerProtocol.serializeIndicatorBacktestWorkerBatchPayload(
    [
      { symbol: " boab ", data: first },
      { symbol: "snts", data: second },
    ],
    11,
    { indicatorPeriods: { sma1: 5, sma2: 10, sma3: 20, rsiPeriod: 14 } },
  );

  assert.equal(payload.request.kind, "batch");
  assert.equal(payload.request.messageId, 11);
  assert.equal(payload.request.items.length, 2);
  assert.equal(payload.request.items[0].symbol, "BOAB");
  assert.equal(payload.request.items[1].symbol, "SNTS");
  assert.equal(payload.transferables.length, 2);
  assert.equal(indicatorBacktestWorkerProtocol.deserializeIndicatorBacktestWorkerData(
    payload.request.items[0].buffer,
    payload.request.items[0].length,
  ).length, first.length);
  assert.equal(indicatorBacktestWorkerProtocol.deserializeIndicatorBacktestWorkerData(
    payload.request.items[1].buffer,
    payload.request.items[1].length,
  )[0].tradesCount, 12);
});

test("backtest dashboard exposes every research-grade family with bounded sample data", () => {
  const dashboard = indicatorBacktestDashboard.buildIndicatorBacktestDashboard(
    makeFamilyBacktestSeries(900),
    { indicatorPeriods: { sma1: 5, sma2: 10, sma3: 20, rsiPeriod: 14 } },
  );

  assert.equal(dashboard.totalIndicators, 224);
  assert.equal(dashboard.bars, 900);
  assert.equal(dashboard.sampleBars, 360);
  assert.equal(dashboard.families.length, 10);
  assert.equal(dashboard.status, "ready");
  assert.ok(dashboard.trades > 0);
  assert.ok(dashboard.evaluatedIndicators > 0);
  assert.ok(dashboard.topFamily);
  assert.deepEqual(
    dashboard.families.map((family) => family.family).sort(),
    [
      "candlestick-pattern",
      "moving-average",
      "oscillator",
      "price-action",
      "price-vs-average",
      "support-resistance",
      "trend",
      "trend-signal",
      "volatility",
      "volume-liquidity",
    ],
  );
  assert.equal(dashboard.families.every((family) => family.entries > 0), true);
  assert.equal(dashboard.families.every((family) => family.signalModels.length > 0), true);
});

test("backtest dashboard degrades honestly when history is too short", () => {
  const dashboard = indicatorBacktestDashboard.buildIndicatorBacktestDashboard(
    makeFamilyBacktestSeries(20),
    { indicatorPeriods: { sma1: 5, sma2: 10, sma3: 20, rsiPeriod: 14 } },
  );

  assert.equal(dashboard.status, "insufficient-data");
  assert.equal(dashboard.sampleBars, 20);
  assert.equal(dashboard.trades, 0);
  assert.equal(dashboard.evaluatedIndicators, 0);
  assert.equal(dashboard.topFamily, null);
  assert.equal(dashboard.families.every((family) => family.status === "insufficient-data"), true);
});

test("backtest summary handles cooldowns, invalid inputs and bearish direction", () => {
  const policy = {
    enabled: true,
    horizonBars: 2,
    minTrades: 1,
    cooldownBars: 1,
    maxSignals: 10,
    rejectsSparseLiquidity: false,
    reason: "test",
  };
  const data = [100, 105, 110, 108, 104, 99].map((close, index) => ({
    time: String(index),
    open: close,
    high: close + 1,
    low: close - 1,
    close,
    volume: 1000,
  }));
  const summary = indicatorBacktestAlertPolicy.summarizeIndicatorBacktest(
    data,
    [
      { index: 0, direction: "bullish" },
      { index: 1, direction: "bullish" },
      { index: 2, direction: "bearish" },
      { index: 5, direction: "bullish" },
    ],
    policy,
  );

  assert.equal(summary.trades, 2);
  assert.equal(summary.ignored, 2);
  assert.equal(summary.wins, 2);
  assert.equal(summary.winRate, 100);
  assert.equal(summary.averageReturnPct, 7.7272);
  assert.equal(summary.maxAdverseReturnPct, 5.4545);
});
