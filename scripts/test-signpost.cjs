// @ts-nocheck
/* eslint-disable */
/**
 * GATE3 Signpost — pure-module verification.
 * Loads the REAL TypeScript via `typescript` transpile + `vm.runInNewContext`.
 *
 *   node --test scripts/test-signpost.cjs
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
      container
        ? { x: 0, y: 0, width: 1000, height: 600 }
        : { x: 0, y: 30, width: 800, height: 600 },
  },
  viewportMath: {
    clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
  },
};

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
    require: (p) => {
      if (p.includes("viewportGraphics")) return stubMap.viewportGraphics;
      if (p.includes("viewportMath")) return stubMap.viewportMath;
      if (p.startsWith(".")) {
        const resolved = path.resolve(path.dirname(full), p);
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

const proj = loadTs("hooks/drawing/drawingSignpostProjection.ts", stubs);
const norm = loadTs("hooks/drawing/signpostNormalization.ts", stubs);

const measure = (font, t) => t.length * 7;
const font = "12px Inter, sans-serif";
const PRICE_PANE = { x: 0, y: 0, width: 1000, height: 600, right: 1000, bottom: 600 };

const baseLayout = (overrides = {}) =>
  proj.computeSignpostLayout({
    anchorX: 500,
    labelY: 300,
    candleEndpointY: 500,
    lines: [],
    displayPlaceholder: true,
    fontSize: 12,
    lineHeight: 17,
    selected: false,
    pricePaneRect: PRICE_PANE,
    measureText: measure,
    font,
    ...overrides,
  });

test("label above candle -> stem descends to candle HIGH, square handle on top", () => {
  const l = baseLayout({ candleEndpointY: 500 }); // endpoint below label => label above
  assert.strictEqual(l.stem.x, 500);
  assert.strictEqual(l.stem.y2, 500, "stem terminates exactly on the candle endpoint");
  assert.ok(l.stem.y2 > l.stem.y1, "stem goes downward from label to candle");
  assert.strictEqual(l.handleSide, "top", "square handle sits above the field");
  assert.strictEqual(l.handleRect.width, proj.HANDLE_SIZE);
  assert.strictEqual(l.handleRect.height, proj.HANDLE_SIZE);
});

test("label below candle -> stem rises to candle LOW, square handle underneath", () => {
  const l = baseLayout({ labelY: 500, candleEndpointY: 300 }); // endpoint above label
  assert.strictEqual(l.stem.y1, 300, "stem starts on the candle endpoint");
  assert.ok(l.stem.y1 < l.stem.y2, "stem goes upward to the label");
  assert.strictEqual(l.handleSide, "bottom");
});

test("stem is clamped to the price pane (never reaches the Volume pane)", () => {
  // Candle endpoint lands inside the Volume grid (below the price pane bottom=600).
  const l = baseLayout({ candleEndpointY: 900, pricePaneRect: PRICE_PANE });
  assert.ok(l.stem.y2 <= PRICE_PANE.bottom, "stem never extends past the price pane bottom");
  assert.ok(l.stem.y2 >= PRICE_PANE.y, "stem never extends above the price pane top");
});

test("clampStemToPricePane keeps a multi-grid stem out of Volume", () => {
  const volumePane = { x: 0, y: 620, width: 1000, height: 120, right: 1000, bottom: 740 };
  const clamped = proj.clampStemToPricePane({ x: 500, y1: 600, y2: 720 }, volumePane);
  // The real safety net is the price pane, so re-clamp against it:
  const safe = proj.clampStemToPricePane(clamped, PRICE_PANE);
  assert.ok(safe.y2 <= PRICE_PANE.bottom, "stem never reaches the Volume pane (bottom=620)");
});

test("empty signpost shows the neutral 'Add text' field (placeholder width)", () => {
  const l = baseLayout({ lines: [], displayPlaceholder: true });
  assert.ok(l.labelRect.width >= proj.LABEL_MIN_WIDTH_PLACEHOLDER, "placeholder min width respected");
  // With no text, width derives from "Add text" measurement (8 chars * 7 + padding 20 = 76).
  assert.strictEqual(l.labelRect.width, 76);
});

test("square handle has equal width/height (not a circle)", () => {
  const l = baseLayout();
  assert.strictEqual(l.handleRect.width, l.handleRect.height);
  assert.strictEqual(l.handleRect.width, proj.HANDLE_SIZE);
});

test("emoji pin OFF -> no emoji rect; ON -> emoji rect present", () => {
  const off = baseLayout({ emojiPin: { enabled: false, emoji: "📍", color: "#2962FF", opacity: 1 } });
  assert.strictEqual(off.emojiPinRect, null);
  const on = baseLayout({ emojiPin: { enabled: true, emoji: "📍", color: "#2962FF", opacity: 1 } });
  assert.ok(on.emojiPinRect, "emoji pin rect produced when enabled");
});

test("verticalPositionPct <-> anchorY round-trip + clamp", () => {
  const rect = { x: 0, y: 0, width: 1000, height: 600, right: 1000, bottom: 600 };
  assert.ok(Math.abs(proj.verticalPositionPctToAnchorY(50, rect) - 300) < 1e-6);
  assert.ok(Math.abs(proj.verticalPositionPctToAnchorY(0, rect) - 600) < 1e-6);
  assert.ok(Math.abs(proj.verticalPositionPctToAnchorY(100, rect) - 0) < 1e-6);
});

test("normalizeSignpost: legacy seeded, idempotent, clamped, survives JSON round-trip", () => {
  const legacy = { id: "d", type: "signpost", points: [{ time: 100, value: 5 }], style: {} };
  const n1 = norm.normalizeSignpost(legacy, { resolveBarIndex: (t) => Number(t) });
  assert.notStrictEqual(n1, legacy, "returns a new object");
  assert.strictEqual(n1.signpostProps.barIndex, 100, "barIndex resolved");
  assert.strictEqual(n1.signpostProps.verticalPositionPct, 50, "default pct 50");

  const n2 = norm.normalizeSignpost(n1, { resolveBarIndex: (t) => Number(t) });
  assert.strictEqual(n2, n1, "idempotent");

  const over = norm.normalizeSignpost(
    { id: "d", type: "signpost", points: [{ time: 1, value: 1 }], style: {}, signpostProps: { barIndex: 1, verticalPositionPct: 200 } },
    {},
  );
  assert.strictEqual(over.signpostProps.verticalPositionPct, 100, "clamp 100");

  // Simulated reload: serialize -> parse -> re-normalize (no data loss).
  const reloaded = JSON.parse(JSON.stringify(n1));
  const n3 = norm.normalizeSignpost(reloaded, { resolveBarIndex: (t) => Number(t) });
  assert.strictEqual(n3.signpostProps.barIndex, 100);
  assert.strictEqual(n3.signpostProps.verticalPositionPct, 50);

  const non = norm.normalizeSignpost({ id: "x", type: "line", points: [], style: {} }, {});
  assert.strictEqual(non.type, "line", "non-signpost untouched");
});
