const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const tokens = read("styles/abstracts/_tokens.scss");
const variables = read("styles/abstracts/_variables.scss");
const globals = read("styles/globals.scss");
const technicalAnalysis = read("styles/pages/_technical-analysis-final.scss");
const settingsField = read("components/technical-analysis/components/common/inputs/SettingsField.tsx");
const modalTabs = read("components/technical-analysis/components/common/primitives/ModalTabs.tsx");
const objectTreeStyles = read("components/technical-analysis/components/panels/object-tree/objectTreePanelStyles.ts");
const chartToolbar = read("components/technical-analysis/components/toolbar/ChartToolbar.tsx");

const rootContract = technicalAnalysis.slice(
  technicalAnalysis.indexOf(".technical-analysis-root {"),
  technicalAnalysis.indexOf("// --- Layout:", technicalAnalysis.indexOf(".technical-analysis-root {")),
);

test("global runtime design tokens are sourced from the canonical Sass scale", () => {
  assert.match(tokens, /\$spacing-2xs:\s*0\.25rem;/);
  assert.match(tokens, /\$border-radius-xs:\s*0\.25rem;/);
  assert.match(variables, /--space-xs:\s*#\{\$spacing-xs\};/);
  assert.match(variables, /--radius-md:\s*#\{\$border-radius-md\};/);
  assert.match(variables, /--transition-fast:\s*#\{\$transition-fast\};/);
  assert.match(variables, /--surface-contextual:\s*#304653;/);
  assert.match(
    variables,
    /\[data-theme='light'\][\s\S]*--surface-contextual:\s*#E7E9EA;/,
  );
});

test("Technical Analysis consumes global semantic theme tokens instead of owning a parallel palette", () => {
  const expectedAliases = [
    "--ta-surface-canvas: var(--surface-page);",
    "--ta-surface-panel: var(--surface-elevated);",
    "--ta-surface-toolbar: var(--surface-inset);",
    "--ta-surface-popover: var(--surface-popover);",
    "--ta-surface-modal: var(--surface-modal);",
    "--gp-bg-primary: var(--ta-surface-canvas);",
    "--gp-bg-card: var(--ta-surface-panel);",
    "--gp-bg-toolbar: var(--ta-surface-toolbar);",
    "--gp-bg-popover: var(--ta-surface-popover);",
    "--gp-bg-modal: var(--ta-surface-modal);",
    "--gp-text-primary: var(--text-primary);",
    "--gp-text-secondary: var(--text-secondary);",
    "--gp-border-color: var(--ta-border-strong);",
    "--gp-border-color-light: var(--ta-border-subtle);",
    "--gp-accent-gold: var(--accent-gold);",
    "--gp-accent-red: var(--negative-color);",
    "--gp-accent-green: var(--positive-color);",
    "--gp-accent-blue: var(--primary-color);",
    "--gp-bg-hover: var(--hover-background);",
    "--gp-bg-active: var(--active-background);",
  ];
  for (const alias of expectedAliases) assert.ok(rootContract.includes(alias), alias);
  assert.doesNotMatch(rootContract, /--gp-(?:bg-primary|bg-card|bg-toolbar|text-primary|text-secondary|border-color(?:-light)?|accent-(?:gold|red|green|blue)):\s*(?:#|rgb)/i);
  assert.match(
    technicalAnalysis,
    /\[data-theme='light'\] \.technical-analysis-root \{[\s\S]*--ta-surface-panel:\s*var\(--surface-card\);[\s\S]*--ta-surface-toolbar:\s*var\(--surface-card\);/,
    "light mode must keep TA on global light surfaces instead of inheriting dark workspace depth",
  );
});

test("TA root form resets stay zero-specificity so modal primitives can own their layout", () => {
  assert.match(technicalAnalysis, /:where\(\.technical-analysis-root\)\s+:where\(label\)\s*\{/);
  assert.match(technicalAnalysis, /:where\(\.technical-analysis-root\)\s+:where\([\s\S]*input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\):not\(\[type="color"\]\):not\(\[type="range"\]\)[\s\S]*textarea,[\s\S]*select[\s\S]*\)\s*\{/);
  assert.doesNotMatch(technicalAnalysis, /\.technical-analysis-root\s+label\s*\{/);
  assert.doesNotMatch(technicalAnalysis, /\.technical-analysis-root\s+(?:input|textarea|select)/);
  for (const selector of [
    ".gp-broker-checkbox",
    ".tv-compare-settings__row",
    ".tv-compare-settings__check-row",
    ".gp-keyboard-shortcuts__search",
    ".technical-analysis-root .tv-settings-checkbox",
    ".technical-analysis-root .tv-settings-color",
  ]) {
    assert.ok(technicalAnalysis.includes(selector), selector);
  }
});

test("TA spacing, radius, icon and interaction geometry aliases the shared runtime scale", () => {
  for (const alias of [
    "--gp-space-xs: var(--space-xs);",
    "--gp-space-sm: var(--space-sm);",
    "--gp-radius-xs: var(--radius-xs);",
    "--gp-radius-sm: var(--radius-sm);",
    "--gp-radius-md: var(--radius-md);",
    "--gp-control-height-xs: var(--control-height-xs);",
    "--gp-control-height-md: var(--control-height-md);",
    "--gp-icon-btn-size: var(--icon-button-size);",
    "--gp-toolbar-btn-size: var(--toolbar-button-size);",
    "--gp-icon-size-md: var(--icon-size-md);",
    "--gp-transition-fast: var(--transition-fast);",
  ]) assert.ok(rootContract.includes(alias), alias);
});

test("TA toolbar and sidebar interaction geometry are token-driven", () => {
  assert.match(technicalAnalysis, /\.gp-history-btn\s*\{[\s\S]*width:\s*var\(--gp-toolbar-chip-height\)/);
  assert.match(technicalAnalysis, /\.gp-sidebar-rail-btn\s*\{[\s\S]*width:\s*var\(--gp-toolbar-btn-size\)[\s\S]*border-radius:\s*var\(--gp-radius-sm\)/);
  assert.match(technicalAnalysis, /\.gp-toolbar-btn\s*\{[\s\S]*&:focus-visible\s*\{[\s\S]*var\(--focus-ring-color\)/);
  assert.match(technicalAnalysis, /\.gp-sidebar-toggle-btn\s*\{[\s\S]*border-radius:\s*var\(--gp-radius-full\)[\s\S]*var\(--gp-icon-size-sm\)/);
});

test("TA topbar interaction primitives share the original 32px symbol-selector geometry", () => {
  assert.match(technicalAnalysis, /--gp-toolbar-chip-height:\s*2rem;/);
  assert.match(technicalAnalysis, /\.gp-horizontal-toolbar \.gp-toolbar-btn\s*\{[\s\S]*min-width:\s*var\(--gp-toolbar-chip-height\)[\s\S]*max-height:\s*var\(--gp-toolbar-chip-height\)/);
  assert.match(technicalAnalysis, /\.gp-history-btn\s*\{[\s\S]*width:\s*var\(--gp-toolbar-chip-height\)/);
  assert.match(technicalAnalysis, /\.gp-toolbar-symbol-selector\s*\{[\s\S]*height:\s*var\(--gp-toolbar-chip-height\)/);
  assert.match(technicalAnalysis, /\.gp-market-selector-button\s*\{[\s\S]*height:\s*var\(--gp-toolbar-chip-height\)/);
  assert.match(technicalAnalysis, /\.btn-publish\s*\{[\s\S]*height:\s*var\(--gp-toolbar-chip-height\)/);
  assert.match(technicalAnalysis, /\.gp-toolbar-text-label,[\s\S]*font-size:\s*13px;[\s\S]*font-weight:\s*600;[\s\S]*line-height:\s*1;/);
  assert.match(chartToolbar, /<span className="gp-toolbar-text-label">\{tf\}<\/span>/);
  assert.match(chartToolbar, /gp-toolbar-volume-toggle__label gp-toolbar-text-label/);
  assert.doesNotMatch(chartToolbar, /fontSize:\s*"13px",\s*fontWeight:\s*600,\s*lineHeight:\s*1/);
});

test("TA footer and Object Tree use deliberate compact interaction families", () => {
  assert.match(technicalAnalysis, /\.gp-time-range-btn\s*\{[\s\S]*height:\s*var\(--gp-control-height-xs\)[\s\S]*background:\s*var\(--gp-bg-active\)/);
  assert.match(technicalAnalysis, /\.gp-render-engine-switch\s*\{[\s\S]*height:\s*var\(--gp-control-height-xs\)[\s\S]*gap:\s*2px;[\s\S]*padding:\s*2px;[\s\S]*overflow:\s*hidden;/);
  assert.match(technicalAnalysis, /\.gp-render-engine-btn\s*\{[\s\S]*border-radius:\s*6px;[\s\S]*height:\s*calc\(var\(--gp-control-height-xs\) - 6px\)[\s\S]*&\.active,[\s\S]*background:\s*color-mix\(in srgb, var\(--gp-bg-active\) 88%, var\(--gp-bg-toolbar\) 12%\)/);
  assert.match(technicalAnalysis, /\.gp-object-tree-toolbar-action\s*\{[\s\S]*width:\s*var\(--gp-control-height-xs\)/);
  assert.match(technicalAnalysis, /\.gp-object-tree-row-action\s*\{[\s\S]*width:\s*24px;[\s\S]*height:\s*24px;/);
});

test("TA generic overlays consume global popover/modal surfaces", () => {
  assert.match(variables, /--surface-popover:\s*var\(--surface-elevated\);/);
  assert.match(variables, /--surface-modal:\s*var\(--surface-elevated\);/);
  assert.match(variables, /--shadow-elevated:/);
  assert.match(technicalAnalysis, /\.gp-floating-menu-portal\s*\{[\s\S]*background-color:\s*var\(--gp-bg-popover\)/);
  assert.match(technicalAnalysis, /\.gp-floating-toolbar-shell\s*\{[\s\S]*background:\s*var\(--gp-bg-popover\)/);
  assert.match(technicalAnalysis, /\.gp-modal-content\s*\{[\s\S]*background-color:\s*var\(--gp-bg-modal\)/);
  assert.match(technicalAnalysis, /\.gp-products-menu-popover\s*\{[\s\S]*background:\s*var\(--gp-bg-popover\)/);
  assert.match(technicalAnalysis, /\.gp-pine-template-popover,[\s\S]*background:\s*var\(--gp-bg-popover\)/);
  assert.match(technicalAnalysis, /\.gp-currency-dropdown-portal\s*\{[\s\S]*background-color:\s*var\(--gp-bg-popover\)/);
  assert.match(technicalAnalysis, /\.gp-broker-modal\s*\{[\s\S]*background:\s*var\(--gp-bg-modal\)/);
  assert.match(technicalAnalysis, /\.pseudo-dropdown\s*\{[\s\S]*background-color:\s*var\(--gp-bg-popover\)/);
  assert.match(technicalAnalysis, /\.gp-cursor-dropdown-portal\s*\{[\s\S]*background-color:\s*var\(--surface-popover\)[\s\S]*border:\s*1px solid var\(--border-subtle\)[\s\S]*border-radius:\s*var\(--radius-sm\)/);
  assert.match(technicalAnalysis, /\.time-axis-controls\s*\{[\s\S]*background-color:\s*var\(--gp-bg-popover\)/);
  assert.match(technicalAnalysis, /\.gp-volume-study-legend__more\s*\{[\s\S]*background:\s*var\(--gp-bg-popover\)/);
  assert.match(technicalAnalysis, /\.gp-watchlist-settings-dropdown\s*\{[\s\S]*background:\s*var\(--surface-popover\)[\s\S]*border:\s*1px solid var\(--border-subtle\)[\s\S]*border-radius:\s*var\(--radius-sm\)[\s\S]*box-shadow:\s*var\(--shadow-elevated\)/);
});

test("specialized dropdowns use shared geometry and semantic interaction tokens", () => {
  assert.match(technicalAnalysis, /\.gp-timeframe-menu-item\s*\{[\s\S]*min-height:\s*var\(--gp-control-height-xs\)[\s\S]*var\(--gp-transition-fast\)/);
  assert.match(technicalAnalysis, /\.gp-chart-type-menu\s*\{[\s\S]*scrollbar-color:\s*var\(--gp-border-color\) transparent/);
  assert.match(technicalAnalysis, /\.gp-chart-type-menu-badge\s*\{[\s\S]*color:\s*var\(--gp-accent-blue\)/);
  assert.match(technicalAnalysis, /\.gp-price-axis-menu-item\s*\{[\s\S]*min-height:\s*var\(--gp-control-height-md\)/);
  assert.match(technicalAnalysis, /\.gp-price-axis-menu-icon\s*\{[^}]*color:\s*var\(--gp-accent-blue\)/);
  assert.match(technicalAnalysis, /\.gp-volume-study-legend__more\s*\{[\s\S]*min-height:\s*var\(--gp-control-height-xs\)/);
  assert.match(technicalAnalysis, /\.gp-watchlist-settings-dropdown\s*\{[\s\S]*\.dropdown-item\s*\{[\s\S]*gap:\s*var\(--space-xs\)[\s\S]*border-radius:\s*var\(--radius-xs\)[\s\S]*var\(--transition-fast\)[\s\S]*input\[type="checkbox"\][\s\S]*border:\s*1px solid var\(--border-subtle\)[\s\S]*background:\s*var\(--primary-color\)/);
  assert.doesNotMatch(technicalAnalysis.match(/\.gp-watchlist-settings-dropdown\s*\{[\s\S]*?\n\}/)?.[0] ?? "", /#1e222d|#2a2e39|#787b86|#d1d4dc|#2962ff|rgba\(0,\s*0,\s*0,\s*0\.5\)/i);
  assert.match(technicalAnalysis, /\/\/ TradingView-like clean-room chart context menu/);
  assert.match(technicalAnalysis, /\/\/ Dedicated TradingView-like price-scale context menu/);
});

test("permanent TA surfaces consume semantic tokens while preserving domain accents", () => {
  assert.match(technicalAnalysis, /\.gp-trade-btn\s*\{[\s\S]*background-color:\s*color-mix\(in srgb, var\(--gp-bg-toolbar\)/);
  assert.match(technicalAnalysis, /&\.sell\s*\{[\s\S]*border:\s*1px solid var\(--gp-accent-red\)/);
  assert.match(technicalAnalysis, /&\.buy\s*\{[\s\S]*border:\s*1px solid var\(--gp-accent-blue\)/);
  assert.match(technicalAnalysis, /\.gp-peer-chart[\s\S]*outline:\s*2px solid color-mix\(in srgb, var\(--gp-accent-gold\)/);
  assert.match(technicalAnalysis, /&__header\s*\{[\s\S]*background-color:\s*color-mix\(in srgb, var\(--gp-bg-toolbar\)/);
  assert.match(technicalAnalysis, /\.gp-market-status\s*\{[\s\S]*background:\s*color-mix\(in srgb, var\(--gp-accent-green\)/);
  assert.match(technicalAnalysis, /\.gp-notif-tab[\s\S]*&\.active\s*\{[\s\S]*background:\s*var\(--gp-bg-active\)/);
  assert.match(technicalAnalysis, /\.gp-chats-badge\s*\{[\s\S]*color:\s*var\(--gp-accent-gold\)/);
});

test("specialized modal primitives use the shared token contract", () => {
  assert.match(settingsField, /gp-settings-control/);
  assert.match(settingsField, /gp-settings-check-control/);
  assert.match(settingsField, /gp-settings-toggle/);
  assert.doesNotMatch(settingsField, /#2962ff|rgba\(255,255,255,0\.2\)|#1e222d/);
  assert.match(modalTabs, /gp-modal-tabs/);
  assert.match(modalTabs, /gp-tab-badge/);
  assert.doesNotMatch(modalTabs, /rgba\(255,255,255,0\.1\)/);
  assert.match(objectTreeStyles, /bg: "var\(--gp-bg-toolbar\)"/);
  assert.match(objectTreeStyles, /tabText: "var\(--gp-text-primary\)"/);
  assert.doesNotMatch(objectTreeStyles, /#d1d4dc|#787b86|rgba\(255, 255, 255, 0\.0[468]\)/);
});

test("Technical Analysis bootstrap compatibility follows the active global theme", () => {
  const scoped = globals.slice(globals.indexOf("// COMPATIBILITÉ BOOTSTRAP"));
  assert.match(scoped, /border:\s*1px solid var\(--border-color\)/);
  assert.match(scoped, /background-color:\s*var\(--surface-card\)/);
  assert.match(scoped, /color:\s*var\(--text-primary\)/);
  assert.doesNotMatch(scoped, /#ced4da|#fff|#212529/i);
});
