const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const technicalAnalysisSource = read("components/technical-analysis/TechnicalAnalysis.tsx");
const menuSource = read("components/technical-analysis/components/chart/PriceScaleContextMenu.tsx");
const overlaySource = read("components/technical-analysis/components/overlays/PriceAxisOverlay.tsx");
const rendererSource = read("components/technical-analysis/hooks/useEChartsRenderer.ts");
const stateTypesSource = read("components/technical-analysis/config/state/chartStateTypes.ts");
const initialStateSource = read("components/technical-analysis/store/initialState.ts");
const reducerSource = read("components/technical-analysis/store/reducers/chartConfigReducers.ts");
const styleSource = read("styles/pages/_technical-analysis-final.scss");

test("price scale right-click is a dedicated surface distinct from the chart-body menu", () => {
  assert.match(menuSource, /isPriceScaleContextPoint/);
  assert.match(menuSource, /option\.grid/);
  assert.match(menuSource, /gridRecord\?\.\[position\]/);
  assert.match(menuSource, /position === "left"[\s\S]*?clientX <= rect\.left \+ gutter[\s\S]*?clientX >= rect\.right - gutter/);
  assert.match(menuSource, /TIME_AXIS_EXCLUSION_PX = 30/);
  assert.match(technicalAnalysisSource, /isPriceScaleContextPoint\(chart, event\.clientX, event\.clientY, priceScalePosition\)[\s\S]*?openPriceScaleContextMenu\(event, chart, null\)[\s\S]*?openChartContextMenu/);
  assert.match(technicalAnalysisSource, /isPriceScaleContextPoint\(request\.chart, request\.event\.clientX, request\.event\.clientY, priceScalePosition\)[\s\S]*?setActiveLayoutChart\(request\.cell\.chartId\)[\s\S]*?openPriceScaleContextMenu/);
  assert.match(menuSource, /data-price-scale-context-menu="true"/);
});

test("price scale menu mirrors the audited TradingView command families without fake enabled actions", () => {
  for (const action of [
    "reset-price-scale",
    "auto-scale",
    "lock-price-bar-ratio",
    "scale-price-chart-only",
    "invert-scale",
    "mode-regular",
    "mode-percent",
    "mode-indexed-to-100",
    "mode-logarithmic",
    "move-scale",
    "labels",
    "lines",
    "plus-button",
    "more-settings",
  ]) {
    assert.match(menuSource, new RegExp(`(?:id:|\\|) "${action}"`));
  }
  assert.match(menuSource, /id: "lock-price-bar-ratio"[\s\S]*?disabled: true/);
  assert.match(menuSource, /id: "scale-price-chart-only"[\s\S]*?disabled: true/);
  assert.match(menuSource, /Alt \+ R/);
  assert.match(menuSource, /Alt \+ I/);
  assert.match(menuSource, /Alt \+ P/);
  assert.match(menuSource, /Alt \+ L/);
});

test("price scale appearance is persisted and rendered by the canonical ECharts option", () => {
  assert.match(stateTypesSource, /PriceScaleMode = "regular" \| "percent" \| "indexed-to-100" \| "logarithmic"/);
  assert.match(initialStateSource, /priceScaleMode: "regular"/);
  assert.match(initialStateSource, /priceScalePosition: "right"/);
  assert.match(reducerSource, /p\.priceScaleMode !== undefined/);
  assert.match(reducerSource, /p\.priceScalePosition !== undefined/);
  assert.match(reducerSource, /p\.priceScaleInverted !== undefined/);
  assert.match(rendererSource, /type: priceScaleMode === "logarithmic" \? "log" : "value"/);
  assert.match(rendererSource, /position: priceScalePosition/);
  assert.match(rendererSource, /inverse: priceScaleInverted/);
  assert.match(rendererSource, /priceScaleMode === "percent"[\s\S]*?\* 100\)\.toFixed\(2\)/);
  assert.match(rendererSource, /priceScaleMode === "indexed-to-100"[\s\S]*?\* 100\)\.toFixed\(2\)/);
  assert.match(rendererSource, /axisLabel: \{ show: priceScaleLabelsVisible/);
  assert.match(rendererSource, /splitLine: \{ \.\.\.subtleHorizontalGrid, show: subtleHorizontalGrid\.show && priceScaleLinesVisible \}/);
});

test("left/right scale and plus-button visibility stay aligned with the overlay", () => {
  assert.match(overlaySource, /priceScalePosition: PriceScalePosition/);
  assert.match(overlaySource, /showPlusButton: boolean/);
  assert.match(overlaySource, /isLeftScale \? \{ left: "0px" \} : \{ right: "0px" \}/);
  assert.match(overlaySource, /display: showPlusButton \? "inline-flex" : "none"/);
  assert.match(technicalAnalysisSource, /priceScalePosition=\{chartAppearance\.priceScalePosition === "left" \? "left" : "right"\}/);
  assert.match(technicalAnalysisSource, /showPlusButton=\{chartAppearance\.showPriceScalePlusButton !== false\}/);
});

test("price scale menu geometry follows the measured narrow TradingView surface and is keyboard safe", () => {
  assert.match(styleSource, /\.gp-price-scale-context-menu \{/);
  assert.match(styleSource, /width: min\(224px, calc\(100vw - 16px\)\)/);
  assert.match(styleSource, /\.gp-price-scale-context-menu__item[\s\S]*?min-height: 32px/);
  assert.match(menuSource, /window\.innerWidth - rect\.width - EDGE_MARGIN_PX/);
  assert.match(menuSource, /window\.innerHeight - rect\.height - EDGE_MARGIN_PX/);
  assert.match(menuSource, /event\.key !== "Escape"[\s\S]*?event\.preventDefault\(\)[\s\S]*?event\.stopPropagation\(\)/);
});
