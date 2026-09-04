import json
import urllib.request
import websocket

TARGET_SUBSTR = "/fr/equity/technical-analysis"
with urllib.request.urlopen("http://127.0.0.1:9222/json/list", timeout=3) as response:
    pages = json.load(response)
page = next((p for p in pages if TARGET_SUBSTR in p.get("url", "") and p.get("type") == "page"), None)
if not page:
    raise SystemExit("technical-analysis page not found")

ws = websocket.create_connection(page["webSocketDebuggerUrl"], timeout=8, suppress_origin=True)
expression = r"""
(async () => {
  const slot = document.querySelector('.gp-multi-chart-slot.is-active');
  const host = slot?.querySelector('.gp-peer-chart__canvas');
  if (!slot || !host) return { error: 'active chart host not found' };
  const rect = host.getBoundingClientRect();
  const layoutKey = 'technical-analysis.multiChartLayout.v3';
  const originalPut = IDBObjectStore.prototype.put;
  let layoutWrites = 0;
  let allWrites = 0;
  IDBObjectStore.prototype.put = function(value, key) {
    allWrites += 1;
    if (key === layoutKey) layoutWrites += 1;
    return originalPut.apply(this, arguments);
  };

  const longTasks = [];
  let observer = null;
  try {
    observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) longTasks.push(entry.duration);
    });
    observer.observe({ type: 'longtask' });
  } catch {}

  const frames = [];
  const nextFrame = () => new Promise((resolve) => requestAnimationFrame((time) => resolve(time)));
  const cx = rect.left + rect.width * 0.52;
  const cy = rect.top + rect.height * 0.50;
  const endX = rect.left + rect.width * 0.78;
  const pointerId = 91;
  const dispatchPointer = (type, x, buttons) => {
    host.dispatchEvent(new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId,
      pointerType: 'mouse',
      clientX: x,
      clientY: cy,
      button: type === 'pointerdown' ? 0 : -1,
      buttons,
      isPrimary: true,
    }));
  };

  const started = performance.now();
  let previousFrame = await nextFrame();
  dispatchPointer('pointerdown', cx, 1);
  for (let index = 1; index <= 30; index += 1) {
    const frame = await nextFrame();
    frames.push(frame - previousFrame);
    previousFrame = frame;
    dispatchPointer('pointermove', cx + (endX - cx) * index / 30, 1);
  }
  dispatchPointer('pointerup', endX, 0);

  for (let index = 0; index < 8; index += 1) {
    const frame = await nextFrame();
    frames.push(frame - previousFrame);
    previousFrame = frame;
    host.dispatchEvent(new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      clientX: cx,
      clientY: cy,
      deltaY: -34,
      deltaMode: WheelEvent.DOM_DELTA_PIXEL,
    }));
  }

  await new Promise((resolve) => setTimeout(resolve, 520));
  observer?.disconnect();
  IDBObjectStore.prototype.put = originalPut;

  const sorted = frames.filter((value) => Number.isFinite(value) && value > 0 && value < 500).sort((a, b) => a - b);
  const pct = (q) => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * q))] : null;
  const result = {
    chartId: slot.dataset.chartId,
    layoutCount: document.querySelectorAll('.gp-multi-chart-slot').length,
    sampleMs: performance.now() - started,
    frameCount: sorted.length,
    medianMs: pct(0.5),
    p95Ms: pct(0.95),
    p99Ms: pct(0.99),
    maxMs: sorted.length ? sorted[sorted.length - 1] : null,
    over20: sorted.filter((value) => value > 20).length,
    over33: sorted.filter((value) => value > 33).length,
    longTasks,
    layoutWrites,
    allWrites,
  };
  result.assertions = {
    enoughFrames: result.frameCount >= 35,
    layoutPersistedAtMostOnce: result.layoutWrites <= 1,
    p95Under34ms: result.p95Ms !== null && result.p95Ms < 34,
    noLongTaskOver100ms: result.longTasks.every((duration) => duration < 100),
  };
  result.allPassed = Object.values(result.assertions).every(Boolean);
  return result;
})()
"""
ws.send(json.dumps({
    "id": 1,
    "method": "Runtime.evaluate",
    "params": {
        "expression": expression,
        "awaitPromise": True,
        "returnByValue": True,
    },
}))
while True:
    message = json.loads(ws.recv())
    if message.get("id") == 1:
        if "error" in message:
            raise RuntimeError(message["error"])
        value = message.get("result", {}).get("result", {}).get("value")
        print(json.dumps(value, ensure_ascii=False))
        break
ws.close()
