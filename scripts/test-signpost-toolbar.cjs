// @ts-nocheck
/* eslint-disable */
/**
 * GATE3 Signpost toolbar — config + per-action / per-state verification.
 * Loads the REAL TypeScript via `typescript` transpile + `vm.runInNewContext`.
 *
 *   node --test scripts/test-signpost-toolbar.cjs
 */
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const vm = require("vm");
const test = require("node:test");
const assert = require("assert");

const ROOT = path.resolve(__dirname, "..", "components", "technical-analysis");

function resolveExisting(p) {
  if (fs.existsSync(p)) return p;
  for (const ext of [".ts", ".tsx", ".js", ".json"]) {
    if (fs.existsSync(p + ext)) return p + ext;
  }
  return p;
}

function loadTs(relPath) {
  const full = resolveExisting(path.join(ROOT, relPath));
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
      if (p.startsWith(".")) {
        const resolved = path.resolve(path.dirname(full), p);
        return loadTs(path.relative(ROOT, resolved));
      }
      throw new Error("Cannot require in test sandbox: " + p);
    },
  };
  sandbox.module.exports = sandbox.exports;
  vm.createContext(sandbox);
  vm.runInContext(out, sandbox, { filename: full });
  return sandbox.module.exports;
}

const CONFIG_PATH = path.join(ROOT, "toolbar-config-antigravity.json");
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

const fontOpts = loadTs("config/drawing/drawingFontSizeOptions.ts");
const labels = loadTs("lib/drawingToolbarLabels.ts");
const resolution = loadTs("lib/drawingToolbarResolution.ts");

const SIGNPOST_TOOLBAR = ["move", "template", "font_size", "settings", "lock", "trash", "more"];
const EXPECTED_ACTIONS = {
  move: "drag",
  template: "openTemplatePopup",
  font_size: "openFontSizePopup",
  settings: "openSettingsModal",
  lock: "toggleLock",
  trash: "deleteDrawing",
  more: "openMorePopup",
};

test("SIGNPOST toolbar: dedicated config (not text_note) with exact mandatory order", () => {
  assert.ok(config.drawings.signpost, "signpost must have its own toolbar entry");
  assert.notStrictEqual(
    config.drawings.signpost,
    config.drawings.text_note,
    "signpost must NOT reuse the text_note config object",
  );
  assert.deepStrictEqual(
    config.drawings.signpost.toolbar,
    SIGNPOST_TOOLBAR,
    "toolbar order must be: move, template, font_size, settings, lock, trash, more",
  );
});

test("SIGNPOST toolbar: excludes line color and fill (kept only in Settings)", () => {
  const tb = config.drawings.signpost.toolbar;
  assert.ok(!tb.includes("color"), "line color must NOT be in the signpost toolbar");
  assert.ok(!tb.includes("fill"), "fill must NOT be in the signpost toolbar");
  // sanity: color/fill still defined as buttons for other tools
  assert.ok(config.button_definitions.color, "color button definition still exists");
  assert.ok(config.button_definitions.fill, "fill button definition still exists");
});

test("SIGNPOST toolbar: per-action mapping resolves to real handlers", () => {
  for (const btn of SIGNPOST_TOOLBAR) {
    const def = config.button_definitions[btn];
    assert.ok(def, `button '${btn}' must have a button_definition`);
    assert.strictEqual(
      def.action,
      EXPECTED_ACTIONS[btn],
      `button '${btn}' must map to action ${EXPECTED_ACTIONS[btn]}`,
    );
  }
});

test("SIGNPOST font sizes: exact TradingView scale implemented", () => {
  const expected = [8, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 40];
  assert.ok(Array.isArray(fontOpts.TRADINGVIEW_FONT_SIZES), "must be an array");
  assert.strictEqual(fontOpts.TRADINGVIEW_FONT_SIZES.length, expected.length, "must have 13 sizes");
  expected.forEach((v, i) =>
    assert.strictEqual(fontOpts.TRADINGVIEW_FONT_SIZES[i], v, `size[${i}] must be ${v}`),
  );
});

test("LOCK label: per-state tooltip/aria-label", () => {
  assert.strictEqual(labels.getLockTooltip(false), "Verrouiller", "unlocked -> Verrouiller");
  assert.strictEqual(labels.getLockTooltip(true), "Déverrouiller", "locked -> Déverrouiller");
});

test("TOOLBAR RESOLUTION: signpost resolves to its own config, not text_note", () => {
  const has = (t) => config.drawings[t] !== undefined;
  assert.strictEqual(resolution.resolveDrawingToolbarType("signpost", has), "signpost");
  assert.strictEqual(resolution.resolveDrawingToolbarType("text_note", has), "text_note");
  assert.strictEqual(resolution.resolveDrawingToolbarType("note", has), "text_note");
  assert.strictEqual(resolution.resolveDrawingToolbarType("callout", has), "text_note");
  assert.strictEqual(resolution.resolveDrawingToolbarType("price_note", has), "price_note");
  assert.strictEqual(resolution.resolveDrawingToolbarType("pin", has), "pin");
  assert.strictEqual(resolution.resolveDrawingToolbarType("table", has), "table");
  assert.strictEqual(resolution.resolveDrawingToolbarType(undefined, has), undefined);
  assert.strictEqual(resolution.resolveDrawingToolbarType("does_not_exist", has), undefined);
});

test("NO REGRESSION: text_note family toolbar unchanged (color+fill+text present)", () => {
  const tb = config.drawings.text_note.toolbar;
  assert.ok(tb.includes("color"));
  assert.ok(tb.includes("fill"));
  assert.ok(tb.includes("text"));
  assert.ok(tb.includes("move") && tb.includes("template") && tb.includes("settings"));
});
