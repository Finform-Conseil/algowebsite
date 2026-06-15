/* eslint-env node */
require("../../../../../store/__tests__/testTypeScriptLoader.cjs");

const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const { compilePineScript } = require("../pineCompiler.ts");
const { createInitialPineEditorState, pineEditorReducer } = require("../pineEditorReducer.ts");
const { loadPineEditorState, parsePineEditorState, savePineEditorState, serializePineEditorState } = require("../pineStorage.ts");

const template = {
  description: "Test template",
  id: "brvm-rsi-sma",
  kind: "indicator",
  name: "BRVM RSI + SMA Guard",
  source: [
    "//@version=5",
    "indicator(\"BRVM RSI + SMA Guard\", overlay=true)",
    "smaFast = ta.sma(close, 20)",
    "plot(smaFast, \"SMA 20\")",
    "plotchar(close > smaFast, \"Breakout\", \"B\")",
  ].join("\n"),
};

describe("pine editor compiler", () => {
  it("compiles a bounded local Pine indicator and extracts visual outputs", () => {
    const result = compilePineScript(template.source);

    assert.equal(result.isExecutable, true);
    assert.equal(result.kind, "indicator");
    assert.equal(result.title, "BRVM RSI + SMA Guard");
    assert.equal(result.plots[0].title, "SMA 20");
    assert.equal(result.signals[0].title, "Breakout");
    assert.match(result.checksum, /^[a-f0-9]{8}$/);
  });

  it("rejects empty or unsafe source without executing it", () => {
    const result = compilePineScript("Function(\"return window\")(");

    assert.equal(result.isExecutable, false);
    assert.ok(result.diagnostics.some((diagnostic) => diagnostic.code === "PINE_VERSION_REQUIRED"));
    assert.ok(result.diagnostics.some((diagnostic) => diagnostic.code === "PINE_UNSAFE_TOKEN"));
  });

  it("detects delimiter mismatches before the UI can attach a script", () => {
    const result = compilePineScript("//@version=5\nindicator(\"Bad\")\nplot(close");

    assert.equal(result.isExecutable, false);
    assert.ok(result.diagnostics.some((diagnostic) => diagnostic.code === "PINE_DELIMITER_UNCLOSED"));
  });
});

describe("pine editor reducer and IndexedDB snapshot sanitation", () => {
  it("saves executable scripts and attaches overlays through pure reducer transitions", () => {
    const initial = createInitialPineEditorState(template);
    const saved = pineEditorReducer(initial, {
      now: "2026-06-11T17:00:00.000Z",
      script: {
        checksum: initial.compileResult.checksum,
        id: "pine-" + initial.compileResult.checksum,
        kind: initial.compileResult.kind,
        name: initial.compileResult.title,
        source: initial.source,
        updatedAt: "2026-06-11T17:00:00.000Z",
      },
      type: "save_success",
    });
    const attached = pineEditorReducer(saved, { now: "2026-06-11T17:01:00.000Z", type: "attach_overlay" });

    assert.equal(saved.savedScripts.length, 1);
    assert.equal(saved.isDirty, false);
    assert.equal(attached.runtimeStatus, "attached");
    assert.equal(attached.attachedOverlay.title, "BRVM RSI + SMA Guard");
  });

  it("round-trips sanitized snapshots without trusting stored checksums", () => {
    const initial = createInitialPineEditorState(template);
    const serialized = serializePineEditorState({
      ...initial,
      savedScripts: [{
        checksum: "tampered",
        id: "bad-id",
        kind: "indicator",
        name: "Stored",
        source: template.source,
        updatedAt: "2026-06-11T17:00:00.000Z",
      }],
    });
    const parsed = parsePineEditorState(serialized, initial);

    assert.equal(parsed.savedScripts.length, 1);
    assert.notEqual(parsed.savedScripts[0].checksum, "tampered");
    assert.equal(parsed.compileResult.isExecutable, true);
  });

  it("degrades gracefully when IndexedDB is unavailable in Node", async () => {
    const initial = createInitialPineEditorState(template);
    const loaded = await loadPineEditorState(initial);
    const result = await savePineEditorState(initial);

    assert.equal(loaded.source, initial.source);
    assert.match(result.error, /IndexedDB is unavailable/);
  });
});
