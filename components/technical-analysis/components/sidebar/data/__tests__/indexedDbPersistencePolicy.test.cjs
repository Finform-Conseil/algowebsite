const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "../../../../../..");
const sidebarSource = fs.readFileSync(
  path.join(projectRoot, "components/technical-analysis/components/sidebar/data/sidebarPersistence.ts"),
  "utf8",
);
const tickerSource = fs.readFileSync(
  path.join(projectRoot, "components/design-system/commons/TickerSelectorModal/context/tickerSelectorPersistence.ts"),
  "utf8",
);

test("IndexedDB persistence relies on terminal browser events instead of wall-clock races", () => {
  for (const source of [sidebarSource, tickerSource]) {
    assert.doesNotMatch(source, /Promise\.race|operation timed out|persistence timed out/);
    assert.match(source, /request\.onblocked/);
    assert.match(source, /request\.result\.onversionchange/);
    assert.match(source, /transaction\.oncomplete/);
    assert.match(source, /transaction\.onabort/);
  }
});

test("sidebar writes are serialized and recover after a rejected operation", () => {
  assert.match(sidebarSource, /let sidebarWriteQueue: Promise<void> = Promise\.resolve\(\)/);
  assert.match(sidebarSource, /sidebarWriteQueue\.then\(\(\) => persistSidebarSnapshot/);
  assert.match(sidebarSource, /sidebarWriteQueue = operation\.catch\(\(\) => undefined\)/);
});
