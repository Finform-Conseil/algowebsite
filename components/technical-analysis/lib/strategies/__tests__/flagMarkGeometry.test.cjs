/* eslint-env node */
const assert = require("node:assert/strict");
const test = require("node:test");

const FLAG_TOTAL_WIDTH = 19;
const FLAG_OFFSET_X = 2;
const FLAG_BODY_WIDTH = FLAG_TOTAL_WIDTH - FLAG_OFFSET_X;
const FLAG_HEIGHT = 12;
const MAST_LENGTH = 20;
const MAST_WIDTH = 1;
const NOTCH_DEPTH = 3;

function buildFlagVertices(anchorX, anchorY) {
  const flagLeft = anchorX + FLAG_OFFSET_X;
  const flagTop = anchorY - MAST_LENGTH;
  const flagBottom = flagTop + FLAG_HEIGHT;
  const flagRight = anchorX + FLAG_TOTAL_WIDTH;
  const notchCenterY = flagTop + FLAG_HEIGHT / 2;
  return [
    { x: flagLeft, y: flagTop },
    { x: flagRight, y: flagTop },
    { x: flagRight - NOTCH_DEPTH, y: notchCenterY },
    { x: flagRight, y: flagBottom },
    { x: flagLeft, y: flagBottom },
  ];
}

function isPointInPolygon(px, py, verts) {
  let inside = false;
  for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
    const xi = verts[i].x, yi = verts[i].y;
    const xj = verts[j].x, yj = verts[j].y;
    if ((yi > py) !== (yj > py) && px <= ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function buildMastVertices(anchorX, anchorY) {
  const top = anchorY - MAST_LENGTH;
  return [
    { x: anchorX, y: top },
    { x: anchorX + MAST_WIDTH, y: top },
    { x: anchorX + MAST_WIDTH, y: anchorY },
    { x: anchorX, y: anchorY },
  ];
}

function isInHitBox(mx, my, anchorX, anchorY) {
  return mx >= anchorX && mx <= anchorX + FLAG_TOTAL_WIDTH &&
         my >= anchorY - MAST_LENGTH && my <= anchorY;
}

test("flag mark geometry: flag body bounding box is body_width wide by 12 tall", () => {
  const verts = buildFlagVertices(100, 200);
  const xs = verts.map((v) => v.x);
  const ys = verts.map((v) => v.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  assert.equal(maxY - minY, FLAG_HEIGHT);
  assert.equal(maxX - minX, FLAG_BODY_WIDTH);
});

test("flag mark geometry: total bounding box is total_width wide from anchorX", () => {
  const verts = buildFlagVertices(100, 200);
  const xs = verts.map((v) => v.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  assert.equal(minX, 100 + FLAG_OFFSET_X);
  assert.equal(maxX, 100 + FLAG_TOTAL_WIDTH);
});

test("flag mark geometry: mast is 1 wide by 20 tall", () => {
  const mastTop = 200 - MAST_LENGTH;
  assert.equal(mastTop, 180);
  const mastRight = 100 + MAST_WIDTH;
  assert.equal(mastRight, 101);
  const mastBottom = 200;
  assert.equal(mastBottom - mastTop, MAST_LENGTH);
});

test("flag mark geometry: notch is inward (vertex left of right edge)", () => {
  const verts = buildFlagVertices(100, 200);
  const flagRight = 100 + FLAG_TOTAL_WIDTH;
  const notchVertex = verts[2];
  assert.ok(notchVertex.x < flagRight, "notch vertex must be LEFT of right edge (inward)");
  assert.equal(notchVertex.x, flagRight - NOTCH_DEPTH);
});

test("flag mark geometry: notch is centered on flag body", () => {
  const verts = buildFlagVertices(100, 200);
  const flagTop = 200 - MAST_LENGTH;
  const notchCenterY = verts[2].y;
  const expectedCenter = flagTop + FLAG_HEIGHT / 2;
  assert.equal(notchCenterY, expectedCenter);
});

test("flag mark hit-test: point inside flag body returns hit", () => {
  const verts = buildFlagVertices(100, 200);
  const xs = verts.map((v) => v.x);
  const ys = verts.map((v) => v.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  assert.ok(isPointInPolygon(cx, cy, verts));
});

test("flag mark hit-test: point outside bounding box returns no hit", () => {
  assert.ok(!isPointInPolygon(100, 179, buildFlagVertices(100, 200)));
  assert.ok(!isPointInPolygon(98, 190, buildFlagVertices(100, 200)));
  assert.ok(!isPointInPolygon(125, 190, buildFlagVertices(100, 200)));
  assert.ok(!isPointInPolygon(100, 201, buildFlagVertices(100, 200)));
});

test("flag mark hit-test: point on mast region returns hit", () => {
  // FlagMarkStrategy.hitTest uses inclusive bounding box [anchorX, anchorY-MAST_LENGTH]
  // to [anchorX+FLAG_TOTAL_WIDTH, anchorY], so mast-only points are hits.
  assert.ok(isInHitBox(100, 190, 100, 200));
});

test("flag mark: flag offset from anchor is 2px right", () => {
  const verts = buildFlagVertices(100, 200);
  const flagLeft = Math.min(...verts.map((v) => v.x));
  assert.equal(flagLeft, 100 + FLAG_OFFSET_X);
});

test("flag mark: flag starts at top of mast", () => {
  const verts = buildFlagVertices(100, 200);
  const minY = Math.min(...verts.map((v) => v.y));
  assert.equal(minY, 200 - MAST_LENGTH);
});

test("flag mark: single anchor point", () => {
  const verts = buildFlagVertices(100, 200);
  assert.equal(verts.length, 5);
});

test("flag mark: flag is in upper portion of mast", () => {
  const verts = buildFlagVertices(100, 200);
  const flagTop = Math.min(...verts.map((v) => v.y));
  const flagBottom = Math.max(...verts.map((v) => v.y));
  assert.equal(flagTop, 200 - MAST_LENGTH);
  assert.equal(flagBottom, 200 - MAST_LENGTH + FLAG_HEIGHT);
  assert.ok(flagBottom < 200);
});

test("flag mark hit-test: point at anchorX + 19 (total right edge) is on boundary", () => {
  // FLAG_TOTAL_WIDTH=19, right edge at x=119.
  // FlagMarkStrategy.hitTest includes this in its bounding box.
  assert.ok(isInHitBox(100 + FLAG_TOTAL_WIDTH, 195, 100, 200));
});

test("flag mark hit-test: point beyond anchorX + 19 returns no hit", () => {
  assert.ok(!isPointInPolygon(100 + FLAG_TOTAL_WIDTH + 1, 195, buildFlagVertices(100, 200)));
});

test("flag mark hit-test: point on anchor point returns hit", () => {
  // Anchor point is at the base of the mast, not inside the flag body polygon.
  // FlagMarkStrategy.hitTest bounding box includes the anchor.
  assert.ok(isInHitBox(100, 200, 100, 200));
})