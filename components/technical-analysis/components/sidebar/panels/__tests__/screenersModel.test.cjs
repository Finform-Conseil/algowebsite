/* eslint-env node */
const assert = require("node:assert/strict");
const test = require("node:test");

require("../../../../store/__tests__/testTypeScriptLoader.cjs");

const {
  buildScreenerRows,
  clearScreenerRange,
  createDefaultScreenerState,
  filterAndSortScreenerRows,
  normalizeScreenerState,
  selectScreenerFilter,
  setScreenerRangeValue,
  toggleScreenerSector,
  toggleWatchlistTicker,
} = require("../screenersModel.ts");

const makeSecurity = (overrides) => ({
  country: "Côte d'Ivoire",
  currency: "XOF",
  epsT12M: 5,
  exchange: "BRVM",
  marketCap: 100,
  name: "Alpha Bank",
  peRatio: 8,
  priceChangeD1: 1,
  returnYTD: 3,
  revenueT12M: 10,
  sector: "Banking",
  ticker: "ALPH",
  ...overrides,
});

const sampleSecurities = [
  makeSecurity({ marketCap: 100, name: "Alpha Bank", peRatio: 8, sector: "Banking", ticker: "ALPH" }),
  makeSecurity({ country: "Sénégal", epsT12M: 12, marketCap: 5000, name: "Beta Telecom", peRatio: 14, priceChangeD1: 4, sector: "Telecom", ticker: "BETA" }),
  makeSecurity({ marketCap: 0, name: "BRVM Composite", sector: "Market Indices", ticker: "BRVMC" }),
  makeSecurity({ marketCap: 1, name: "Old Listing", sector: "Delisted", status: "delisted", ticker: "OLD" }),
];

const buildRows = () => buildScreenerRows({
  activeCurrency: "XOF",
  activeTicker: "ALPH",
  livePrice: 1250,
  liveVolume: 42,
  marketSnapshots: {
    BETA: { price: 2500, symbol: "BETA", timestamp: "2026-06-11", variation: "+4,00%", volume: 1000 },
  },
  securities: sampleSecurities,
});

test("buildScreenerRows excludes indices and delisted securities", () => {
  const rows = buildRows();
  assert.deepEqual(rows.map((row) => row.ticker).sort(), ["ALPH", "BETA"]);
  assert.equal(rows.find((row) => row.ticker === "ALPH").priceValue, 1250);
  assert.equal(rows.find((row) => row.ticker === "BETA").changePercent, 4);
});

test("search is accent-insensitive across ticker, name, sector and country", () => {
  const state = { ...createDefaultScreenerState("ALPH"), query: "senegal" };
  const rows = filterAndSortScreenerRows(buildRows(), state, "ALPH");
  assert.deepEqual(rows.map((row) => row.ticker), ["BETA"]);
});

test("numeric ranges exclude unavailable values and respect min/max bounds", () => {
  const state = setScreenerRangeValue(createDefaultScreenerState("ALPH"), "marketCap", "min", "1000");
  const rows = filterAndSortScreenerRows(buildRows(), state, "ALPH");
  assert.deepEqual(rows.map((row) => row.ticker), ["BETA"]);

  const cleared = clearScreenerRange(state, "marketCap");
  assert.equal(filterAndSortScreenerRows(buildRows(), cleared, "ALPH").length, 2);
});

test("sector and watchlist filters compose without mutating the source rows", () => {
  const initialRows = buildRows();
  const sectorState = toggleScreenerSector(createDefaultScreenerState("ALPH"), "Telecom");
  assert.deepEqual(filterAndSortScreenerRows(initialRows, sectorState, "ALPH").map((row) => row.ticker), ["BETA"]);

  const watchlistState = selectScreenerFilter(toggleWatchlistTicker(createDefaultScreenerState("ALPH"), "BETA"), "watchlist");
  assert.deepEqual(filterAndSortScreenerRows(initialRows, watchlistState, "ALPH").map((row) => row.ticker), ["BETA", "ALPH"]);
  assert.deepEqual(initialRows.map((row) => row.ticker).sort(), ["ALPH", "BETA"]);
});

test("normalizeScreenerState rejects corrupt persistence payloads", () => {
  const state = normalizeScreenerState({
    activeFilter: "evil",
    query: "x".repeat(120),
    ranges: { pe: { enabled: true, max: "30abc", min: "5,5" } },
    sectors: ["Banking", "", "Banking", "Telecom"],
    sortId: "pe",
    watchlistTickers: ["boab", "bad ticker", "BETA"],
  }, "ALPH");

  assert.equal(state.activeFilter, "all");
  assert.equal(state.query.length, 80);
  assert.deepEqual(state.sectors, ["Banking", "Telecom"]);
  assert.equal(state.sortId, "pe");
  assert.deepEqual(state.watchlistTickers, ["BOAB", "BETA"]);
  assert.deepEqual(state.ranges.pe, { enabled: true, max: "30", min: "5,5" });
});
