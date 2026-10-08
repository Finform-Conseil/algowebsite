const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const styles = fs.readFileSync(
  path.join(process.cwd(), "styles/pages/_technical-analysis-final.scss"),
  "utf8",
);

test("Object Tree tabs share the Alerts segmented-control shell", () => {
  assert.match(
    styles,
    /\.gp-alerts-tabs,[\s\S]*?\.gp-object-tree-tablist\s*\{[\s\S]*?padding:\s*var\(--gp-space-2xs\)[\s\S]*?border-radius:\s*var\(--gp-radius-sm\)[\s\S]*?box-shadow:\s*inset/,
  );
});

test("Object Tree active and inactive tabs share Alerts tab geometry and state treatment", () => {
  assert.match(
    styles,
    /\.gp-alerts-tabs button,[\s\S]*?\.gp-object-tree-tab\s*\{[\s\S]*?min-height:\s*32px[\s\S]*?padding:\s*6px 12px[\s\S]*?border-radius:\s*var\(--gp-radius-xs\)/,
  );
  assert.match(
    styles,
    /\.gp-alerts-tabs button\.active,[\s\S]*?\.gp-object-tree-tab\.is-active\s*\{[\s\S]*?background:\s*var\(--gp-bg-toolbar\)[\s\S]*?box-shadow:\s*0 2px 4px/,
  );
});
