const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const providers = fs.readFileSync(
  path.resolve(__dirname, "TechnicalAnalysisProviders.tsx"),
  "utf8",
);
const selector = fs.readFileSync(
  path.resolve(__dirname, "../../design-system/commons/TickerSelectorModal/TickerSelectorModal.tsx"),
  "utf8",
);

test("single-chart ticker selection commits Redux symbol synchronously", () => {
  assert.match(
    selector,
    /if \(!isMultiChartSelection\) \{[\s\S]*dispatch\(setSymbol\(selectedSecurity\.ticker\)\);[\s\S]*\}\s*setSelectedTicker\(selectedSecurity\);/,
    "single-chart selection must commit the canonical Redux symbol before mirroring selector context",
  );
});

test("market data, security metadata and toolbar label share the canonical ticker resolver", () => {
  const calls = providers.match(/resolveActiveTickerSymbol\(\{/g) ?? [];
  assert.ok(calls.length >= 3, "all ticker consumers must use the same canonical resolver");
  assert.match(
    providers,
    /isMultiChartMode\s*\?\s*layoutSymbol\s*:\s*chartConfigSymbol \|\| selectedTickerSymbol \|\| preferredTicker/,
    "single-chart Redux must be canonical while multi-chart remains cell-isolated",
  );
});
