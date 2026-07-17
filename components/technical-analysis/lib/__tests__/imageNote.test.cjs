/* eslint-env node */
const assert = require("node:assert/strict");
const test = require("node:test");

require("../../store/__tests__/testTypeScriptLoader.cjs");

const {
  validateImageFile,
  computeImageCssSize,
  IMAGE_MAX_BYTES,
  IMAGE_MAX_DIMENSION,
  buildImageNoteProps,
} = require("../imageNote/imageNoteValidation.ts");

const {
  normalizeImageNote,
} = require("../../hooks/drawing/imageNoteNormalization.ts");

const {
  resolveDrawingToolbarType,
} = require("../../lib/drawingToolbarResolution.ts");

const {
  ImageNoteStrategy,
} = require("../strategies/implementations/ImageNoteStrategy.ts");

// ----------------------------------------------------------------------------
// DOM mocks for image dimension decoding (validateImageFile -> readImageDimensions)
// ----------------------------------------------------------------------------
let injectedDims = { w: 100, h: 100 };
class MockImage {
  constructor() {
    this.naturalWidth = 0;
    this.naturalHeight = 0;
    this._src = "";
    this.onload = null;
    this.onerror = null;
  }
  set src(v) {
    this._src = v;
    this.naturalWidth = injectedDims.w;
    this.naturalHeight = injectedDims.h;
    if (typeof this.onload === "function") {
      Promise.resolve().then(() => this.onload && this.onload());
    }
  }
  get src() {
    return this._src;
  }
}
global.Image = MockImage;
global.URL = global.URL || {};
global.URL.createObjectURL = () => "blob:mock";
global.URL.revokeObjectURL = () => {};

const makeFile = (type, size, name) => ({ type, size, name });

// ============================================================================
// 1. VALIDATION
// ============================================================================
test("validateImageFile: PNG accepted", async () => {
  injectedDims = { w: 100, h: 100 };
  const r = await validateImageFile(makeFile("image/png", 1000, "a.png"));
  assert.equal(r.ok, true);
});

test("validateImageFile: JPEG accepted", async () => {
  injectedDims = { w: 100, h: 100 };
  const r = await validateImageFile(makeFile("image/jpeg", 1000, "a.jpg"));
  assert.equal(r.ok, true);
});

test("validateImageFile: WEBP accepted", async () => {
  injectedDims = { w: 100, h: 100 };
  const r = await validateImageFile(makeFile("image/webp", 1000, "a.webp"));
  assert.equal(r.ok, true);
});

test("validateImageFile: bad MIME rejected", async () => {
  const r = await validateImageFile(makeFile("image/gif", 1000, "a.gif"));
  assert.equal(r.ok, false);
  assert.equal(r.error.code, "BAD_MIME");
});

test("validateImageFile: >2MB rejected", async () => {
  injectedDims = { w: 100, h: 100 };
  const r = await validateImageFile(makeFile("image/png", IMAGE_MAX_BYTES + 1, "big.png"));
  assert.equal(r.ok, false);
  assert.equal(r.error.code, "TOO_LARGE");
});

test("validateImageFile: width > 2000 rejected", async () => {
  injectedDims = { w: IMAGE_MAX_DIMENSION + 1, h: 100 };
  const r = await validateImageFile(makeFile("image/png", 1000, "wide.png"));
  assert.equal(r.ok, false);
  assert.equal(r.error.code, "TOO_WIDE");
});

test("validateImageFile: height > 2000 rejected", async () => {
  injectedDims = { w: 100, h: IMAGE_MAX_DIMENSION + 1 };
  const r = await validateImageFile(makeFile("image/png", 1000, "tall.png"));
  assert.equal(r.ok, false);
  assert.equal(r.error.code, "TOO_TALL");
});

// ============================================================================
// 2. DIMENSIONING
// ============================================================================
test("computeImageCssSize: small image not upscaled", () => {
  const { cssWidth, cssHeight } = computeImageCssSize(80, 60, 1000, 1000);
  assert.equal(cssWidth, 80);
  assert.equal(cssHeight, 60);
});

test("computeImageCssSize: large image limited to 25% of grid", () => {
  // grid 1000x1000 -> maxWidth/maxHeight = 250.
  const { cssWidth, cssHeight } = computeImageCssSize(2000, 1600, 1000, 1000);
  assert.equal(cssWidth, 250); // 2000 * 0.125 = 250
  assert.equal(cssHeight, 200); // 1600 * 0.125 = 200
});

test("computeImageCssSize: ratio preserved (landscape), capped to 25% grid", () => {
  // natural 2000x1000, grid 4000 -> max 1000x1000 -> scale 0.5
  const { cssWidth, cssHeight } = computeImageCssSize(2000, 1000, 4000, 4000);
  assert.equal(cssWidth, 1000);
  assert.equal(cssHeight, 500);
  assert.equal(cssWidth / cssHeight, 2);
});

test("computeImageCssSize: ratio preserved (portrait), capped to 25% grid", () => {
  // natural 1000x2000, grid 4000 -> max 1000x1000 -> scale 0.5
  const { cssWidth, cssHeight } = computeImageCssSize(1000, 2000, 4000, 4000);
  assert.equal(cssWidth, 500);
  assert.equal(cssHeight, 1000);
  assert.equal(cssHeight / cssWidth, 2);
});

test("computeImageCssSize: small image never upscaled", () => {
  // natural 800x400 fits within 25% of 4000 (1000) -> scale 1, stays natural size
  const { cssWidth, cssHeight } = computeImageCssSize(800, 400, 4000, 4000);
  assert.equal(cssWidth, 800);
  assert.equal(cssHeight, 400);
  assert.equal(cssWidth / cssHeight, 2);
});

test("computeImageCssSize: square ratio preserved", () => {
  const { cssWidth, cssHeight } = computeImageCssSize(1000, 1000, 4000, 4000);
  assert.equal(cssWidth, 1000);
  assert.equal(cssHeight, 1000);
});

// ============================================================================
// 3. NORMALIZATION
// ============================================================================
test("normalizeImageNote: ignores non-image types", () => {
  const d = { id: "1", type: "line", points: [] };
  assert.equal(normalizeImageNote(d).type, "line");
});

test("normalizeImageNote: default transparency when missing", () => {
  const d = {
    id: "1",
    type: "image_note",
    points: [{ time: 0, value: 0 }],
    imageNoteProps: {
      assetId: "a",
      mimeType: "image/png",
      naturalWidth: 10,
      naturalHeight: 10,
      cssWidth: 10,
      cssHeight: 10,
    },
  };
  const n = normalizeImageNote(d);
  assert.equal(n.imageNoteProps.transparency, 0);
});

// ============================================================================
// 4. TOOLBAR RESOLUTION
// ============================================================================
test("resolveDrawingToolbarType: image_note resolves to image_note", () => {
  const has = (t) => t === "image_note";
  assert.equal(resolveDrawingToolbarType("image_note", has), "image_note");
});

// ============================================================================
// 5. STRATEGY HIT-TEST + RESIZE CORNERS
// ============================================================================
const mockChart = {
  convertToPixel: (_opts, point) => {
    // Map data coords to a fixed pixel center for the test (time ignored).
    return [100, 100];
  },
};

const makeImageDrawing = (cssWidth, cssHeight) => ({
  id: "img1",
  type: "image_note",
  points: [{ time: 0, value: 0 }],
  imageNoteProps: {
    assetId: "a",
    mimeType: "image/png",
    naturalWidth: cssWidth,
    naturalHeight: cssHeight,
    cssWidth,
    cssHeight,
    transparency: 0,
  },
});

test("ImageNoteStrategy.hitTest: inside rectangle hits", () => {
  const s = new ImageNoteStrategy();
  const d = makeImageDrawing(100, 100); // center 100,100 -> rect 50..150
  const r = s.hitTest(100, 100, d, mockChart, 0);
  assert.equal(r.isHit, true);
  assert.equal(r.hitType, "shape");
});

test("ImageNoteStrategy.hitTest: outside rectangle misses", () => {
  const s = new ImageNoteStrategy();
  const d = makeImageDrawing(100, 100);
  const r = s.hitTest(400, 400, d, mockChart, 0);
  assert.equal(r.isHit, false);
});

test("ImageNoteStrategy.hitTest: four corner handles report resizeEdge", () => {
  const s = new ImageNoteStrategy();
  const d = makeImageDrawing(100, 100);
  const corners = [
    [50, 50, "topLeft"],
    [150, 50, "topRight"],
    [50, 150, "bottomLeft"],
    [150, 150, "bottomRight"],
  ];
  for (const [x, y, edge] of corners) {
    const r = s.hitTest(x, y, d, mockChart, 0);
    assert.equal(r.isHit, true, `corner ${edge} should hit`);
    assert.equal(r.resizeEdge, edge, `corner ${edge} should report ${edge}`);
  }
});

test("ImageNoteStrategy.hitTest: hidden drawing never hits", () => {
  const s = new ImageNoteStrategy();
  const d = { ...makeImageDrawing(100, 100), hidden: true };
  const r = s.hitTest(100, 100, d, mockChart, 0);
  assert.equal(r.isHit, false);
});

// ============================================================================
// 6. PROPS BUILDER
// ============================================================================
test("buildImageNoteProps: captures metadata", () => {
  const validated = {
    file: makeFile("image/png", 100, "x.png"),
    mimeType: "image/png",
    naturalWidth: 800,
    naturalHeight: 600,
    originalFileName: "x.png",
  };
  const p = buildImageNoteProps("asset-1", validated, 200, 150, 25);
  assert.equal(p.assetId, "asset-1");
  assert.equal(p.naturalWidth, 800);
  assert.equal(p.cssWidth, 200);
  assert.equal(p.transparency, 25);
  assert.equal(p.originalFileName, "x.png");
});
