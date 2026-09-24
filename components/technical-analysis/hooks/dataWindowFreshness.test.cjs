const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../..");
const source = fs.readFileSync(path.join(root, "components/technical-analysis/hooks/useObjectTreePanel.ts"), "utf8");

test("historical hovered candles are never classified stale from their own age", () => {
  assert.match(source, /isLatestCandle: boolean/);
  assert.match(source, /hasLiveSnapshot: boolean/);
  assert.match(source, /if \(isLatestCandle && !hasLiveSnapshot && candle\.time\)/);
});

test("stale detection receives source freshness context from the latest candle state", () => {
  assert.match(source, /isLastCandle,\s*hasLiveSnapshotRef\.current/);
});

test("legacy per-hover stale rule is gone", () => {
  assert.doesNotMatch(source, /if \(candle\.time\) \{\s*const candleMs[\s\S]{0,180}flags\.push\("STALE_DATA"\)/);
});
