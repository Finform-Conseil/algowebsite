import { spawnSync } from "node:child_process";

const suites = [
  ["scripts/test-candlestick-patterns.cjs"],
  [
    "--test",
    "components/technical-analysis/components/sidebar/panels/alertsRail/__tests__/alertsRailRuntime.test.cjs",
  ],
  [
    "--test",
    "components/technical-analysis/components/sidebar/panels/pineEditor/__tests__/pineEditor.test.cjs",
  ],
  [
    "--test",
    "components/design-system/commons/TickerSelectorModal/context/tickerCatalogContract.test.cjs",
  ],
  [
    "--test",
    "components/technical-analysis/config/layout/multiChartLayouts.test.cjs",
    "components/technical-analysis/components/layout/layoutChartData.test.cjs",
    "components/technical-analysis/components/layout/multiChartDragReorder.test.cjs",
    "components/technical-analysis/components/layout/multiChartInteractionParity.test.cjs",
    "components/technical-analysis/components/modals/settings/globalSettingsModalTradingViewReplica.test.cjs",
    "components/technical-analysis/store/__tests__/chartModalPolicies.test.cjs",
    "components/technical-analysis/lib/DrawingRenderer.hitTest.test.cjs",
    "components/technical-analysis/components/chart/chartAsyncPresentation.test.cjs",
    "components/technical-analysis/hooks/chart-rendering/bandSeries.test.cjs",
    "components/technical-analysis/store/policies/multiChartIndicatorStatePolicy.test.cjs",
    "components/technical-analysis/lib/chart-types/chartTypeContract.test.cjs",
    "components/technical-analysis/hooks/viewport/viewportChangeCommit.test.cjs",
  ],
  [
    "--test",
    "components/technical-analysis/config/market/comparisonRequestIdentity.test.cjs",
    "components/technical-analysis/hooks/MarketData/marketDataCanonicalCacheHistory.test.cjs",
    "core/infra/cache/sharedRequestCache.test.cjs",
  ],
  [
    "--test",
    "core/infra/repositories/action-lookup.policy.test.cjs",
  ],
  [
    "--test",
    "core/data/__tests__/brvm-logo-registry.test.cjs",
  ],
  [
    "--test",
    "core/data/__tests__/market-logo-registry.test.cjs",
  ],
  [
    "--test",
    "app/api/proxy/security.test.cjs",
    "app/api/proxy/circuit-scope.test.cjs",
    "app/api/proxy/path-normalizer.test.mjs",
    "app/api/proxy/response-guard.test.mjs",
    "app/api/proxy/single-flight.test.mjs",
    "app/api/proxy/metrics.test.mjs",
  ],
];

for (const args of suites) {
  const result = spawnSync(process.execPath, args, {
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
