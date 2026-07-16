/* eslint-env node */
const assert = require("node:assert/strict");
const test = require("node:test");

require("./testTypeScriptLoader.cjs");

const {
  technicalAnalysisSlice,
  addAlert,
  addOrder,
  setPrefilledAlert,
  setReplaySpeed,
  updateAlert,
  updateMarketData,
  updateMarketSnapshot,
  updateOrder,
} = require("../technicalAnalysisSlice.ts");

const createReducerState = () => structuredClone(technicalAnalysisSlice.getInitialState());

const createValidAlert = (overrides = {}) => ({
  id: "alert-1",
  symbol: " boab ",
  condition: "GREATER_THAN",
  value: 12.5,
  active: true,
  notificationChannels: {
    email: true,
    push: false,
  },
  ...overrides,
});

const createValidOrder = (overrides = {}) => ({
  id: "order-1",
  symbol: " snts ",
  side: "buy",
  orderType: "limit",
  triggerPrice: 2500,
  qty: 10,
  status: "active",
  createdAt: "2026-06-03T10:00:00.000Z",
  isPaperTrade: true,
  ...overrides,
});

const createValidCandle = (overrides = {}) => ({
  time: "2026-06-03T09:00:00.000Z",
  open: 10,
  high: 12,
  low: 9,
  close: 11,
  volume: 1000,
  ...overrides,
});

const createValidSnapshot = (overrides = {}) => ({
  symbol: "brvmc",
  price: 11,
  variation: "+1.00%",
  prevClose: 10,
  open: 10,
  high: 12,
  low: 9,
  volume: 1200,
  tradesCount: 4,
  lastUpdate: "2026-06-03T09:05:00.000Z",
  ...overrides,
});

test("alert guards normalize symbols and reject duplicates or invalid prices", () => {
  const firstState = technicalAnalysisSlice.reducer(createReducerState(), addAlert(createValidAlert()));
  const duplicateState = technicalAnalysisSlice.reducer(firstState, addAlert(createValidAlert({ value: 15 })));
  const invalidState = technicalAnalysisSlice.reducer(firstState, addAlert(createValidAlert({ id: "alert-2", value: Number.NaN })));

  assert.equal(firstState.alerts.length, 1);
  assert.equal(firstState.alerts[0].symbol, "BOAB");
  assert.equal(firstState.alerts[0].value, 12.5);
  assert.equal(duplicateState.alerts.length, 1);
  assert.equal(invalidState.alerts.length, 1);
});

test("alert updates and prefilled alert ignore invalid finite contracts", () => {
  const baseState = technicalAnalysisSlice.reducer(createReducerState(), addAlert(createValidAlert()));
  const invalidUpdate = technicalAnalysisSlice.reducer(baseState, updateAlert(createValidAlert({ value: Infinity })));
  const validUpdate = technicalAnalysisSlice.reducer(baseState, updateAlert(createValidAlert({ symbol: " sgbc ", value: 42 })));
  const invalidPrefill = technicalAnalysisSlice.reducer(baseState, setPrefilledAlert({ price: -1, condition: "LESS_THAN" }));
  const invalidConditionPrefill = technicalAnalysisSlice.reducer(baseState, setPrefilledAlert({ price: 8, condition: "INVALID" }));
  const validPrefill = technicalAnalysisSlice.reducer(baseState, setPrefilledAlert({ price: 9.5, condition: "LESS_THAN" }));

  assert.equal(invalidUpdate.alerts[0].value, 12.5);
  assert.equal(validUpdate.alerts[0].symbol, "SGBC");
  assert.equal(validUpdate.alerts[0].value, 42);
  assert.equal(invalidPrefill.ui.prefilledAlertPrice, undefined);
  assert.equal(invalidConditionPrefill.ui.prefilledAlertPrice, undefined);
  assert.equal(validPrefill.ui.prefilledAlertPrice, 9.5);
  assert.equal(validPrefill.ui.prefilledAlertCondition, "LESS_THAN");
});

test("order guards normalize symbols and reject duplicates or impossible quantities", () => {
  const firstState = technicalAnalysisSlice.reducer(createReducerState(), addOrder(createValidOrder()));
  const duplicateState = technicalAnalysisSlice.reducer(firstState, addOrder(createValidOrder({ qty: 20 })));
  const invalidState = technicalAnalysisSlice.reducer(firstState, addOrder(createValidOrder({ id: "order-2", qty: 0 })));

  assert.equal(firstState.orders.length, 1);
  assert.equal(firstState.orders[0].symbol, "SNTS");
  assert.equal(firstState.orders[0].qty, 10);
  assert.equal(duplicateState.orders.length, 1);
  assert.equal(invalidState.orders.length, 1);
});

test("order updates reject non-finite prices and accept valid bracket prices", () => {
  const baseState = technicalAnalysisSlice.reducer(createReducerState(), addOrder(createValidOrder()));
  const invalidUpdate = technicalAnalysisSlice.reducer(baseState, updateOrder(createValidOrder({ triggerPrice: Number.NaN })));
  const validUpdate = technicalAnalysisSlice.reducer(baseState, updateOrder(createValidOrder({
    symbol: " boabf ",
    triggerPrice: 2600,
    takeProfitPrice: 2800,
    stopLossPrice: 2400,
  })));

  assert.equal(invalidUpdate.orders[0].triggerPrice, 2500);
  assert.equal(validUpdate.orders[0].symbol, "BOABF");
  assert.equal(validUpdate.orders[0].triggerPrice, 2600);
  assert.equal(validUpdate.orders[0].takeProfitPrice, 2800);
  assert.equal(validUpdate.orders[0].stopLossPrice, 2400);
});

test("replay speed accepts finite positive bounded values only", () => {
  const baseState = createReducerState();
  const validState = technicalAnalysisSlice.reducer(baseState, setReplaySpeed(250.8));
  const zeroState = technicalAnalysisSlice.reducer(validState, setReplaySpeed(0));
  const infiniteState = technicalAnalysisSlice.reducer(validState, setReplaySpeed(Infinity));
  const tooSlowState = technicalAnalysisSlice.reducer(validState, setReplaySpeed(60001));

  assert.equal(validState.ui.replay.speed, 250);
  assert.equal(zeroState.ui.replay.speed, 250);
  assert.equal(infiniteState.ui.replay.speed, 250);
  assert.equal(tooSlowState.ui.replay.speed, 250);
});

test("market data guards normalize keys and preserve Redux storage paths", () => {
  const candle = createValidCandle();
  const state = technicalAnalysisSlice.reducer(createReducerState(), updateMarketData({
    symbol: " boab ",
    data: [candle],
  }));
  const invalidState = technicalAnalysisSlice.reducer(state, updateMarketData({
    symbol: " sgbc ",
    data: null,
  }));

  assert.deepEqual(Object.keys(state.marketData), ["BOAB"]);
  assert.equal(state.marketData.BOAB[0].close, 11);
  assert.equal(invalidState.marketData.SGBC, undefined);
});

test("market snapshot guards normalize keys and reject non-finite quote values", () => {
  const state = technicalAnalysisSlice.reducer(createReducerState(), updateMarketSnapshot({
    symbol: " brvmc ",
    snapshot: createValidSnapshot(),
  }));
  const invalidState = technicalAnalysisSlice.reducer(state, updateMarketSnapshot({
    symbol: " sgbc ",
    snapshot: createValidSnapshot({ price: Number.NaN }),
  }));

  assert.deepEqual(Object.keys(state.marketSnapshots), ["BRVMC"]);
  assert.equal(state.marketSnapshots.BRVMC.symbol, "BRVMC");
  assert.equal(state.marketSnapshots.BRVMC.price, 11);
  assert.equal(invalidState.marketSnapshots.SGBC, undefined);
});
