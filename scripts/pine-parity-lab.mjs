import { PineTS } from "pinets";
import { ArrayFeed, Engine, compile } from "@heyphat/piner";

const EPSILON = 1e-9;
const PARITY_CASES = [
  {
    id: "sma-5",
    title: "SMA 5",
    warmupBars: 0,
    source: [
      "//@version=6",
      "indicator(\"Parity SMA\", overlay=true)",
      "value = ta.sma(close, 5)",
      "plot(value, \"SMA 5\")",
    ].join("\n"),
  },
  {
    id: "ema-8",
    title: "EMA 8",
    warmupBars: 120,
    source: [
      "//@version=6",
      "indicator(\"Parity EMA\", overlay=true)",
      "value = ta.ema(close, 8)",
      "plot(value, \"EMA 8\")",
    ].join("\n"),
  },
];

const bars = Array.from({ length: 240 }, (_, index) => {
  const base = 100 + index * 0.25 + Math.sin(index / 7) * 3;
  const openTime = Date.UTC(2026, 0, 1 + index);
  return {
    openTime,
    closeTime: openTime + 86_399_999,
    open: base - 0.4,
    high: base + 1.2,
    low: base - 1.4,
    close: base,
    volume: 10_000 + index * 17,
  };
});

const finiteOrNull = (value) => Number.isFinite(Number(value)) ? Number(value) : null;

const normalizePineTSPlot = (context, title) => {
  const plot = context.plots?.[title];
  if (!plot || !Array.isArray(plot.data)) {
    throw new Error(`PineTS did not expose plot "${title}".`);
  }
  return plot.data.map((entry) => finiteOrNull(entry?.value));
};

const normalizePinerPlot = (engine, title) => {
  const plots = engine.outputs?.plots;
  if (!(plots instanceof Map)) throw new Error("Piner outputs.plots is not a Map.");
  const plot = [...plots.values()].find((entry) => entry?.title === title);
  if (!plot || !Array.isArray(plot.data)) {
    throw new Error(`Piner did not expose plot "${title}".`);
  }
  return plot.data.map(finiteOrNull);
};

const compareSeries = (left, right, startIndex = 0) => {
  const length = Math.min(left.length, right.length);
  let compared = 0;
  let maxAbsDiff = 0;
  let worstIndex = -1;

  for (let index = Math.max(0, startIndex); index < length; index += 1) {
    const a = left[index];
    const b = right[index];
    if (a === null || b === null) continue;
    const diff = Math.abs(a - b);
    compared += 1;
    if (diff > maxAbsDiff) {
      maxAbsDiff = diff;
      worstIndex = index;
    }
  }

  if (compared === 0) throw new Error("No finite overlapping values were available for parity comparison.");
  return { compared, maxAbsDiff, worstIndex, pass: maxAbsDiff <= EPSILON };
};

let failed = false;

for (const parityCase of PARITY_CASES) {
  const pineTSContext = await new PineTS(bars).run(parityCase.source);
  const pineTSValues = normalizePineTSPlot(pineTSContext, parityCase.title);

  const compiled = compile(parityCase.source);
  const pinerEngine = new Engine(compiled, new ArrayFeed(bars));
  await pinerEngine.run({ symbol: "PARITY", timeframe: "1D" });
  const pinerValues = normalizePinerPlot(pinerEngine, parityCase.title);

  const fullRange = compareSeries(pineTSValues, pinerValues);
  const steadyState = compareSeries(pineTSValues, pinerValues, parityCase.warmupBars);
  console.log(JSON.stringify({
    case: parityCase.id,
    fullRangeCompared: fullRange.compared,
    fullRangeMaxAbsDiff: fullRange.maxAbsDiff,
    fullRangeWorstIndex: fullRange.worstIndex,
    steadyStateCompared: steadyState.compared,
    steadyStateMaxAbsDiff: steadyState.maxAbsDiff,
    steadyStatePass: steadyState.pass,
    steadyStateWorstIndex: steadyState.worstIndex,
    warmupBars: parityCase.warmupBars,
  }));

  if (!steadyState.pass) failed = true;
}

if (failed) {
  console.error("Pine parity lab detected a persistent PineTS/Piner numeric divergence after the declared warm-up window.");
  process.exitCode = 1;
} else {
  console.log(`Pine parity lab PASS (${PARITY_CASES.length} cases, tolerance ${EPSILON}; full-range seed differences remain reported above).`);
}
