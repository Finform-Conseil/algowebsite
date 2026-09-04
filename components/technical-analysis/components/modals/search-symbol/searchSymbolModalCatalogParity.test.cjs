const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../../../..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const modalSource = read("components/technical-analysis/components/modals/search-symbol/SearchSymbolModal.tsx");
const toolbarSource = read("components/technical-analysis/components/toolbar/ChartToolbar.tsx");

test("compare symbol modal requires an explicit supported exchange before loading its catalog", () => {
  assert.match(modalSource, /SUPPORTED_COMPARE_MARKETS = \["BRVM", "CSE", "GSE", "JSE", "NGX", "NSE"\]/);
  assert.match(modalSource, /const \[selectedMarketTicker, setSelectedMarketTicker\] = useState<string \| null>\(null\)/);
  assert.match(modalSource, /const activeMarketTicker = selectedMarketTicker \?\? "";/);
  assert.match(modalSource, /if \(!isOpen \|\| !activeMarketTicker\)/);
  assert.match(modalSource, /buildTickerCatalogQuery\(activeMarketTicker, 1\)/);
  assert.match(modalSource, /buildTickerCatalogQuery\(activeMarketTicker, index \+ 1\)/);
  assert.match(modalSource, /createCompareInstrumentKey\(activeMarketTicker, normalizedSymbol\)/);
  assert.match(modalSource, /dispatch\(addComparisonSymbol\(comparisonKey\)\)/);
  assert.match(modalSource, /apiSecuritiesByMarketRef/);
  assert.match(modalSource, /lastSuccessfulRefreshByMarketRef/);
  assert.match(modalSource, /isActionInMarket\(action, marketTicker\)/);
  assert.doesNotMatch(modalSource, /const activeMarketTicker = normalizeSearch\(activeMarket\.ticker \|\| "BRVM"\)/);
  assert.doesNotMatch(modalSource, /isBrvmAction/);
  assert.doesNotMatch(modalSource, /SEARCH_SYMBOL_ACTION_QUERY/);
  assert.doesNotMatch(modalSource, /\.slice\(0,\s*10\)/);
});

 test("compare exchange step reuses the canonical market-selector visual system without a fixed empty body", () => {
  assert.match(modalSource, /MarketSelectorModal\.module\.scss/);
  assert.match(modalSource, /marketSelectorStyles\.marketGrid/);
  assert.match(modalSource, /marketSelectorStyles\.marketCard/);
  assert.match(modalSource, /marketSelectorStyles\.marketLogoFrame/);
  assert.match(modalSource, /marketSelectorStyles\.currencyPill/);
  assert.match(modalSource, /tv-compare-modal--market-step/);
  assert.match(modalSource, /\.tv-compare-modal--market-step \.gp-modal-body \{[\s\S]*height: auto;[\s\S]*min-height: 0;/);
});

test("compare symbol modal exposes TradingView-like type tabs and full-market labels", () => {
  assert.match(modalSource, /type SymbolKindFilter = "all" \| "stock" \| "index";/);
  assert.match(modalSource, /\{ id: "all", label: "All" \}/);
  assert.match(modalSource, /\{ id: "stock", label: "Stocks" \}/);
  assert.match(modalSource, /\{ id: "index", label: "Indices" \}/);
  assert.match(modalSource, /role="tab"/);
  assert.match(modalSource, /aria-selected=\{activeKindFilter === filter\.id\}/);
  assert.match(modalSource, /`All Symbols · \$\{activeMarketTicker\}`/);
  assert.match(modalSource, /\{activeMarketTicker\} · \{searchCatalog\.length\} symbols/);
});

test("compare toolbar prefetches the displayed market catalog", () => {
  assert.match(toolbarSource, /buildTickerCatalogQuery\(marketTicker, 1\)/);
  assert.match(toolbarSource, /displayedMarketTicker\.trim\(\)\.toUpperCase\(\)/);
  assert.match(toolbarSource, /prefetch\("getAllActions", buildTickerCatalogQuery\(marketTicker, 1\), \{ ifOlderThan: 30 \}\)/);
  assert.doesNotMatch(toolbarSource, /SEARCH_SYMBOL_ACTION_QUERY/);
});
