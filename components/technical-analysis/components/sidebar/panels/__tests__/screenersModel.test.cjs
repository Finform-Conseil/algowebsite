/* eslint-env node */
const assert = require("node:assert/strict");
const test = require("node:test");

require("../../../../store/__tests__/testTypeScriptLoader.cjs");

const {
  buildScreenerRows,
  clearScreenerRange,
  compactSectorLabel,
  createDefaultScreenerState,
  filterAndSortScreenerRows,
  getAvailableExchanges,
  getExchangeCount,
  normalizeScreenerState,
  selectScreenerFilter,
  selectScreenerSort,
  setScreenerRangeValue,
  toggleScreenerExchange,
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
  makeSecurity({ country: "Nigeria", exchange: "NGX", marketCap: 2500, name: "Gamma Energy", peRatio: 10, sector: "Energy", ticker: "GAMA" }),
  makeSecurity({ country: "Kenya", exchange: "NSE", marketCap: 900, name: "Delta Retail", peRatio: 6, sector: "Retail", ticker: "DELT" }),
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
  assert.deepEqual(rows.map((row) => row.ticker).sort(), ["ALPH", "BETA", "DELT", "GAMA"]);
  assert.equal(rows.find((row) => row.ticker === "ALPH").priceValue, 1250);
  assert.equal(rows.find((row) => row.ticker === "BETA").changePercent, 4);
});

test("search is accent-insensitive across ticker, name, sector and country", () => {
  const state = { ...createDefaultScreenerState(), query: "senegal" };
  const rows = filterAndSortScreenerRows(buildRows(), state, "ALPH");
  assert.deepEqual(rows.map((row) => row.ticker), ["BETA"]);
});

test("numeric ranges exclude unavailable values and respect min/max bounds", () => {
  const state = setScreenerRangeValue(createDefaultScreenerState(), "marketCap", "min", "1000");
  const rows = filterAndSortScreenerRows(buildRows(), state, "ALPH");
  assert.deepEqual(rows.map((row) => row.ticker).sort(), ["BETA", "GAMA"]);

  const cleared = clearScreenerRange(state, "marketCap");
  assert.equal(filterAndSortScreenerRows(buildRows(), cleared, "ALPH").length, 4);
});

test("sector and watchlist filters compose without mutating the source rows", () => {
  const initialRows = buildRows();
  const sectorState = toggleScreenerSector(createDefaultScreenerState(), "Telecom");
  assert.deepEqual(filterAndSortScreenerRows(initialRows, sectorState, "ALPH").map((row) => row.ticker), ["BETA"]);

  const watchlistState = selectScreenerFilter(toggleWatchlistTicker(toggleWatchlistTicker(createDefaultScreenerState(), "BETA"), "ALPH"), "watchlist");
  assert.deepEqual(filterAndSortScreenerRows(initialRows, watchlistState, "ALPH").map((row) => row.ticker), ["BETA", "ALPH"]);
  assert.deepEqual(initialRows.map((row) => row.ticker).sort(), ["ALPH", "BETA", "DELT", "GAMA"]);
});

test("exchange filter toggles, normalizes to uppercase and lists available exchanges", () => {
  const rows = buildRows();
  assert.deepEqual(getAvailableExchanges(rows), ["BRVM", "NGX", "NSE"]);
  assert.equal(getExchangeCount(rows, "BRVM"), 2);

  const state = toggleScreenerExchange(createDefaultScreenerState(), "brvm");
  assert.deepEqual(state.exchanges, ["BRVM"]);
  assert.equal(state.activeFilter, "exchange");
  assert.deepEqual(filterAndSortScreenerRows(rows, state, "ALPH").map((row) => row.ticker).sort(), ["ALPH", "BETA"]);

  const multi = toggleScreenerExchange(state, "ngx");
  assert.deepEqual(multi.exchanges, ["BRVM", "NGX"]);
  assert.deepEqual(filterAndSortScreenerRows(rows, multi, "ALPH").map((row) => row.ticker).sort(), ["ALPH", "BETA", "GAMA"]);
});

test("BRVM filter sets exchange selection and honors it", () => {
  const state = selectScreenerFilter(createDefaultScreenerState(), "brvm");
  assert.deepEqual(state.exchanges, ["BRVM"]);
  const rows = filterAndSortScreenerRows(buildRows(), state, "ALPH");
  assert.deepEqual(rows.map((row) => row.ticker).sort(), ["ALPH", "BETA"]);
});

test("normalizeScreenerState rejects corrupt persistence payloads", () => {
  const state = normalizeScreenerState({
    activeFilter: "evil",
    query: "x".repeat(120),
    ranges: { pe: { enabled: true, max: "30abc", min: "5,5" } },
    sectors: ["Banking", "", "Banking", "Telecom"],
    exchanges: ["brvm", "", "NGX", "ngx", "JSE"],
    sortId: "pe",
    watchlistTickers: ["boab", "bad ticker", "BETA"],
  });

  assert.equal(state.activeFilter, "all");
  assert.equal(state.query.length, 80);
  assert.deepEqual(state.sectors, ["Banking", "Telecom"]);
  assert.deepEqual(state.exchanges, ["BRVM", "NGX", "JSE"]);
  assert.equal(state.sortId, "pe");
  assert.deepEqual(state.watchlistTickers, ["BOAB", "BETA"]);
  assert.deepEqual(state.ranges.pe, { enabled: true, max: "30", min: "5,5" });
});

test("selectScreenerSort toggles direction and switches columns", () => {
  const base = createDefaultScreenerState();
  assert.equal(base.sortId, "marketCap");
  assert.equal(base.sortDirection, "desc");

  const byPrice = selectScreenerSort(base, "price");
  assert.equal(byPrice.sortId, "price");
  assert.equal(byPrice.sortDirection, "desc");

  const byPriceAsc = selectScreenerSort(byPrice, "price");
  assert.equal(byPriceAsc.sortId, "price");
  assert.equal(byPriceAsc.sortDirection, "asc");

  const byPriceDesc = selectScreenerSort(byPriceAsc, "price");
  assert.equal(byPriceDesc.sortId, "price");
  assert.equal(byPriceDesc.sortDirection, "desc");
});

test("sort direction drives filterAndSortScreenerRows ordering", () => {
  const base = createDefaultScreenerState();
  const descending = filterAndSortScreenerRows(buildRows(), base, "ALPH");
  assert.deepEqual(descending.map((row) => row.ticker), ["BETA", "GAMA", "DELT", "ALPH"]);

  const ascending = filterAndSortScreenerRows(buildRows(), selectScreenerSort(base, "marketCap"), "ALPH");
  assert.deepEqual(ascending.map((row) => row.ticker), ["ALPH", "DELT", "GAMA", "BETA"]);
});

test("createDefaultScreenerState starts with an empty watchlist", () => {
  const state = createDefaultScreenerState();
  assert.deepEqual(state.watchlistTickers, []);
});

test("watchlist filter tracks kept total against listed matches", () => {
  const withListed = selectScreenerFilter(
    toggleWatchlistTicker(toggleWatchlistTicker(createDefaultScreenerState(), "BETA"), "ALPH"),
    "watchlist",
  );
  assert.deepEqual(withListed.watchlistTickers, ["BETA", "ALPH"]);
  assert.deepEqual(
    filterAndSortScreenerRows(buildRows(), withListed, "ALPH").map((row) => row.ticker),
    ["BETA", "ALPH"],
  );

  const withNotListed = selectScreenerFilter(toggleWatchlistTicker(createDefaultScreenerState(), "BOAB"), "watchlist");
  assert.deepEqual(withNotListed.watchlistTickers, ["BOAB"]);
  assert.deepEqual(filterAndSortScreenerRows(buildRows(), withNotListed, "BOAB").map((row) => row.ticker), []);
});

test("compactSectorLabel applies curated overrides for verbose taxonomy entries", () => {
  assert.equal(compactSectorLabel("Industrie manufacturière"), "Industrie");
  assert.equal(compactSectorLabel("Production et distribution d'électricité, de gaz, de vapeur et d'air conditionné"), "Énergie");
  assert.equal(compactSectorLabel("Services financiers et assurance"), "Banques & assurances");
  assert.equal(compactSectorLabel("Santé humaine et action sociale"), "Santé");
});

test("compactSectorLabel truncates long labels at the first separator", () => {
  assert.equal(compactSectorLabel("Agriculture, sylviculture et pêche"), "Agriculture");
  assert.equal(compactSectorLabel("Industries du transport et du stockage; activités auxiliaires de transport"), "Industries du transport et du stockage");
  assert.equal(compactSectorLabel("Mines -- Exploration et extraction minière -- autre"), "Mines");
});

test("compactSectorLabel passes through already-short labels unchanged", () => {
  assert.equal(compactSectorLabel("Banking"), "Banking");
  assert.equal(compactSectorLabel("Télécom"), "Télécom");
  assert.equal(compactSectorLabel("Team Energy"), "Team Energy");
});

test("compactSectorLabel keeps near-duplicate clusters visually distinct", () => {
  const cluster = [
    "Services financiers et assurance",
    "Services financiers",
    "Finance",
    "Banques",
    "Activités immobilières, location et services aux entreprises",
    "Activités immobilières",
    "Immobilier",
  ];
  const labels = cluster.map(compactSectorLabel);
  assert.equal(new Set(labels).size, labels.length);
});
