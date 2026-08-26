/* eslint-env node */
require("../../store/__tests__/testTypeScriptLoader.cjs");

const test = require("node:test");
const assert = require("node:assert/strict");

const { resolveLayoutTickerMarket } = require("./layoutTickerSelection.ts");

test("CSE layout selection stays scoped to CSE", () => {
  assert.deepEqual(resolveLayoutTickerMarket("cse"), {
    ticker: "CSE",
    name: "CSE",
    currency: "MAD",
  });
});

test("BRVM layout selection stays scoped to BRVM", () => {
  assert.deepEqual(resolveLayoutTickerMarket("BRVM"), {
    ticker: "BRVM",
    name: "BRVM",
    currency: "XOF",
  });
});

test("unknown exchanges fail closed instead of inheriting the global market", () => {
  assert.equal(resolveLayoutTickerMarket("UNKNOWN"), null);
  assert.equal(resolveLayoutTickerMarket(""), null);
});
