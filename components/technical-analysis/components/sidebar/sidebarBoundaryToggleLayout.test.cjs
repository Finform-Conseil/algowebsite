const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../../..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const technicalAnalysis = read("components/technical-analysis/TechnicalAnalysis.tsx");
const styles = read("styles/pages/_technical-analysis-final.scss");

test("sidebar toggle is structurally owned by the sidebar shell", () => {
  const shellIndex = technicalAnalysis.indexOf('<div className="gp-sidebar-shell">');
  const toggleIndex = technicalAnalysis.indexOf('id="gp-sidebar-toggle"');
  const sidebarIndex = technicalAnalysis.indexOf("<ConnectedSidebar", shellIndex);
  assert.ok(shellIndex >= 0);
  assert.ok(toggleIndex > shellIndex);
  assert.ok(sidebarIndex > toggleIndex);
  assert.equal(technicalAnalysis.indexOf('id="gp-sidebar-toggle"', toggleIndex + 1), -1);
});

test("toggle follows the real shell boundary instead of a duplicated sidebar width", () => {
  assert.match(styles, /\.gp-sidebar-shell\s*\{[\s\S]*?overflow:\s*visible;/);
  assert.match(styles, /\.gp-sidebar-toggle-btn\s*\{[\s\S]*?left:\s*calc\(-1 \* var\(--gp-layout-gap\)\);[\s\S]*?right:\s*auto;/);
  assert.doesNotMatch(styles, /\.technical-analysis-root:not\(\.sidebar-closed\) \.gp-sidebar-toggle-btn\s*\{[\s\S]*?right:\s*calc\(var\(--gp-sidebar-width\)/);
});

test("wide Pine Editor changes shell width without special-casing the toggle", () => {
  assert.match(styles, /\.gp-sidebar-shell:has\(\.gp-sidebar-content\[data-active-sidebar-entry="strategies"\]\)\s*\{[\s\S]*?--gp-sidebar-width:\s*470px;/);
  assert.doesNotMatch(styles, /data-active-sidebar-entry="strategies"[\s\S]{0,500}\.gp-sidebar-toggle-btn/);
});

test("responsive rules preserve the structural boundary anchor", () => {
  assert.doesNotMatch(styles, /@media \(max-width: 820px\)[\s\S]{0,220}\.gp-sidebar-toggle-btn\s*\{[^}]*right:/);
  assert.doesNotMatch(styles, /\.gp-sidebar-toggle-btn\s*\{[^}]*left:\s*auto;[^}]*right:\s*-14px;/);
});
