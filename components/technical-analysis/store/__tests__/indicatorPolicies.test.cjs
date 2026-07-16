/* eslint-env node */
const assert = require("node:assert/strict");
const test = require("node:test");

require("./testTypeScriptLoader.cjs");

const {
  technicalAnalysisSlice,
  applyTemplate,
  setIndicatorPeriods,
} = require("../technicalAnalysisSlice.ts");
const {
  INDICATOR_TEMPLATE_IDS,
  INDICATOR_TEMPLATE_SPECS,
} = require("../templates/indicatorTemplates.ts");

const createReducerState = () => structuredClone(technicalAnalysisSlice.getInitialState());

const emptyAdvancedMovingAverageIndicators = {
  activeWma: [],
  activeDema: [],
  activeTema: [],
  activeHma: [],
  activeZlema: [],
  activeAlma: [],
  activeSmma: [],
  activeKama: [],
  activeVwma: [],
};

const expectedTemplateChartIndicators = {
  day: {
    sma: true,
    ema: false,
    volume: false,
    activeSma: [5, 10],
    activeEma: [],
    ...emptyAdvancedMovingAverageIndicators,
  },
  swing: {
    sma: true,
    ema: false,
    volume: true,
    activeSma: [20, 50],
    activeEma: [],
    ...emptyAdvancedMovingAverageIndicators,
  },
  scalping: {
    sma: false,
    ema: true,
    volume: true,
    activeSma: [],
    activeEma: [5, 10],
    ...emptyAdvancedMovingAverageIndicators,
  },
  long: {
    sma: true,
    ema: false,
    volume: true,
    activeSma: [50, 200],
    activeEma: [],
    ...emptyAdvancedMovingAverageIndicators,
  },
};

const expectedTemplateAdvancedIndicatorKeys = {
  day: ["macd", "roc10", "rsi"],
  swing: ["bollinger", "obv", "stochastic", "williamsR14"],
  scalping: ["atr", "roc10"],
  long: ["obv"],
};

const getActiveAdvancedIndicatorKeys = (advancedIndicators) =>
  Object.entries(advancedIndicators)
    .filter(([, value]) => value === true)
    .map(([key]) => key)
    .sort();

test("indicator templates keep the Phase 1 runtime parity contract", () => {
  INDICATOR_TEMPLATE_IDS.forEach((templateId) => {
    const baseState = createReducerState();
    baseState.ui.modals.templates = true;

    const state = technicalAnalysisSlice.reducer(baseState, applyTemplate(templateId));

    assert.deepEqual(state.chartConfig.indicators, expectedTemplateChartIndicators[templateId]);
    assert.deepEqual(
      getActiveAdvancedIndicatorKeys(state.advancedIndicators),
      expectedTemplateAdvancedIndicatorKeys[templateId],
    );
    assert.equal(state.ui.modals.templates, false);
  });
});

test("indicator templates clone moving-average arrays away from specs per application", () => {
  const firstState = technicalAnalysisSlice.reducer(createReducerState(), applyTemplate("day"));
  const secondState = technicalAnalysisSlice.reducer(createReducerState(), applyTemplate("day"));

  assert.notEqual(
    firstState.chartConfig.indicators.activeSma,
    INDICATOR_TEMPLATE_SPECS.day.chartIndicators.activeSma,
  );
  assert.notEqual(
    firstState.chartConfig.indicators.activeSma,
    secondState.chartConfig.indicators.activeSma,
  );
  assert.deepEqual(secondState.chartConfig.indicators.activeSma, [5, 10]);
});

test("indicator period reducer accepts only known finite integer values in range", () => {
  const state = technicalAnalysisSlice.reducer(
    createReducerState(),
    setIndicatorPeriods({
      sma1: 8,
      sma2: 13,
      sma3: 21,
      rsiPeriod: 25,
    }),
  );

  assert.deepEqual(state.indicatorPeriods, {
    sma1: 8,
    sma2: 13,
    sma3: 21,
    rsiPeriod: 25,
  });
});

test("indicator period reducer rejects unknown keys and invalid numbers", () => {
  const baselinePeriods = {
    sma1: 5,
    sma2: 10,
    sma3: 20,
    rsiPeriod: 14,
  };
  const state = technicalAnalysisSlice.reducer(
    {
      ...createReducerState(),
      indicatorPeriods: baselinePeriods,
    },
    setIndicatorPeriods({
      sma1: 0,
      sma2: 501,
      sma3: Number.NaN,
      rsiPeriod: Infinity,
      customPeriod: 33,
    }),
  );

  assert.deepEqual(state.indicatorPeriods, baselinePeriods);
  assert.equal(Object.prototype.hasOwnProperty.call(state.indicatorPeriods, "customPeriod"), false);
});

test("indicator period reducer rejects fractional and below-minimum RSI periods", () => {
  const baselinePeriods = {
    sma1: 5,
    sma2: 10,
    sma3: 20,
    rsiPeriod: 14,
  };
  const state = technicalAnalysisSlice.reducer(
    {
      ...createReducerState(),
      indicatorPeriods: baselinePeriods,
    },
    setIndicatorPeriods({
      sma1: 10.5,
      rsiPeriod: 1,
    }),
  );

  assert.deepEqual(state.indicatorPeriods, baselinePeriods);
});
