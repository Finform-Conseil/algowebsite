const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = process.cwd();
const componentPath = path.join(
  root,
  "components/technical-analysis/components/modals/settings/GlobalSettingsModal.tsx",
);
const stylesheetPath = path.join(root, "styles/pages/_technical-analysis-final.scss");
const rendererPath = path.join(root, "components/technical-analysis/hooks/useEChartsRenderer.ts");

const component = fs.readFileSync(componentPath, "utf8");
const stylesheet = fs.readFileSync(stylesheetPath, "utf8");
const renderer = fs.readFileSync(rendererPath, "utf8");

test("GlobalSettingsModal exposes the replicated TradingView settings shell", () => {
  assert.match(component, /title="Parametres"/);
  assert.match(component, /className="tv-chart-settings-modal"/);
  assert.match(component, /overlayClassName="tv-chart-settings-overlay"/);
  assert.doesNotMatch(component, /ModalTabs/);
  assert.doesNotMatch(component, /SettingsField/);
});

test("GlobalSettingsModal keeps only settings categories wired to local chart state", () => {
  [
    "Symbole",
    "Ligne d'etat",
    "Echelles et lignes",
    "Canvas",
    "Indicateurs",
  ].forEach((label) => assert.match(component, new RegExp(label)));

  [
    "Trading",
    "Alertes",
    "Evenements",
  ].forEach((label) => assert.doesNotMatch(component, new RegExp(label)));
});

test("GlobalSettingsModal canvas panel contains only functional chart controls", () => {
  [
    "Styles de base du graphique",
    "Arriere-plan",
    "Lignes verticales",
    "Lignes horizontales",
    "Reticule",
    "Filigrane",
    "Echelles",
    "Marges",
    "Haut",
    "Bas",
    "Droite",
  ].forEach((label) => assert.match(component, new RegExp(label)));

  ["Boutons", "Navigation", "Pane"].forEach((label) => assert.doesNotMatch(component, new RegExp(label)));
});

test("GlobalSettingsModal footer removes Template and keeps Cancel and OK actions", () => {
  assert.doesNotMatch(component, /Template/);
  assert.doesNotMatch(component, /Clean/);
  assert.doesNotMatch(component, /Dense/);
  assert.doesNotMatch(component, /Par defaut/);
  assert.match(component, />\s*Annuler\s*</);
  assert.match(component, />\s*OK\s*</);
  assert.match(component, /handleConfirm/);
  assert.doesNotMatch(component, /resetChartAppearance/);
});

test("GlobalSettingsModal uses a transactional preview/commit contract", () => {
  [
    "setChartAppearance",
    "setChartAppearancePreview",
    "commitLayoutChartAppearance",
    "setIndicatorPeriods",
    "setAnonyme",
    "selectChartAppearance",
    "selectIndicatorPeriods",
    "selectUiState",
    "draftAppearanceRef",
    "transactionRef",
    "previewChartId",
    "layoutChartId",
    "handleCancel",
    "handleConfirm",
  ].forEach((token) => assert.match(component, new RegExp(token)));

  assert.match(component, /dispatch\(setChartAppearancePreview\(null\)\)/);
  assert.match(component, /commitLayoutChartAppearance\(\{ chartId: transaction\.layoutChartId, appearance: committed \}\)/);
  assert.match(component, /onClose\(\)/);
  assert.doesNotMatch(component, /setModalOpen/);
});

test("TradingView replica CSS locks the modal geometry and dark blue visual system", () => {
  [
    ".tv-chart-settings-modal",
    "width: min(750px, calc(100vw - 32px))",
    "height: min(680px, var(--tv-settings-modal-available-height))",
    "background: #0f2740 !important",
    "background: #0b1f33 !important",
    "grid-template-columns: 206px minmax(0, 1fr)",
    ".tv-settings-nav-item",
    ".tv-settings-section-title",
    ".tv-settings-checkbox",
    ".tv-settings-color",
    ".tv-settings-line-button",
    ".tv-settings-footer",
  ].forEach((token) => assert.ok(stylesheet.includes(token), `missing ${token}`));

  assert.doesNotMatch(stylesheet, /\.tv-chart-settings-modal[\s\S]*?background:\s*#fff\s*!important/);
});

test("GlobalSettingsModal canvas controls dispatch chart appearance mutations consumed by ECharts", () => {
  [
    "verticalGridLines",
    "horizontalGridLines",
    "verticalGridLineStyle",
    "horizontalGridLineStyle",
    "gridLineColor",
    "verticalGridLineColor",
    "horizontalGridLineColor",
    "verticalGridLineOpacity",
    "horizontalGridLineOpacity",
    "backgroundMode",
    "backgroundGradientTopColor",
    "backgroundGradientBottomColor",
    "crosshairColor",
    "watermarkMode",
    "watermarkColor",
    "scaleTextColor",
    "scaleTextSize",
    "scaleLineColor",
    "marginTopPercent",
    "marginBottomPercent",
    "rightOffsetBars",
  ].forEach((token) => {
    assert.match(component, new RegExp(token), `modal missing ${token}`);
    assert.match(renderer, new RegExp(token), `renderer missing ${token}`);
  });
});

test("Canvas controls expose independent add/remove semantics and disabled styling controls", () => {
  assert.match(component, /updateGridVisibility\(\{ verticalGridLines: checked \}\)/);
  assert.match(component, /updateGridVisibility\(\{ horizontalGridLines: checked \}\)/);
  assert.match(component, /disabled=\{!verticalGridLines\}/);
  assert.match(component, /disabled=\{!horizontalGridLines\}/);
  assert.match(component, /value:\s*"gradient"/);
});
