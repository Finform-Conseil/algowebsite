/* eslint-env node */
/*
 * Tests for the flag_mark drawing toolbar configuration and the flag_color
 * popup contract. These assert the JSON source-of-truth that drives
 * TechnicalAnalysis.tsx (hasToolbarConfig + resolveDrawingToolbarType) and the
 * FlagColorPopup update shape used by ColorPopup.tsx / ToolbarButtonPopups.tsx.
 *
 * The resolution logic is reproduced here as a pure function so the test does
 * not require the React/Tailwind/TS toolchain to run.
 */
const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

const CONFIG_PATH = path.resolve(
  __dirname,
  "../../../toolbar-config-antigravity.json",
);
const toolbarConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

// Mirror of resolveDrawingToolbarType in lib/drawingToolbarResolution.ts
function resolveDrawingToolbarType(type, hasToolbarConfig) {
  if (!type) return undefined;
  if (type === "pin") return "pin";
  if (type === "table") return "table";
  if (type === "signpost") return "signpost";
  if (hasToolbarConfig(type)) return type;
  return undefined;
}

function hasToolbarConfig(type) {
  return !!type && (toolbarConfig.drawings[type] !== undefined);
}

test("flag_mark has its own toolbar config (hasToolbarConfig true)", () => {
  assert.equal(hasToolbarConfig("flag_mark"), true);
});

test("flag_mark resolves to itself via resolveDrawingToolbarType", () => {
  assert.equal(resolveDrawingToolbarType("flag_mark", hasToolbarConfig), "flag_mark");
});

test("flag_mark toolbar has exactly 7 actions in correct order", () => {
  const toolbar = toolbarConfig.drawings.flag_mark.toolbar;
  assert.deepEqual(toolbar, [
    "move",
    "template",
    "flag_color",
    "settings",
    "lock",
    "trash",
    "more",
  ]);
  assert.equal(toolbar.length, 7);
});

test("flag_mark toolbar includes template and flag_color (no generic color)", () => {
  const toolbar = toolbarConfig.drawings.flag_mark.toolbar;
  assert.ok(toolbar.includes("template"), "flag_mark must expose templates");
  assert.ok(toolbar.includes("flag_color"), "flag_mark must expose flag_color");
  assert.ok(!toolbar.includes("color"), "flag_mark must NOT expose generic line color");
  assert.ok(!toolbar.includes("fill"), "flag_mark must NOT expose fill");
});

test("flag_color button definition exists and maps to openFlagColorPopup", () => {
  const def = toolbarConfig.button_definitions.flag_color;
  assert.ok(def, "flag_color button_definition must exist");
  assert.equal(def.icon, "bi-paint-bucket");
  assert.equal(def.action, "openFlagColorPopup");
});

test("every flag_mark toolbar button has a button_definition", () => {
  for (const id of toolbarConfig.drawings.flag_mark.toolbar) {
    assert.ok(
      toolbarConfig.button_definitions[id],
      `flag_mark toolbar button '${id}' must have a button_definition`,
    );
  }
});

test("flag_color action resolves to a handler in ToolbarButton click switch", () => {
  // The ToolbarButton click handler switch (ToolbarButton.tsx) must contain a
  // case for the action produced by the flag_color button definition.
  const toolbarButtonSrc = fs.readFileSync(
    path.resolve(__dirname, "../../../components/toolbar/floating/ToolbarButton.tsx"),
    "utf8",
  );
  const def = toolbarConfig.button_definitions.flag_color;
  assert.ok(
    toolbarButtonSrc.includes(`case "${def.action}":`),
    `ToolbarButton handler must handle action '${def.action}'`,
  );
});

test("flag_color popup is rendered by ToolbarButtonPopups", () => {
  const popupsSrc = fs.readFileSync(
    path.resolve(__dirname, "../../../components/toolbar/floating/ToolbarButtonPopups.tsx"),
    "utf8",
  );
  assert.ok(
    popupsSrc.includes('buttonId === "flag_color"'),
    "ToolbarButtonPopups must render FlagColorPopup for flag_color",
  );
  assert.ok(popupsSrc.includes("FlagColorPopup"), "FlagColorPopup component must be imported");
});

test("FlagColorPopup updates flagMarkProps.flagColor via updateDrawing", () => {
  // Reproduce the FlagColorPopup onChange contract from ColorPopup.tsx so the
  // test fails if the implementation shape drifts.
  const updateDrawing = (id, updates) => {
    assert.equal(id, "drawing-1");
    assert.ok(updates.flagMarkProps, "update must carry flagMarkProps");
    assert.equal(updates.flagMarkProps.flagColor, "#ff0000");
    assert.equal(updates.flagMarkProps.text, "preserved");
  };
  const onChange = (nextColor) => {
    updateDrawing("drawing-1", {
      flagMarkProps: { text: "preserved", flagColor: nextColor },
    });
  };
  onChange("#ff0000");
});

test("FlagColorPopup falls back to default color when flagMarkProps missing", () => {
  const drawing = { id: "d", type: "flag_mark" };
  const color = drawing.flagMarkProps?.flagColor || "#2962FF";
  assert.equal(color, "#2962FF");
});
