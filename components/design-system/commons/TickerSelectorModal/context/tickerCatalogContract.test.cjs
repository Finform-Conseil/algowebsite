/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const projectRoot = path.resolve(__dirname, "../../../../../");

const transpileTypeScript = (filename) => ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: {
    esModuleInterop: true,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
  fileName: filename,
}).outputText;

require.extensions[".ts"] = function loadTypeScript(module, filename) {
  module._compile(transpileTypeScript(filename), filename);
};

const policyPath = path.join(projectRoot, "components/design-system/commons/TickerSelectorModal/context/tickerCatalogPolicy.ts");
const retryPolicyPath = path.join(projectRoot, "components/design-system/commons/BrvmLogoMark/logoRetryPolicy.ts");
const persistencePath = path.join(projectRoot, "components/design-system/commons/TickerSelectorModal/context/tickerCatalogPersistence.ts");

const {
  TICKER_CATALOG_SNAPSHOT_VERSION,
  buildTickerCatalogQuery,
  isCurrentTickerCatalogSnapshotVersion,
} = require(policyPath);
const {
  MAX_LOGO_LOAD_RETRIES,
  getLogoRetryDelayMs,
  getLogoRetryUrl,
} = require(retryPolicyPath);

test("ticker selector uses the market-scoped screener API contract for every supported exchange", () => {
  ["BRVM", "CSE", "GSE", "JSE", "NGX", "NSE"].forEach((market) => {
    const query = buildTickerCatalogQuery(market, 2);
    assert.deepEqual(query, {
      view_type: "screener",
      bourse_tickers: market,
      page: 2,
      page_size: 100,
    });
    assert.equal(Object.prototype.hasOwnProperty.call(query, "bourse"), false);
  });
});

test("legacy ticker catalog snapshots are invalidated by the contract version", () => {
  assert.equal(TICKER_CATALOG_SNAPSHOT_VERSION, 2);
  assert.equal(isCurrentTickerCatalogSnapshotVersion(undefined), false);
  assert.equal(isCurrentTickerCatalogSnapshotVersion(1), false);
  assert.equal(isCurrentTickerCatalogSnapshotVersion(2), true);

  const persistenceSource = fs.readFileSync(persistencePath, "utf8");
  assert.match(persistenceSource, /isCurrentTickerCatalogSnapshotVersion\(value\.contractVersion\)/);
  assert.match(persistenceSource, /contractVersion:\s*TICKER_CATALOG_SNAPSHOT_VERSION/);
});

test("logo retry policy cache-busts bounded retries without changing the canonical first URL", () => {
  assert.equal(MAX_LOGO_LOAD_RETRIES, 2);
  assert.equal(getLogoRetryUrl("/logos-brvm/ecoc.webp", 0), "/logos-brvm/ecoc.webp");
  assert.equal(getLogoRetryUrl("/logos-brvm/ecoc.webp", 1), "/logos-brvm/ecoc.webp?__asset_retry=1");
  assert.equal(getLogoRetryUrl("/logos-brvm/ecoc.webp?v=1", 2), "/logos-brvm/ecoc.webp?v=1&__asset_retry=2");
  assert.equal(getLogoRetryDelayMs(0), 250);
  assert.equal(getLogoRetryDelayMs(1), 1000);
});
