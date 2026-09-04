const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");

const sourcePath = path.resolve(__dirname, "comparisonRequestIdentity.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

const normalizeMarketDataScope = (value) => String(value ?? "").trim().toUpperCase();
const normalizeChartTimeframe = (value) => {
  const normalized = String(value ?? "");
  const aliases = { "1h": "1H", "4h": "4H", "1d": "1D", "1w": "1W" };
  const candidate = aliases[normalized] ?? normalized;
  return ["1m", "5m", "15m", "30m", "1H", "4H", "1D", "1W", "1M"].includes(candidate)
    ? candidate
    : null;
};
const createTimeframeMarketDataCacheKey = (market, symbol, timeframe, sourceKind = "equity", sourceId = "") =>
  `${normalizeMarketDataScope(market)}::${String(symbol).trim().toUpperCase()}::${timeframe}::${sourceKind}::${sourceId}`;

const loadedModule = { exports: {} };
const localRequire = (id) => {
  if (id === "./marketDataCacheKey") return { normalizeMarketDataScope };
  if (id === "./timeframeCatalog") return { createTimeframeMarketDataCacheKey, normalizeChartTimeframe };
  return require(id);
};
new Function("module", "exports", "require", compiled)(loadedModule, loadedModule.exports, localRequire);

const {
  createComparisonRequestSetKey,
  normalizeComparisonRequests,
  parseComparisonRequestSetKey,
} = loadedModule.exports;

test("peer request identity ignores allocation and ordering noise", () => {
  const first = [
    { symbol: " orange_ci ", market: "brvm", timeframe: "1h" },
    { symbol: "ORANGE_CI", market: "BRVM", timeframe: "4H" },
  ];
  const reconstructedAndReordered = [
    { ...first[1] },
    { ...first[0] },
  ];

  assert.equal(
    createComparisonRequestSetKey(first),
    createComparisonRequestSetKey(reconstructedAndReordered),
  );
});

test("peer request identity changes only when a data-affecting field changes", () => {
  const base = [{ symbol: "ORANGE_CI", market: "BRVM", timeframe: "1H" }];
  const changedTimeframe = [{ symbol: "ORANGE_CI", market: "BRVM", timeframe: "4H" }];
  const changedMarket = [{ symbol: "ORANGE_CI", market: "CSE", timeframe: "1H" }];

  assert.notEqual(createComparisonRequestSetKey(base), createComparisonRequestSetKey(changedTimeframe));
  assert.notEqual(createComparisonRequestSetKey(base), createComparisonRequestSetKey(changedMarket));
});

test("canonical peer request set deduplicates equivalent requests and rejects unresolved indices", () => {
  const normalized = normalizeComparisonRequests([
    { symbol: "ORANGE_CI", market: "BRVM", timeframe: "1H" },
    { symbol: " orange_ci ", market: "brvm", timeframe: "1h" },
    { symbol: "BRVM-C", market: "BRVM", timeframe: "1D", sourceKind: "index" },
  ]);

  assert.equal(normalized.length, 1);
  assert.deepEqual(normalized[0], {
    symbol: "ORANGE_CI",
    market: "BRVM",
    timeframe: "1H",
    sourceKind: "equity",
    sourceId: "",
  });
});

test("serialized request identity round-trips into the exact canonical subscription set", () => {
  const key = createComparisonRequestSetKey([
    { symbol: "ORANGE_CI", market: "BRVM", timeframe: "1W" },
    { symbol: "ORANGE_CI", market: "BRVM", timeframe: "1H" },
  ]);

  assert.deepEqual(parseComparisonRequestSetKey(key), normalizeComparisonRequests([
    { symbol: "ORANGE_CI", market: "BRVM", timeframe: "1W" },
    { symbol: "ORANGE_CI", market: "BRVM", timeframe: "1H" },
  ]));
});

test("comparison manager effects are driven by canonical request identity rather than object identity", () => {
  const marketDataSource = fs.readFileSync(
    path.resolve(__dirname, "../../hooks/MarketData/useMarketData.ts"),
    "utf8",
  );

  assert.match(marketDataSource, /const requestSetKey = useMemo\([\s\S]*?createComparisonRequestSetKey\(comparisonRequests\)/);
  assert.match(marketDataSource, /const safeRequests = useMemo\([\s\S]*?parseComparisonRequestSetKey\(requestSetKey\)/);
  assert.match(marketDataSource, /\[requestSetKey\]/);
});
