/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const projectRoot = path.resolve(__dirname, "../../..");
const policyPath = path.join(projectRoot, "core/infra/repositories/action-lookup.policy.ts");
const repositoryImplPath = path.join(projectRoot, "core/infra/repositories/action.repository.impl.ts");

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
  buildActionLookupPlan,
  buildActionLookupQuery,
  buildActionLookupRequestKey,
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

test("lookup plan stays indexed for scoped and unscoped identities", () => {
  const scoped = normalizeActionLookupCriteria({
    ticker: "BOA",
    marketTicker: "CSE",
    isin: "MA0000012437",
  });
  assert.deepEqual(buildActionLookupPlan(scoped), {
    strategy: "indexed",
    fields: ["isin", "ticker"],
  });

  const unscopedWithIsin = normalizeActionLookupCriteria({ ticker: "BOA", isin: "MA0000012437" });
  assert.deepEqual(buildActionLookupPlan(unscopedWithIsin), {
    strategy: "indexed",
    fields: ["isin", "ticker"],
  });

  const unscopedTickerOnly = normalizeActionLookupCriteria({ ticker: "BOA" });
  assert.deepEqual(buildActionLookupPlan(unscopedTickerOnly), {
    strategy: "indexed",
    fields: ["ticker"],
  });
});

test("scoped ISIN lookup remains server-filtered and bounded to one candidate", () => {
  const criteria = normalizeActionLookupCriteria({
    ticker: "BOA",
    marketTicker: "CSE",
    isin: "MA0000012437",
  });
  assert.deepEqual(buildActionLookupQuery(criteria, "isin"), {
    page: 1,
    page_size: 1,
    isin: "MA0000012437",
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

test("repository never caches hook-bound RTK request promises in module scope", () => {
  const source = fs.readFileSync(repositoryImplPath, "utf8");
  assert.equal(source.includes("actionRequestsInFlight"), false);
  assert.equal(source.includes("getSharedActionRequest"), false);
  assert.match(source, /triggerGetAllActions\(params, preferCacheValue\)\.unwrap\(\)/);
  assert.match(source, /triggerGetActionById\(\{ id: candidateId \}, true\)\.unwrap\(\)/);
});
