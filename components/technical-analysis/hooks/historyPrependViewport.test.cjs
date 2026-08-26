const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const sourcePath = path.resolve(__dirname, "viewport", "viewportMath.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

const loadedModule = { exports: {} };
new Function("module", "exports", "require", compiled)(loadedModule, loadedModule.exports, require);

const { reconcileViewportAfterHistoryPrepend } = loadedModule.exports;

test("history prepend translates both viewport edges by the inserted bar count", () => {
  const next = reconcileViewportAfterHistoryPrepend({
    startIdx: 120,
    endIdx: 240,
    prependedBars: 300,
    totalBars: 1000,
    maxHistoryGapBars: 160,
    maxFutureBars: 80,
  });

  assert.deepEqual(next, { startIdx: 420, endIdx: 540 });
  assert.equal(next.endIdx - next.startIdx, 120);
});

test("history prepend preserves unresolved negative history overscroll", () => {
  const next = reconcileViewportAfterHistoryPrepend({
    startIdx: -120,
    endIdx: 20,
    prependedBars: 100,
    totalBars: 600,
    maxHistoryGapBars: 160,
    maxFutureBars: 80,
  });

  assert.deepEqual(next, { startIdx: -20, endIdx: 120 });
  assert.equal(next.endIdx - next.startIdx, 140);
});

test("history prepend preserves intentional future whitespace relative to the new last bar", () => {
  const previousTotalBars = 500;
  const prependedBars = 100;
  const futureBars = 20;
  const next = reconcileViewportAfterHistoryPrepend({
    startIdx: 430,
    endIdx: previousTotalBars - 1 + futureBars,
    prependedBars,
    totalBars: previousTotalBars + prependedBars,
    maxHistoryGapBars: 80,
    maxFutureBars: 80,
  });

  assert.equal(next.startIdx, 530);
  assert.equal(next.endIdx, 619);
  assert.equal(next.endIdx - ((previousTotalBars + prependedBars) - 1), futureBars);
});

test("representative prepend states preserve logical span when no boundary is hit", () => {
  const scenarios = [
    { startIdx: -40, endIdx: 80, prepend: 100, oldTotal: 500, historyGap: 120 },
    { startIdx: 0, endIdx: 120, prepend: 300, oldTotal: 700, historyGap: 80 },
    { startIdx: 260, endIdx: 420, prepend: 100, oldTotal: 500, historyGap: 80 },
    { startIdx: 400, endIdx: 519, prepend: 200, oldTotal: 500, historyGap: 80 },
  ];

  for (const scenario of scenarios) {
    const next = reconcileViewportAfterHistoryPrepend({
      startIdx: scenario.startIdx,
      endIdx: scenario.endIdx,
      prependedBars: scenario.prepend,
      totalBars: scenario.oldTotal + scenario.prepend,
      maxHistoryGapBars: scenario.historyGap,
      maxFutureBars: 80,
    });

    assert.equal(next.startIdx, scenario.startIdx + scenario.prepend);
    assert.equal(next.endIdx, scenario.endIdx + scenario.prepend);
    assert.equal(next.endIdx - next.startIdx, scenario.endIdx - scenario.startIdx);
  }
});
