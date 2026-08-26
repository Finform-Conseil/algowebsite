/* eslint-env node */
const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

require("../../../../store/__tests__/testTypeScriptLoader.cjs");

const {
  DIVIDEND_INITIAL_PAGE,
  DIVIDEND_PAGE_LIMIT,
  DIVIDEND_PAGE_SIZE,
  buildScopedDividendQuery,
  filterDividendsForTicker,
} = require("../sidebarDividendPolicy.ts");

describe("sidebar dividend pagination policy", () => {
  it("uses one bounded initial page instead of trusting global total_pages", () => {
    assert.equal(DIVIDEND_INITIAL_PAGE, 1);
    assert.equal(DIVIDEND_PAGE_LIMIT, 1);
    assert.deepEqual(buildScopedDividendQuery(" fab "), {
      action_ticker: "FAB",
      page: 1,
      page_size: DIVIDEND_PAGE_SIZE,
    });
  });

  it("rejects rows returned for another ticker by the unscoped API", () => {
    const rows = [
      { action_ticker: "FAB", amount: 10 },
      { action_ticker: "THE_BIDVEST_GROUP_LIMITED", amount: 20 },
      { action_ticker: undefined, amount: 30 },
    ];

    assert.deepEqual(filterDividendsForTicker(rows, "FAB"), [rows[0]]);
    assert.deepEqual(filterDividendsForTicker(rows, ""), []);
  });

  it("does not build a request for an empty ticker", () => {
    assert.equal(buildScopedDividendQuery("   "), null);
  });
});
