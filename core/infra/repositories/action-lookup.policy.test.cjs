/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const projectRoot = path.resolve(__dirname, "../../..");
const policyPath = path.join(projectRoot, "core/infra/repositories/action-lookup.policy.ts");

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

const {
  actionMatchesLookup,
  buildActionLookupQuery,
  buildActionLookupRequestKey,
  buildActionMarketCatalogQuery,
  normalizeActionLookupCriteria,
} = require(policyPath);

test("market-aware action lookup uses the lightweight index before detail hydration", () => {
  const criteria = normalizeActionLookupCriteria({ ticker: " boa ", marketTicker: " cse " });
  assert.deepEqual(criteria, { ticker: "BOA", marketTicker: "CSE" });
  const query = buildActionLookupQuery(criteria, "ticker");
  assert.deepEqual(query, {
    page: 1,
    page_size: 1,
    ticker: "BOA",
    bourse_tickers: "CSE",
    view_type: "screener",
  });
  assert.equal(query.view_type, "screener");
  assert.equal(buildActionLookupRequestKey(criteria), "actions:lookup:market:CSE:ticker:BOA:isin:");
});

test("market catalog fallback stays bounded and omits fragile ticker filters", () => {
  const criteria = normalizeActionLookupCriteria({ ticker: "BOA", marketTicker: "CSE" });
  assert.deepEqual(buildActionMarketCatalogQuery(criteria), {
    page: 1,
    page_size: 100,
    bourse_tickers: "CSE",
    view_type: "screener",
  });
  assert.deepEqual(buildActionMarketCatalogQuery(criteria, 3), {
    page: 3,
    page_size: 100,
    bourse_tickers: "CSE",
    view_type: "screener",
  });
});

test("unscoped lookup remains explicit and does not invent a market", () => {
  const criteria = normalizeActionLookupCriteria({ ticker: "SNTS", marketTicker: "UNKNOWN" });
  assert.deepEqual(criteria, { ticker: "SNTS" });
  const query = buildActionLookupQuery(criteria, "ticker");
  assert.deepEqual(query, { page: 1, page_size: 2, ticker: "SNTS" });
  assert.equal(Object.prototype.hasOwnProperty.call(query, "bourse_tickers"), false);
});

test("action matching is strict on ticker, market and optional ISIN", () => {
  const action = { ticker: "BOA", isin: "MA0000012437", bourse: { ticker: "CSE" } };
  assert.equal(actionMatchesLookup(action, normalizeActionLookupCriteria({ ticker: "BOA", marketTicker: "CSE" })), true);
  assert.equal(actionMatchesLookup(action, normalizeActionLookupCriteria({ ticker: "BOA", marketTicker: "BRVM" })), false);
  assert.equal(actionMatchesLookup(action, normalizeActionLookupCriteria({ ticker: "BOA_NG", marketTicker: "CSE" })), false);
  assert.equal(actionMatchesLookup(action, normalizeActionLookupCriteria({ ticker: "BOA", marketTicker: "CSE", isin: "WRONG" })), false);
});
