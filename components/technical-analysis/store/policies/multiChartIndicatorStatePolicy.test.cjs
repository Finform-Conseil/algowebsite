/* eslint-env node */
const assert = require("node:assert/strict");
const test = require("node:test");

require("../__tests__/testTypeScriptLoader.cjs");

const { completeMultiChartCell } = require("../../config/layout/multiChartCellState.ts");
const { initialState } = require("../initialState.ts");
const {
  createMultiChartIndicatorSnapshot,
  restoreCellIndicatorSnapshot,
  setCellIndicatorIds,
  setCellIndicatorSnapshot,
} = require("./multiChartIndicatorStatePolicy.ts");

const cloneState = () => JSON.parse(JSON.stringify(initialState));

const createCell = (chartId) => completeMultiChartCell({
  chartId,
  symbol: "ORANGE_CI",
  exchange: "BRVM",
  interval: "1D",
  indicators: [],
  isActive: false,
  sourceKind: "equity",
  sourceId: "orange-ci",
  chartType: "candles",
  timeframe: "1D",
  dateRange: "Tout",
  drawingScope: chartId,
  dataSource: "native",
});

test("multi-chart indicator snapshots own their arrays and Bollinger configuration", () => {
  const state = cloneState();
  state.chartConfig.indicators.activeSma = [20];
  state.advancedIndicators.macd = true;
  state.advancedIndicators.bollinger = true;
  state.bollingerSettings.length = 10;
  state.bollingerSettings.fillOpacity = 0.12;

  const sourceSnapshot = createMultiChartIndicatorSnapshot(state);
  const chart3 = createCell("chart_3");
  setCellIndicatorSnapshot(chart3, sourceSnapshot);

  sourceSnapshot.chart.activeSma.push(50);
  sourceSnapshot.advanced.macd = false;
  sourceSnapshot.bollinger.length = 99;
  sourceSnapshot.bollinger.fillOpacity = 0.9;

  assert.deepEqual(chart3.indicatorState.chart.activeSma, [20]);
  assert.equal(chart3.indicatorState.advanced.macd, true);
  assert.equal(chart3.indicatorState.advanced.bollinger, true);
  assert.equal(chart3.indicatorState.bollinger.length, 10);
  assert.equal(chart3.indicatorState.bollinger.fillOpacity, 0.12);
});

test("two multi-chart cells cannot contaminate each other's indicator state", () => {
  const chart2 = createCell("chart_2");
  const chart3 = createCell("chart_3");

  const chart2State = cloneState();
  chart2State.advancedIndicators.rsi = true;
  chart2State.indicatorPeriods.rsiPeriod = 14;
  const chart2Snapshot = createMultiChartIndicatorSnapshot(chart2State);
  setCellIndicatorSnapshot(chart2, chart2Snapshot);

  const chart3State = cloneState();
  chart3State.advancedIndicators.macd = true;
  chart3State.advancedIndicators.bollinger = true;
  chart3State.bollingerSettings.length = 10;
  const chart3Snapshot = createMultiChartIndicatorSnapshot(chart3State);
  setCellIndicatorSnapshot(chart3, chart3Snapshot);

  chart3.indicatorState.bollinger.length = 7;
  chart3.indicatorState.advanced.macd = false;

  assert.equal(chart2.indicatorState.advanced.rsi, true);
  assert.equal(chart2.indicatorState.advanced.macd, false);
  assert.equal(chart2.indicatorState.advanced.bollinger, false);
  assert.equal(chart2.indicatorState.bollinger.length, 20);
  assert.equal(chart2.indicatorState.periods.rsiPeriod, 14);
  assert.equal(chart3.indicatorState.bollinger.length, 7);
});

test("restoring a cell replaces the canonical indicator state without leaking previous-cell settings", () => {
  const targetState = cloneState();
  targetState.advancedIndicators.rsi = true;
  targetState.indicatorPeriods.rsiPeriod = 9;
  targetState.bollingerSettings.length = 55;
  targetState.chartConfig.indicators.activeSma = [5, 10];

  const chart = createCell("chart_4");
  const cellState = cloneState();
  cellState.advancedIndicators.obv = true;
  cellState.advancedIndicators.macd = true;
  cellState.chartConfig.indicators.activeSma = [200];
  cellState.bollingerSettings.length = 20;
  setCellIndicatorSnapshot(chart, createMultiChartIndicatorSnapshot(cellState));

  restoreCellIndicatorSnapshot(targetState, chart);

  assert.equal(targetState.advancedIndicators.rsi, false);
  assert.equal(targetState.advancedIndicators.obv, true);
  assert.equal(targetState.advancedIndicators.macd, true);
  assert.deepEqual(targetState.chartConfig.indicators.activeSma, [200]);
  assert.equal(targetState.bollingerSettings.length, 20);
  assert.equal(targetState.indicatorPeriods.rsiPeriod, 14);
});

test("indicator ID updates preserve per-cell parameters while changing only activation flags", () => {
  const chart = createCell("chart_3");
  const state = cloneState();
  state.bollingerSettings.length = 10;
  setCellIndicatorSnapshot(chart, createMultiChartIndicatorSnapshot(state));

  setCellIndicatorIds(chart, ["volume", "bollinger", "macd"]);

  assert.equal(chart.indicatorState.bollinger.length, 10);
  assert.equal(chart.indicatorState.advanced.bollinger, true);
  assert.equal(chart.indicatorState.advanced.macd, true);
  assert.equal(chart.indicatorState.chart.volume, true);
  assert.ok(chart.indicators.includes("bollinger"));
  assert.ok(chart.indicators.includes("macd"));
  assert.ok(chart.indicators.includes("volume"));
});
