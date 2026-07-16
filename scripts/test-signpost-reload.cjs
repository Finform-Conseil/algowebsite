// @ts-nocheck
/* eslint-disable */
/**
 * GATE3 Signpost — RELOAD verification (P0 RELOAD mission).
 *   node --test scripts/test-signpost-reload.cjs
 *
 * Covers:
 *   #6  IndexedDB save -> reload -> données rechargées (barTime preserved)
 *   #7  dataset length / position change on reload still resolves candle by time
 *   #8  reload geometry: stem valid + label/handle/stem hit-testable, degenerate
 *       stem keeps label selectable
 */
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const vm = require("vm");
const test = require("node:test");
const assert = require("assert");

const ROOT = path.resolve(__dirname, "..", "components", "technical-analysis");

const stubs = {
  viewportGraphics: {
    getSafeGridRect: (_chart, container) =>
      container ? { x: 0, y: 0, width: 1000, height: 600 } : { x: 0, y: 30, width: 800, height: 600 },
  },
  viewportMath: {
    clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
  },
};

// --- Minimal in-memory IndexedDB shim (only what drawingPersistence uses) ---
function makeFakeIDB() {
  const databases = new Map();
  function open(name) {
    const req = {};
    Promise.resolve().then(() => {
      let db = databases.get(name);
      if (!db) {
        db = { stores: new Map() };
        databases.set(name, db);
      }
      const ensureStore = () => {
        if (!db.stores.has("ta_store")) db.stores.set("ta_store", new Map());
        return db.stores.get("ta_store");
      };
      if (req.onupgradeneeded) {
        const fakeDb = {
          objectStoreNames: { contains: (n) => db.stores.has(n) },
          createObjectStore: (n) => {
            const s = new Map();
            db.stores.set(n, s);
            return s;
          },
        };
        req.onupgradeneeded({ target: { result: fakeDb } });
      }
      ensureStore();
      req.result = {
        objectStoreNames: { contains: (n) => db.stores.has(n) },
        createObjectStore: (n) => {
          const s = new Map();
          db.stores.set(n, s);
          return s;
        },
        transaction: (storeName) => ({
          objectStore: (sn) => {
            let store = db.stores.get(sn);
            if (!store) {
              store = new Map();
              db.stores.set(sn, store);
            }
            return {
              get: (key) => {
                const r = {};
                Promise.resolve().then(() => {
                  r.result = store.has(key) ? store.get(key) : null;
                  if (r.onsuccess) r.onsuccess();
                });
                return r;
              },
              put: (value, key) => {
                const r = {};
                Promise.resolve().then(() => {
                  store.set(key, value);
                  if (r.onsuccess) r.onsuccess();
                });
                return r;
              },
            };
          },
        }),
      };
      if (req.onsuccess) req.onsuccess();
    });
    return req;
  }
  return { open };
}

globalThis.window = { indexedDB: makeFakeIDB() };
globalThis.indexedDB = globalThis.window.indexedDB;

// Fake canvas 2D context + document so the strategy's render/hitTest run in node.
function makeCtx() {
  const noop = () => {};
  return new Proxy(
    {},
    {
      get: (_t, prop) => (prop === "measureText" ? () => ({ width: 60 }) : noop),
      set: () => true,
    },
  );
}
globalThis.document = { createElement: () => ({ getContext: () => makeCtx() }) };

function loadTs(relPath, stubMap) {
  const full = path.join(ROOT, relPath);
  const code = fs.readFileSync(full, "utf8");
  const out = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
      esModuleInterop: true,
    },
  }).outputText;

  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    window: globalThis.window,
    indexedDB: globalThis.indexedDB,
    document: globalThis.document,
    require: (p) => {
      if (p.includes("viewportGraphics")) return stubMap.viewportGraphics;
      if (p.includes("viewportMath")) return stubMap.viewportMath;
      if (p.startsWith(".")) {
        let resolved = path.resolve(path.dirname(full), p);
        if (!fs.existsSync(resolved)) {
          const withExt = resolved + ".ts";
          if (fs.existsSync(withExt)) resolved = withExt;
        }
        return loadTs(path.relative(ROOT, resolved), stubMap);
      }
      throw new Error("Cannot require in test sandbox: " + p);
    },
  };
  sandbox.module.exports = sandbox.exports;
  vm.createContext(sandbox);
  vm.runInContext(out, sandbox, { filename: full });
  return sandbox.module.exports;
}

const norm = loadTs("hooks/drawing/signpostNormalization.ts", stubs);
const proj = loadTs("hooks/drawing/drawingSignpostProjection.ts", stubs);
const persist = loadTs("hooks/drawing/drawingPersistence.ts", stubs);
const strat = loadTs("lib/strategies/implementations/SignpostStrategy.ts", stubs);

const PERSIST_KEY = "algoway_drawings";

const sampleDrawing = () => ({
  id: "sp-1",
  type: "signpost",
  points: [{ time: "2024-01-05", value: 100 }],
  signpostProps: {
    barIndex: 4,
    barTime: "2024-01-05",
    verticalPositionPct: 0.5,
    hasEmojiPin: false,
    emoji: "📌",
    lines: [""],
    fontSize: 12,
    locked: false,
    color: "#2962ff",
    fill: "#2962ff",
    showSettings: false,
  },
});

const measure = (font, t) => t.length * 7;
const font = "12px Inter, sans-serif";

const buildLayout = (overrides = {}) =>
  proj.computeSignpostLayout({
    anchorX: 500,
    labelY: 300,
    candleEndpointY: 420,
    lines: [""],
    displayPlaceholder: true,
    fontSize: 12,
    lineHeight: 18,
    emojiPin: null,
    selected: false,
    pricePaneRect: { x: 0, y: 0, width: 1000, height: 600, right: 1000, bottom: 600 },
    timeLabel: "2024-01-05",
    measureText: measure,
    font,
    ...overrides,
  });

test("reload #6: normalize round-trip preserves barTime + valid barIndex", () => {
  const saved = JSON.parse(JSON.stringify([sampleDrawing()]));
  const restored = saved.map((d) =>
    norm.normalizeSignpost(d, { resolveBarIndex: (t) => Number(t) }),
  );
  const sp = restored[0].signpostProps;
  assert.strictEqual(sp.barTime, "2024-01-05", "barTime must survive reload");
  assert.strictEqual(sp.barIndex, 4, "barIndex must NOT be overwritten by Number(time)");
  assert.strictEqual(sp.verticalPositionPct, 0.5, "verticalPositionPct preserved");
});

test("reload #6: IndexedDB save -> idbGet -> normalize keeps Signpost + data", async () => {
  const drawing = sampleDrawing();
  await persist.idbSet(PERSIST_KEY, [drawing]);
  const got = await persist.idbGet(PERSIST_KEY);
  assert.ok(Array.isArray(got) && got.length === 1, "IndexedDB returned the saved drawing");
  const restored = got.map((d) =>
    norm.normalizeSignpost(d, { resolveBarIndex: (t) => Number(t) }),
  );
  assert.strictEqual(restored[0].type, "signpost");
  assert.strictEqual(restored[0].signpostProps.barTime, "2024-01-05");
  assert.strictEqual(restored[0].signpostProps.barIndex, 4);
});

test("reload #7: candle resolved by time despite dataset length change", () => {
  const chart = {
    convertToPixel: (_opt, [time, value]) => [100 + Number(time), 500 - Number(value)],
  };
  const candle = { time: "2024-01-05", high: 120, low: 80 };
  const fullData = [
    { time: "2024-01-01", high: 110, low: 90 },
    { time: "2024-01-02", high: 112, low: 88 },
    { time: "2024-01-03", high: 115, low: 85 },
    { time: "2024-01-04", high: 118, low: 82 },
    candle,
    { time: "2024-01-06", high: 121, low: 79 },
  ];

  const labelY = 300;
  const yEndFull = strat.resolveCandleEndpointY(chart, fullData, "2024-01-05", labelY);
  assert.ok(Number.isFinite(yEndFull) && yEndFull !== labelY, "valid stem endpoint in full data");
  // high=120 -> y=500-120=380 ; labelY=300 so endpoint is the higher price (yHigh)
  assert.strictEqual(yEndFull, 380, "endpoint is candle high when above label");

  // Dataset shortened: earlier bars dropped, but candle found by time.
  const shortData = fullData.slice(4); // starts at 2024-01-05
  const yEndShort = strat.resolveCandleEndpointY(chart, shortData, "2024-01-05", labelY);
  assert.strictEqual(yEndShort, 380, "resolves by time even when barIndex is out of range");
});

test("reload #5: missing candle -> labelY (no degenerate stem)", () => {
  const chart = {
    convertToPixel: (_opt, [time, value]) => [100 + Number(time), 500 - Number(value)],
  };
  const labelY = 300;
  const yEnd = strat.resolveCandleEndpointY(chart, [{ time: "2099-01-01", high: 1, low: 0 }], "2024-01-05", labelY);
  assert.strictEqual(yEnd, labelY, "endpoint equals labelY when candle unavailable");
});

test("reload #8: hitTestLayout hits label / handle / stem", () => {
  const layout = buildLayout();
  const { labelRect, handleRect, stem } = layout;

  // Label click
  const onLabel = strat.hitTestLayout(
    layout,
    labelRect.x + (labelRect.right - labelRect.x) / 2,
    labelRect.y + (labelRect.bottom - labelRect.y) / 2,
  );
  assert.strictEqual(onLabel.isHit, true);
  assert.strictEqual(onLabel.part, "label");

  // Handle click
  const onHandle = strat.hitTestLayout(
    layout,
    handleRect.x + handleRect.width / 2,
    handleRect.y + handleRect.height / 2,
  );
  assert.strictEqual(onHandle.isHit, true);
  assert.strictEqual(onHandle.part, "vertical-handle");

  // Stem click
  const onStem = strat.hitTestLayout(layout, stem.x, (stem.y1 + stem.y2) / 2);
  assert.strictEqual(onStem.isHit, true);
  assert.strictEqual(onStem.part, "stem");

  // Far away miss
  const miss = strat.hitTestLayout(layout, 5, 5);
  assert.strictEqual(miss.isHit, false);
});

test("reload #4: degenerate stem (candleEndpointY==labelY) keeps label selectable", () => {
  const layout = buildLayout({ candleEndpointY: 300 }); // equals labelY -> no stem
  const { labelRect, stem } = layout;
  assert.strictEqual(layout.stemDrawn, false, "stem not drawn when candle unavailable");
  assert.strictEqual(stem.y1, stem.y2, "degenerate stem is flat");

  const onLabel = strat.hitTestLayout(
    layout,
    labelRect.x + (labelRect.right - labelRect.x) / 2,
    labelRect.y + (labelRect.bottom - labelRect.y) / 2,
  );
  assert.strictEqual(onLabel.isHit, true, "label still selectable when stem degenerate");
  assert.strictEqual(onLabel.part, "label");

  // Clicking far below on the stem x must NOT register a false stem hit
  const miss = strat.hitTestLayout(layout, stem.x, 550);
  assert.strictEqual(miss.isHit, false, "no false stem hit when stem degenerate");
});

test("reload R1: barTime falls back to points[0].time when signpostProps.barTime absent", () => {
  const chart = {
    convertToPixel: (_o, [time, value]) => [500, 500 - Number(value)],
    getOption: () => ({ series: [{ data: [{ time: "2024-01-05", high: 120, low: 80 }] }] }),
    getDom: () => null,
  };
  const drawing = {
    id: "sp-r1",
    type: "signpost",
    points: [{ time: "2024-01-05", value: 100 }],
    // NOTE: intentionally no signpostProps.barTime -> must fall back to points[0].time
    signpostProps: {
      verticalPositionPct: 0.5,
      hasEmojiPin: false,
      emoji: "📌",
      lines: [""],
      fontSize: 12,
      locked: false,
      color: "#2962ff",
      fill: "#2962ff",
      showSettings: false,
    },
    text: "",
    showText: false,
    fontSize: 12,
  };
  const built = strat.buildLayout({
    pts: [{ x: 500, y: 400 }],
    chart,
    chartData: [{ time: "2024-01-05", high: 120, low: 80 }],
    drawing,
    isSelected: false,
    measure: (f, t) => t.length * 7,
    ctx: makeCtx(),
  });
  assert.ok(built, "layout built");
  assert.strictEqual(
    built.layout.stemDrawn,
    true,
    "candle resolved via points[0].time when signpostProps.barTime absent",
  );
});

test("reload R2: numeric vs string time match (sameTime normalization)", () => {
  const chart = {
    convertToPixel: (_o, [time, value]) => [100 + Number(time), 500 - Number(value)],
  };
  const labelY = 300;
  // candle time stored as NUMBER, barTime passed as STRING
  const dataNum = [{ time: 1704432000000, high: 120, low: 80 }];
  const yStr = strat.resolveCandleEndpointY(chart, dataNum, "1704432000000", labelY);
  assert.strictEqual(yStr, 380, "string barTime matches numeric candle time");
  // reverse direction
  const dataStr = [{ time: "1704432000000", high: 120, low: 80 }];
  const yNum = strat.resolveCandleEndpointY(chart, dataStr, 1704432000000, labelY);
  assert.strictEqual(yNum, 380, "numeric barTime matches string candle time");
});

test("reload R3: per-chart cache isolation (no cross-chart contamination)", () => {
  const makeChart = (candleTime, candleHigh) => ({
    convertToPixel: (_o, [time, value]) => [500, 500 - Number(value)],
    getOption: () => ({
      series: [{ data: [{ time: candleTime, high: candleHigh, low: candleHigh - 40 }] }],
    }),
    getDom: () => null,
  });
  // chartA has a real candle -> stem drawn.
  const chartA = makeChart("2024-01-05", 120);
  const chartDataA = [{ time: "2024-01-05", high: 120, low: 80 }];
  // chartB has NO matching candle -> stem NOT drawn.
  const chartB = makeChart("2099-01-01", 1);
  const chartDataB = [];

  const drawing = {
    id: "sp-r3",
    type: "signpost",
    points: [{ time: "2024-01-05", value: 100 }],
    signpostProps: {
      barTime: "2024-01-05",
      verticalPositionPct: 0.5,
      hasEmojiPin: false,
      emoji: "📌",
      lines: [""],
      fontSize: 12,
      locked: false,
      color: "#2962ff",
      fill: "#2962ff",
      showSettings: false,
    },
    text: "",
    showText: false,
    fontSize: 12,
    style: {},
  };
  const helpers = {
    drawSegment: () => {},
    drawHandle: () => {},
    drawTextOnLine: () => {},
    applyStyle: () => {},
    applyLineDash: () => {},
    ctx: makeCtx(),
    logicalWidth: 800,
    logicalHeight: 600,
  };

  const strategy = new strat.SignpostStrategy();
  const px = { x: 500, y: 400 };

  // Probe chartA geometry via buildLayout to locate the stem midpoint.
  const builtA = strat.buildLayout({
    pts: [px],
    chart: chartA,
    chartData: chartDataA,
    drawing,
    isSelected: false,
    measure: (f, t) => t.length * 7,
    ctx: makeCtx(),
  });
  assert.strictEqual(builtA.layout.stemDrawn, true, "chartA candle resolved");
  const sx = builtA.layout.stem.x;
  const syMid = (builtA.layout.stem.y1 + builtA.layout.stem.y2) / 2;

  // Render on BOTH charts (order matters: B must not overwrite A's cache).
  strategy.render([px], drawing.points, drawing, chartA, false, helpers, chartDataA);
  strategy.render([px], drawing.points, drawing, chartB, false, helpers, chartDataB);

  // Simulate "time anchor momentarily unavailable" on chartA: empty points -> cached layout.
  const drawingEmptyA = { ...drawing, points: [] };
  const hitA = strategy.hitTest(sx, syMid, drawingEmptyA, chartA, 6);
  assert.strictEqual(
    hitA.isHit,
    true,
    "chartA stem still selectable after chartB render (no contamination)",
  );
  assert.strictEqual(hitA.part, "stem");

  // And chartB keeps its own (stem-less) cached layout.
  const drawingEmptyB = { ...drawing, points: [] };
  const labelCx =
    builtA.layout.labelRect.x + (builtA.layout.labelRect.right - builtA.layout.labelRect.x) / 2;
  const labelCy =
    builtA.layout.labelRect.y + (builtA.layout.labelRect.bottom - builtA.layout.labelRect.y) / 2;
  const hitB = strategy.hitTest(labelCx, labelCy, drawingEmptyB, chartB, 6);
  assert.strictEqual(hitB.isHit, true, "chartB label still selectable");
  assert.strictEqual(hitB.part, "label");
});
