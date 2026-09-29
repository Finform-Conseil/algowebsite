const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../../..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const technicalAnalysis = read("components/technical-analysis/TechnicalAnalysis.tsx");
const content = read("components/technical-analysis/components/sidebar/TechnicalAnalysisSidebarContent.tsx");
const rail = read("components/technical-analysis/components/sidebar/SidebarRail.tsx");
const styles = read("styles/pages/_technical-analysis-final.scss");

test("Pine rail retoggles the already-active Pine panel into a real sidebar collapse", () => {
  assert.match(content, /entryId === "strategies" && activeEntry === "strategies"/);
  assert.match(content, /props\.onRequestSidebarCollapse\?\.\(\)/);
  assert.match(technicalAnalysis, /onRequestSidebarCollapse=\{\(\) => setSidebarCollapsed\(true\)\}/);
});

test("all collapse entry points use the same synchronized root/sidebar transition", () => {
  assert.match(technicalAnalysis, /const setSidebarCollapsed = useCallback\(\(collapsed: boolean\)/);
  assert.match(technicalAnalysis, /root\.classList\.toggle\("sidebar-closed", collapsed\)/);
  assert.match(technicalAnalysis, /sidebar\.classList\.toggle\("sidebar-closed", collapsed\)/);
  assert.match(technicalAnalysis, /const toggleSidebarCollapsed = useCallback/);
  assert.match(technicalAnalysis, /const handleToggleClick = \(\) => \{\s*toggleSidebarCollapsed\(\);\s*\}/);
  assert.match(technicalAnalysis, /setSidebarCollapsed\(true\);/);
});

test("Pine width override only applies while the sidebar is open", () => {
  assert.match(styles, /\.gp-sidebar-shell:has\(\.gp-sidebar:not\(\.sidebar-closed\) \.gp-sidebar-content\[data-active-sidebar-entry="strategies"\]\)/);
  assert.match(styles, /\.gp-sidebar-shell:has\(\.gp-sidebar\.sidebar-closed\)\s*\{[\s\S]*?flex-basis:\s*0;[\s\S]*?width:\s*0;/);
});

test("rail buttons have one activation path only", () => {
  assert.doesNotMatch(rail, /onPointerDown=/);
  assert.doesNotMatch(rail, /onKeyDown=/);
  assert.match(rail, /onClick=\{selectEntry\}/);
});
