const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = process.cwd();
const modal = fs.readFileSync(path.join(root, "components/technical-analysis/components/modals/publish/PublishOptionsModal.tsx"), "utf8");
const toolbarClasses = fs.readFileSync(path.join(root, "components/technical-analysis/components/toolbar/chart/toolbarClassNames.ts"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles/pages/_technical-analysis-final.scss"), "utf8");

test("Share topbar action stays restrained while using the fly-hover interaction", () => {
  const publishBlock = toolbarClasses.match(/export const publishButtonClassNames = \[[\s\S]*?\] as const;/)?.[0] ?? "";
  assert.doesNotMatch(publishBlock, /rounded-pill/);
  assert.doesNotMatch(publishBlock, /hover-lift/);
  assert.match(publishBlock, /btn-publish/);
  assert.match(styles, /\.technical-analysis-root \.btn\.btn-publish\s*\{[\s\S]*overflow:\s*hidden[\s\S]*border:\s*0[\s\S]*border-radius:\s*999px[\s\S]*background:\s*#4169e1[\s\S]*color:\s*#fff[\s\S]*box-shadow:\s*none/);
  assert.match(styles, /\.gp-share-button__icon-wrap[\s\S]*animation:\s*gp-share-fly 600ms ease-in-out infinite alternate/);
  assert.match(styles, /\.gp-share-button__icon\s*\{[\s\S]*transform:\s*translateX\(31px\) rotate\(45deg\) scale\(1\.08\)/);
  assert.match(styles, /\.gp-share-button__label\s*\{[\s\S]*transform:\s*translateY\(-1px\)[\s\S]*transform:\s*translate\(64px, -1px\)/);
  assert.match(styles, /@keyframes gp-share-fly/);
});

test("Share modal is compact, tokenized and free of large social cards", () => {
  assert.match(modal, /maxWidth="520px"/);
  assert.match(modal, /className="gp-share-modal"/);
  assert.match(modal, /hideFooter/);
  assert.match(modal, /className="gp-share-channels"/);
  assert.match(modal, /gp-share-channel gp-share-channel--/);
  assert.doesNotMatch(modal, /minHeight:\s*"96px"/);
  assert.doesNotMatch(modal, /backgroundColor:\s*channel\.background/);
  assert.doesNotMatch(modal, /channel\.accent/);
  assert.doesNotMatch(modal, /rounded-3 px-3 py-3/);
  assert.match(styles, /\.gp-share-channel\s*\{[\s\S]*min-height:\s*44px/);
  assert.match(styles, /\.gp-share-action\s*\{[\s\S]*min-height:\s*32px/);
});
