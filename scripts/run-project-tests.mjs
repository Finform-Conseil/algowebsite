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
    "app/api/proxy/security.test.cjs",
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
