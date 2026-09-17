/**
 * Synchronous arbitration between the drawing overlay and the chart viewport.
 *
 * Event propagation alone cannot establish ownership reliably: the viewport uses
 * a native capture listener to beat ZRender, while React delegates capture events
 * from its root. Depending on registration/order, the viewport may therefore arm
 * chart-pan before React can mark the same pointerdown as drawing-owned.
 *
 * The registry below lets the viewport ask the drawing engine, synchronously from
 * its own native capture handler, whether the pointer is currently over a drawing.
 * The canvas and callback are weakly held so remounts require no global cleanup.
 */
export type DrawingPointerHitTest = (event: PointerEvent) => boolean;

const drawingOwnedPointerEvents = new WeakSet<Event>();
const drawingPointerHitTests = new WeakMap<HTMLCanvasElement, DrawingPointerHitTest>();

export const markDrawingPointerEventOwned = (event: Event): void => {
  drawingOwnedPointerEvents.add(event);
};

export const isDrawingPointerEventOwned = (event: Event): boolean =>
  drawingOwnedPointerEvents.has(event);

export const registerDrawingPointerHitTest = (
  canvas: HTMLCanvasElement,
  hitTest: DrawingPointerHitTest,
): (() => void) => {
  drawingPointerHitTests.set(canvas, hitTest);
  return () => {
    if (drawingPointerHitTests.get(canvas) === hitTest) {
      drawingPointerHitTests.delete(canvas);
    }
  };
};

export const shouldDrawingOwnPointerEvent = (
  canvas: HTMLCanvasElement | null,
  event: PointerEvent,
): boolean => {
  if (!canvas) return false;
  const hitTest = drawingPointerHitTests.get(canvas);
  if (!hitTest) return false;
  try {
    return hitTest(event);
  } catch {
    return false;
  }
};
