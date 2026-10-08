const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../../..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const technicalAnalysis = read("components/technical-analysis/TechnicalAnalysis.tsx");
const styles = read("styles/pages/_technical-analysis-final.scss");

test("sidebar toggle is structurally owned by a sibling boundary rail", () => {
  const chartIndex = technicalAnalysis.indexOf('<div className={"gp-chart-main-section"}>');
  const chartCloseIndex = technicalAnalysis.indexOf("\n            </div>\n\n            <div className=\"gp-sidebar-boundary-rail\">", chartIndex);
  const railIndex = technicalAnalysis.indexOf('<div className="gp-sidebar-boundary-rail">');
  const toggleIndex = technicalAnalysis.indexOf('id="gp-sidebar-toggle"');
  const shellIndex = technicalAnalysis.indexOf('<div className="gp-sidebar-shell">');
  const sidebarIndex = technicalAnalysis.indexOf("<ConnectedSidebar", shellIndex);
  assert.ok(chartIndex >= 0);
  assert.ok(chartCloseIndex > chartIndex);
  assert.ok(railIndex > chartCloseIndex);
  assert.ok(toggleIndex > railIndex);
  assert.ok(shellIndex > toggleIndex);
  assert.ok(sidebarIndex > shellIndex);
  assert.equal(technicalAnalysis.indexOf('id="gp-sidebar-toggle"', toggleIndex + 1), -1);
});

test("toggle is centered on a non-clipping layout rail with no pixel-offset positioning", () => {
  const mainLayoutBlock = styles.match(/\.gp-main-layout-container\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
  const railBlock = styles.match(/\.gp-sidebar-boundary-rail\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
  const toggleBlock = styles.match(/\.gp-sidebar-toggle-btn\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
  assert.match(mainLayoutBlock, /gap:\s*0\s*!important;/);
  assert.match(mainLayoutBlock, /overflow:\s*visible\s*!important;/);
  assert.match(railBlock, /position:\s*relative;/);
  assert.match(railBlock, /flex:\s*0 0 var\(--gp-layout-gap\);/);
  assert.match(railBlock, /width:\s*var\(--gp-layout-gap\);/);
  assert.match(railBlock, /min-width:\s*var\(--gp-layout-gap\);/);
  assert.match(railBlock, /overflow:\s*visible;/);
  assert.match(railBlock, /background:\s*transparent;/);
  assert.doesNotMatch(railBlock, /margin-inline:/);
  assert.match(styles, /--gp-sidebar-toggle-nudge-x:\s*-5px;/);
  assert.match(toggleBlock, /left:\s*var\(--gp-sidebar-toggle-nudge-x\);/);
  assert.match(toggleBlock, /transform:\s*translate\(-50%, -50%\);/);
  assert.doesNotMatch(toggleBlock, /left:\s*calc\(/);
});

test("rail preserves spacing in both states and draws no vertical divider", () => {
  assert.doesNotMatch(styles, /\.technical-analysis-root\.sidebar-closed\s*\{[\s\S]*?\.gp-sidebar-boundary-rail\s*\{/);
  const railBlock = styles.match(/\.gp-sidebar-boundary-rail\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
  assert.doesNotMatch(railBlock, /&::before/);
  assert.match(styles, /&\.flipped\s*\{[\s\S]*?transform:\s*translate\(-50%, -50%\);[\s\S]*?svg\s*\{\s*transform:\s*rotate\(180deg\);\s*\}/);
});

test("wide Pine Editor changes shell width without special-casing the toggle", () => {
  assert.match(styles, /\.gp-sidebar-shell:has\(\.gp-sidebar:not\(\.sidebar-closed\) \.gp-sidebar-content\[data-active-sidebar-entry="strategies"\]\)\s*\{[\s\S]*?--gp-sidebar-width:\s*470px;/);
  assert.doesNotMatch(styles, /\.gp-sidebar-shell:has\([^}]*data-active-sidebar-entry="strategies"[^}]*\)\s+\.gp-sidebar-toggle-btn\s*\{/);
});

test("responsive rules preserve the structural chart-end rail", () => {
  assert.match(styles, /@media \(max-width: 480px\)[\s\S]*?\.gp-main-layout-container\s*\{\s*gap:\s*0\s*!important;\s*\}/);
  assert.match(styles, /\.gp-sidebar-boundary-rail\s*\{[\s\S]*?position:\s*relative;[\s\S]*?flex:\s*0 0 var\(--gp-layout-gap\);/);
  assert.doesNotMatch(styles, /\.gp-sidebar-toggle-btn\s*\{[^}]*left:\s*auto;[^}]*right:\s*-14px;/);
});

test("sidebar toggle renders as an integrated vertical handle instead of a glowing circle", () => {
  const toggleBlock = styles.match(/\.gp-sidebar-toggle-btn\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
  const openBlock = styles.match(/\.technical-analysis-root:not\(\.sidebar-closed\) \.gp-sidebar-toggle-btn\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
  assert.match(styles, /--gp-sidebar-toggle-width:\s*1\.375rem;/);
  assert.match(styles, /--gp-sidebar-toggle-height:\s*2\.875rem;/);
  assert.match(toggleBlock, /width:\s*var\(--gp-sidebar-toggle-width\)/);
  assert.match(toggleBlock, /height:\s*var\(--gp-sidebar-toggle-height\)/);
  assert.match(toggleBlock, /background:\s*var\(--surface-popover\)/);
  assert.match(toggleBlock, /border-radius:\s*var\(--gp-radius-full\)/);
  assert.doesNotMatch(toggleBlock, /backdrop-filter:\s*blur/);
  assert.doesNotMatch(openBlock, /accent-gold|0 0 20px/);
  assert.match(technicalAnalysis, /<path d="M10\.5 7\.5 15 12l-4\.5 4\.5" \/>/);
});
