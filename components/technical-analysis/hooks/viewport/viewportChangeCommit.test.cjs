/* eslint-env node */
const assert = require("node:assert/strict");
const test = require("node:test");

require("../../store/__tests__/testTypeScriptLoader.cjs");

const {
  ViewportChangeCommitBuffer,
  areViewportChangesEqual,
} = require("./viewportChangeCommit.ts");

const viewport = (startTime, endTime, yScale = 1, isYManual = false) => ({
  startTime,
  endTime,
  yScale,
  isYManual,
});

const createFakeTimer = () => {
  let nextId = 1;
  const pending = new Map();
  return {
    timer: {
      set(callback) {
        const id = nextId++;
        pending.set(id, callback);
        return id;
      },
      clear(id) {
        pending.delete(id);
      },
    },
    size: () => pending.size,
    runAll() {
      const callbacks = [...pending.values()];
      pending.clear();
      callbacks.forEach((callback) => callback());
    },
  };
};

test("viewport commit buffer coalesces an interaction burst into the latest durable snapshot", () => {
  const fake = createFakeTimer();
  const commits = [];
  const buffer = new ViewportChangeCommitBuffer((value) => commits.push(value), 140, fake.timer);

  buffer.schedule(viewport("2026-01-01", "2026-02-01"));
  buffer.schedule(viewport("2026-01-02", "2026-02-02"));
  buffer.schedule(viewport("2026-01-03", "2026-02-03"));

  assert.equal(commits.length, 0);
  assert.equal(fake.size(), 1);
  fake.runAll();
  assert.deepEqual(commits, [viewport("2026-01-03", "2026-02-03")]);
});

test("viewport commit buffer can flush immediately at a gesture boundary", () => {
  const fake = createFakeTimer();
  const commits = [];
  const buffer = new ViewportChangeCommitBuffer((value) => commits.push(value), 140, fake.timer);
  const next = viewport("2026-03-01", "2026-04-01", 1.2, true);

  buffer.schedule(next);
  buffer.flush();

  assert.deepEqual(commits, [next]);
  assert.equal(fake.size(), 0);
});

test("viewport commit buffer suppresses duplicate durable snapshots", () => {
  const fake = createFakeTimer();
  const commits = [];
  const buffer = new ViewportChangeCommitBuffer((value) => commits.push(value), 140, fake.timer);
  const same = viewport("2026-05-01", "2026-06-01");

  buffer.schedule(same);
  fake.runAll();
  buffer.schedule({ ...same });

  assert.equal(fake.size(), 0);
  assert.equal(commits.length, 1);
  assert.equal(areViewportChangesEqual(commits[0], same), true);
});

test("reset drops stale pending state when a chart interaction scope changes", () => {
  const fake = createFakeTimer();
  const commits = [];
  const buffer = new ViewportChangeCommitBuffer((value) => commits.push(value), 140, fake.timer);

  buffer.schedule(viewport("2026-07-01", "2026-08-01"));
  buffer.reset();
  fake.runAll();

  assert.deepEqual(commits, []);
  assert.equal(fake.size(), 0);
});
