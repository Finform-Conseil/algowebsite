/* eslint-env node */
require("../../store/__tests__/testTypeScriptLoader.cjs");

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createTimeViewportSyncSnapshot,
  getLatestTimeViewportSyncSnapshot,
  isTimeViewportSnapshotForData,
  publishTimeViewportSync,
  shouldSynchronizeTimeViewport,
  subscribeTimeViewportSync,
} = require("./timeViewportSyncBus.ts");

const data = [
  { time: "2026-01-02", open: 1, high: 1, low: 1, close: 1, volume: 1 },
  { time: "2026-01-05", open: 2, high: 2, low: 2, close: 2, volume: 2 },
  { time: "2026-01-06", open: 3, high: 3, low: 3, close: 3, volume: 3 },
];

test("canonical viewport snapshot clamps synthetic history/future gaps to real candle times", () => {
  const snapshot = createTimeViewportSyncSnapshot(data, -120, 999);
  assert.ok(snapshot);
  assert.equal(snapshot.startDataIndex, 0);
  assert.equal(snapshot.endDataIndex, 2);
  assert.equal(snapshot.startTime, "2026-01-02");
  assert.equal(snapshot.endTime, "2026-01-06");
  assert.equal(snapshot.centerTime, "2026-01-05");
  assert.equal(snapshot.dataFirstTime, "2026-01-02");
  assert.equal(snapshot.dataLastTime, "2026-01-06");
});

test("date-range synchronization never implicitly enables continuous time synchronization", () => {
  assert.equal(shouldSynchronizeTimeViewport({ time: false, dateRange: true }), false);
  assert.equal(shouldSynchronizeTimeViewport({ time: true, dateRange: false }), true);
});

test("snapshot compatibility rejects stale viewport state from a previous active dataset", () => {
  const snapshot = createTimeViewportSyncSnapshot(data, 0, 1);
  assert.ok(snapshot);
  assert.equal(isTimeViewportSnapshotForData(snapshot, data), true);
  assert.equal(isTimeViewportSnapshotForData(snapshot, data.slice(1)), false);
});

test("viewport bus is chart-scoped, deduplicated and unsubscribable", () => {
  const chartA = {};
  const chartB = {};
  const snapshotA = createTimeViewportSyncSnapshot(data, 0, 1);
  const snapshotB = createTimeViewportSyncSnapshot(data, 1, 2);
  assert.ok(snapshotA);
  assert.ok(snapshotB);

  const received = [];
  const unsubscribe = subscribeTimeViewportSync(chartA, (snapshot) => received.push(snapshot));

  assert.equal(publishTimeViewportSync(chartA, snapshotA), true);
  assert.equal(publishTimeViewportSync(chartA, snapshotA), false);
  assert.equal(publishTimeViewportSync(chartB, snapshotB), true);
  assert.equal(received.length, 1);
  assert.deepEqual(received[0], snapshotA);
  assert.deepEqual(getLatestTimeViewportSyncSnapshot(chartA), snapshotA);

  unsubscribe();
  assert.equal(publishTimeViewportSync(chartA, snapshotB), true);
  assert.equal(received.length, 1);
});
