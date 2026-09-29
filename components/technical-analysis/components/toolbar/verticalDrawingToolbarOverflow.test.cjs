const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../../..");
const styles = fs.readFileSync(path.join(root, "styles/pages/_technical-analysis-final.scss"), "utf8");
const footer = fs.readFileSync(
  path.join(root, "components/technical-analysis/components/toolbar/drawing/DrawingToolbarFooter.tsx"),
  "utf8",
);

test("drawing toolbar primary tools always clip into a scroll viewport", () => {
  assert.match(styles, /\.gp-toolbar-scroll-container\s*\{[\s\S]*?overflow-x:\s*hidden;[\s\S]*?overflow-y:\s*auto;[\s\S]*?overscroll-behavior-y:\s*contain;/);
  assert.doesNotMatch(styles, /\.gp-toolbar-scroll-container\s*\{[\s\S]*?overflow-y:\s*visible;/);
});

test("drawing toolbar buttons keep invariant hitbox dimensions under vertical pressure", () => {
  assert.match(styles, /\.gp-vertical-toolbar \.gp-toolbar-btn\s*\{[\s\S]*?flex:\s*0 0 var\(--gp-toolbar-btn-size\);/);
  assert.match(styles, /min-height:\s*var\(--gp-toolbar-btn-size\);/);
  assert.match(styles, /max-height:\s*var\(--gp-toolbar-btn-size\);/);
});

test("toolbar scrolling is structural and no longer depends on a fragile viewport breakpoint", () => {
  assert.doesNotMatch(styles, /@media \(max-height:\s*760px\)[\s\S]*?gp-toolbar-scroll-container/);
});

test("zoom-out auto-reveals itself inside the scroll viewport instead of bleeding into the footer", () => {
  assert.match(footer, /const zoomOutRef = useRef<HTMLButtonElement>\(null\)/);
  assert.match(footer, /button\.closest<HTMLElement>\("\.gp-toolbar-scroll-container"\)/);
  assert.match(footer, /scroller\.scrollTop \+= bottomOverflow \+ 2/);
  assert.match(footer, /ref=\{zoomOutRef\}/);
});
