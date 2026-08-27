/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const policyPath = path.join(__dirname, "circuit-scope.ts");

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

const { buildProxyCircuitBreakerScope } = require(policyPath);

const params = (value) => new URLSearchParams(value);

test("action lookup, catalog and detail use isolated circuit breakers", () => {
  assert.equal(
    buildProxyCircuitBreakerScope("10", "/api/v1/actions", params("ticker=BOA&bourse_tickers=CSE&view_type=screener")),
    "api-10:actions:lookup",
  );
  assert.equal(
    buildProxyCircuitBreakerScope("10", "/api/v1/actions", params("view_type=screener&bourse_tickers=CSE&page=1")),
    "api-10:actions:catalog",
  );
  assert.equal(
    buildProxyCircuitBreakerScope("10", "/api/v1/actions/5d25520d-b72d-4083-a58d-9ad55fb892d1", params("")),
    "api-10:actions:detail",
  );
});

test("cours history is isolated from action failures", () => {
  assert.equal(
    buildProxyCircuitBreakerScope("10", "/api/v1/cours", params("instrument=3a0f512e-90d7-4816-84cf-fe576a0c5640&page=1")),
    "api-10:cours:instrument",
  );
});

test("scope remains bounded and never embeds ticker, isin or UUID values", () => {
  const scope = buildProxyCircuitBreakerScope(
    "10",
    "/api/v1/actions",
    params("ticker=SECRET_TICKER&isin=SECRET_ISIN&bourse_tickers=CSE"),
  );
  assert.equal(scope, "api-10:actions:lookup");
  assert.equal(scope.includes("SECRET"), false);
});

test("fixed-income subresources keep independent bounded families", () => {
  assert.equal(
    buildProxyCircuitBreakerScope("10", "/api/v1/fixed-income/bond-securities", params("page_size=100")),
    "api-10:fixed-income.bond-securities:list",
  );
});
