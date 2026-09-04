const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const technicalAnalysisSource = read("components/technical-analysis/TechnicalAnalysis.tsx");
const menuSource = read("components/technical-analysis/components/chart/ChartContextMenu.tsx");
const multiGridSource = read("components/technical-analysis/components/layout/MultiChartLayoutGrid.tsx");
const reducerSource = read("components/technical-analysis/store/reducers/indicatorReducers.ts");
const sliceSource = read("components/technical-analysis/store/technicalAnalysisSlice.ts");
const policySource = read("components/technical-analysis/store/policies/indicatorVisibilityPolicy.ts");
const styleSource = read("styles/pages/_technical-analysis-final.scss");

test("chart surface owns right-click in single and multi-chart instead of the browser canvas menu", () => {
  assert.match(technicalAnalysisSource, /className=\{clsx\("gp-chart-container"[\s\S]*?data-chart-context-menu-surface="true"[\s\S]*?onContextMenuCapture=\{!isMultiChartMode \? handlePrimaryChartContextMenu : undefined\}/);
  assert.match(technicalAnalysisSource, /onContextMenuCapture=\{handleTechnicalAnalysisContextMenuCapture\}/);
  assert.match(technicalAnalysisSource, /const handleTechnicalAnalysisContextMenuCapture[\s\S]*?event\.preventDefault\(\)[\s\S]*?closest\('\[data-chart-context-menu-surface="true"\]'\)[\s\S]*?if \(isChartSurface\) return;[\s\S]*?event\.stopPropagation\(\);[\s\S]*?closeChartContextMenu\(\)/);
  assert.match(multiGridSource, /onContextMenuCapture=\{\(event\) => \{/);
  assert.match(multiGridSource, /event\.target\.closest\("\.gp-peer-chart"\)/);
  assert.match(multiGridSource, /event\.preventDefault\(\);[\s\S]*?onChartContextMenu\?\.\(\{/);
  assert.match(menuSource, /role="menu"/);
  assert.match(menuSource, /data-chart-context-menu="true"/);
  assert.match(menuSource, /resolveChartContextPriceAtClientPoint/);
  assert.match(menuSource, /chart\.containPixel\(\{ gridIndex: 0 \}, point\)/);
  assert.match(menuSource, /chart\.convertFromPixel\(\{ gridIndex: 0 \}, point as never\)/);
  assert.doesNotMatch(menuSource, /convertFromPixel\(\{ yAxisIndex: 0 \}/);
});

test("context menu exposes real chart workflows and keeps unsupported commands non-deceptive", () => {
  for (const action of [
    "reset-view",
    "copy-price",
    "alert",
    "sell-limit",
    "buy-stop",
    "buy-limit",
    "sell-stop",
    "order",
    "table-view",
    "object-tree",
    "chart-template",
    "remove-indicators",
    "settings",
  ]) {
    assert.match(menuSource, new RegExp(`(?:id:|\\|) "${action}"`));
  }
  assert.match(menuSource, /id: "paste"[\s\S]*?disabled: true/);
  assert.match(menuSource, /id: "lock-time-cursor"[\s\S]*?disabled: true/);
  assert.match(menuSource, /id: "table-view"[\s\S]*?disabled: true/);
  assert.match(menuSource, /Data Window reste une fonction distincte/);
  assert.doesNotMatch(
    technicalAnalysisSource,
    /actionId === "table-view"[\s\S]{0,500}?openObjectTreeTab\("data_window"\)/,
  );
  assert.match(technicalAnalysisSource, /TimeAxisRegistry\.get\(chart\)\?\.reset\(\)/);
  assert.match(technicalAnalysisSource, /openObjectTreeTab\("object_tree"\)/);
  assert.match(technicalAnalysisSource, /modal: "templates"/);
  assert.match(technicalAnalysisSource, /modal: "settings"/);
});

test("quick orders follow TradingView price polarity and fail closed without a reference close", () => {
  assert.match(menuSource, /resolveChartContextOrderRelation/);
  assert.match(menuSource, /priceValue >= referencePriceValue \? "above-or-equal" : "below"/);
  assert.match(menuSource, /orderRelation === "below"[\s\S]*?id: "buy-limit"[\s\S]*?Alt \+ Shift \+ B[\s\S]*?id: "sell-stop"/);
  assert.match(menuSource, /id: "sell-limit"[\s\S]*?Alt \+ Shift \+ S[\s\S]*?id: "buy-stop"/);
  assert.doesNotMatch(menuSource, /id: "buy-stop"[\s\S]{0,220}?Alt \+ Shift \+ B/);
  assert.match(menuSource, /Dernier cours indisponible : le type limit\/stop ne peut pas être déterminé sûrement/);
  assert.match(multiGridSource, /referencePriceValue: number \| null/);
  assert.match(multiGridSource, /resolveLatestFiniteClose\(cellData\)/);
  assert.match(technicalAnalysisSource, /request\.referencePriceValue/);
  assert.match(technicalAnalysisSource, /menu\.referencePriceValue \?\? convertedLastCandleClose/);
  for (const mapping of [
    /actionId === "sell-limit"[\s\S]*?side: "sell" as const, orderType: "limit" as const/,
    /actionId === "buy-stop"[\s\S]*?side: "buy" as const, orderType: "stop" as const/,
    /actionId === "buy-limit"[\s\S]*?side: "buy" as const, orderType: "limit" as const/,
    /actionId === "sell-stop"[\s\S]*?side: "sell" as const, orderType: "stop" as const/,
  ]) assert.match(technicalAnalysisSource, mapping);
});

test("Remove indicators is canonical, counts study families and includes Volume", () => {
  assert.match(sliceSource, /clearAllIndicators/);
  assert.match(reducerSource, /clearAllIndicatorVisibility\(state\)/);
  assert.match(policySource, /chartIndicators\.volume \? 1 : 0/);
  assert.match(policySource, /state\.chartConfig\.indicators\.volume = false/);
  assert.doesNotMatch(policySource, /state\.chartAppearance\.showVolume = false/);
  assert.match(policySource, /state\.advancedIndicators\[key\] = false/);
  assert.match(policySource, /syncActiveCellIndicatorSnapshot\(state\)/);
  assert.match(technicalAnalysisSource, /dispatch\(clearAllIndicators\(\)\)/);
  assert.match(menuSource, /indicatorCount: number/);
  assert.match(technicalAnalysisSource, /request\.indicatorState\.chart/);
  assert.match(technicalAnalysisSource, /targetIndicatorCount/);
  assert.match(technicalAnalysisSource, /message: `\$\{menu\.indicatorCount\}/);
});

test("context menu has measured TradingView geometry, bounded placement and accessible states", () => {
  assert.match(styleSource, /\.gp-chart-context-menu \{/);
  assert.match(styleSource, /position: fixed/);
  assert.match(styleSource, /width: min\(346px, calc\(100vw - 16px\)\)/);
  assert.match(styleSource, /max-height: calc\(100vh - 16px\)/);
  assert.match(styleSource, /\.gp-chart-context-menu__separator[\s\S]*?margin: 7px 0/);
  assert.match(styleSource, /\.gp-chart-context-menu__item[\s\S]*?min-height: 32px/);
  assert.match(styleSource, /\.gp-chart-context-menu__item[\s\S]*?font-size: 14px/);
  assert.match(styleSource, /\.gp-chart-context-menu__item:disabled/);
  assert.match(styleSource, /\.gp-chart-context-menu__item\.is-danger/);
  assert.match(menuSource, /data-action-id=\{item\.id\}/);
  assert.match(menuSource, /window\.innerWidth - rect\.width - EDGE_MARGIN_PX/);
  assert.match(menuSource, /window\.innerHeight - rect\.height - EDGE_MARGIN_PX/);
  assert.match(menuSource, /event\.key !== "Escape"[\s\S]*?event\.preventDefault\(\)[\s\S]*?event\.stopPropagation\(\)/);
});

test("chart and price-scale context menus reuse the canonical TA dark-blue modal palette", () => {
  assert.match(styleSource, /\.tv-chart-settings-modal \{[^}]*background: #0f2740 !important;/);
  assert.match(styleSource, /\.gp-price-scale-context-menu \{[^}]*border: 1px solid rgba\(96, 165, 250, \.24\);[^}]*background: #0f2740;[^}]*color: #e5eefc;/);
  assert.match(styleSource, /\.gp-chart-context-menu \{[^}]*border: 1px solid rgba\(96, 165, 250, \.24\);[^}]*background: #0f2740;[^}]*color: #e5eefc;/);
  assert.doesNotMatch(styleSource, /\.gp-price-scale-context-menu \{[^}]*background: rgba\(20, 24, 32/);
  assert.doesNotMatch(styleSource, /\.gp-chart-context-menu \{[^}]*background: rgba\(16, 23, 38/);
});
