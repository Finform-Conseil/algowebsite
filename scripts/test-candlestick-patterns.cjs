/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const sourcePath = path.join(__dirname, "..", "components/technical-analysis/lib/Indicators/TechnicalIndicators.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    esModuleInterop: true,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
});
const sandboxModule = { exports: {} };

vm.runInNewContext(transpiled.outputText, {
  console,
  exports: sandboxModule.exports,
  module: sandboxModule,
  require,
}, { filename: sourcePath });

const { calculateCandlestickPatterns } = sandboxModule.exports;

const presentationSourcePath = path.join(__dirname, "..", "components/technical-analysis/config/indicators/candlestickPatternPresentation.ts");
const presentationSource = fs.readFileSync(presentationSourcePath, "utf8");
const presentationTranspiled = ts.transpileModule(presentationSource, {
  compilerOptions: {
    esModuleInterop: true,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
});
const presentationModule = { exports: {} };

vm.runInNewContext(presentationTranspiled.outputText, {
  console,
  exports: presentationModule.exports,
  module: presentationModule,
  require,
}, { filename: presentationSourcePath });

const {
  CANDLESTICK_PATTERN_PRIORITY,
  buildCandlestickPatternSignalSummary,
  getCandlestickPatternPresentation,
} = presentationModule.exports;

const baseBar = (day) => ({
  time: `2026-01-${String(day).padStart(2, "0")}T00:00:00.000Z`,
  open: 100,
  high: 102,
  low: 98,
  close: 101,
  volume: 1_000,
  tradesCount: 12,
});

const buildSeries = (lastBar) => [
  ...Array.from({ length: 10 }, (_, index) => baseBar(index + 1)),
  { time: "2026-01-11T00:00:00.000Z", volume: 1_000, tradesCount: 12, ...lastBar },
];

const runLast = (lastBar) => calculateCandlestickPatterns(buildSeries(lastBar), { requireVolumeForPattern: true });
const runBrvmLast = (lastBar) => calculateCandlestickPatterns(buildSeries(lastBar));
const last = (series) => series[series.length - 1];

assert.equal(last(runLast({ open: 98.2, high: 98.8, low: 95, close: 98.6 }).hammer), 100, "Hammer shape must be detected");
assert.equal(last(runLast({ open: 101.3, high: 101.9, low: 98, close: 101.7 }).hangingMan), -100, "Hanging Man shape must be detected");
assert.equal(last(runLast({ open: 100, high: 100.3, low: 98, close: 100.2 }).takuri), 100, "Takuri must be detected as an extreme lower rejection");
assert.equal(last(runLast({ open: 99, high: 102, low: 98.9, close: 99.4 }).invertedHammer), 100, "Inverted Hammer must enforce real-body gap down");
assert.equal(last(runLast({ open: 101.3, high: 105, low: 101.2, close: 101.7 }).shootingStar), -100, "Shooting Star must enforce real-body gap up");
assert.equal(last(runLast({ open: 100, high: 102.1, low: 99.9, close: 102 }).marubozuBull), 100, "Bull Marubozu must require long body and short shadows");
assert.equal(last(runLast({ open: 102, high: 102.1, low: 99.9, close: 100 }).marubozuBear), -100, "Bear Marubozu must require long body and short shadows");
assert.equal(last(runLast({ open: 100, high: 102, low: 98, close: 100.5 }).spinningTop), 100, "Spinning Top must mark indecision with candle color sign");

const noVolume = runLast({ open: 98.2, high: 98.8, low: 95, close: 98.6, volume: 0, tradesCount: 12 });
assert.equal(last(noVolume.hammer), "-", "Volume zero sessions must not emit a pattern score");
assert.equal(last(noVolume.noTradeSession), 1, "Volume zero sessions must expose noTradeSession quality");

const noTrades = runLast({ open: 98.2, high: 98.8, low: 95, close: 98.6, volume: 1_000, tradesCount: 0 });
assert.equal(last(noTrades.hammer), "-", "tradesCount zero sessions must not emit a pattern score");
assert.equal(last(noTrades.noTradeSession), 1, "tradesCount zero sessions must expose noTradeSession quality");

const withTrades = runLast({ open: 98.2, high: 98.8, low: 95, close: 98.6, volume: 1_000, tradesCount: 8 });
assert.equal(last(withTrades.hammer), 100, "Positive tradesCount must allow pattern computation");

const brvmSparseVolume = runBrvmLast({ open: 100, high: 102, low: 98, close: 100.5, volume: 0, tradesCount: 0 });
assert.equal(last(brvmSparseVolume.spinningTop), 100, "BRVM sparse sessions must still allow OHLC-only Spinning Top detection by default");
assert.equal(last(brvmSparseVolume.noTradeSession), 1, "BRVM sparse sessions must keep a quality flag without blocking OHLC patterns");

const brvmMissingVolume = runBrvmLast({ open: 100, high: 102, low: 98, close: 100.5, volume: undefined, tradesCount: undefined });
assert.equal(last(brvmMissingVolume.spinningTop), 100, "Missing volume/trade count must not block OHLC-only candlestick patterns");
assert.equal(last(brvmMissingVolume.noTradeSession), 0, "Missing volume is unknown liquidity, not proof of a no-trade session");

const invalidOhlc = runLast({ open: 100, high: 98, low: 101, close: 100.5 });
assert.equal(last(invalidOhlc.hammer), "-", "Invalid OHLC must not emit a pattern score");
assert.equal(last(invalidOhlc.invalidOHLC), 1, "Invalid OHLC must expose invalidOHLC quality");

const exclusionCheck = runLast({ open: 100, high: 103.2, low: 99.8, close: 103 });
assert.equal(last(exclusionCheck.bodyShortAvg), 1, "Adaptive averages must exclude the current candle");
assert.equal(last(exclusionCheck.bodyLongAvg), 1, "Long body average must exclude the current candle");

const spinningTopPresentation = getCandlestickPatternPresentation("spinningTop");
assert.equal(spinningTopPresentation.markerId, "spinning-top-marker", "Spinning Top marker id must keep Object Tree visibility binding");
assert.equal(spinningTopPresentation.legendName, "Spinning Top", "Spinning Top must no longer render as a generic candlestick legend");
assert.equal(spinningTopPresentation.shortLabel, "ST", "Spinning Top must keep a compact summary label");
assert.equal(spinningTopPresentation.chartLabel, "ST", "Spinning Top must render the ST chart label shown by trader tools");
assert.equal(spinningTopPresentation.showChartLabel, true, "Spinning Top must show a plain TradingView-style ST text label");
assert.equal(spinningTopPresentation.labelBackgroundColor, "transparent", "Spinning Top label must not render as a yellow badge");
assert.equal(spinningTopPresentation.labelTextColor, "#818cf8", "Spinning Top label must use the blue-violet text convention");
assert.equal(spinningTopPresentation.labelBorderWidth, 0, "Spinning Top label must not draw a pill border");
assert.equal(spinningTopPresentation.verticalBandColor, "rgba(148, 163, 184, 0.10)", "Spinning Top must expose a subtle vertical focus band color");
assert.equal(spinningTopPresentation.verticalBandWidthRatio, 0.62, "Spinning Top vertical band must stay narrower than a full candle slot");
assert.equal(spinningTopPresentation.verticalBandZ, 1, "Spinning Top vertical band must render behind candle and marker layers");
assert.equal(spinningTopPresentation.symbol.startsWith("path://"), true, "Spinning Top marker must render as a small plus/cross shape");
assert.equal(spinningTopPresentation.symbolSize, 5, "Spinning Top marker must stay visually subordinate to candle bodies");
assert.equal(spinningTopPresentation.symbolOffset[0], 0, "Spinning Top marker must remain horizontally attached to its candle");
assert.equal(spinningTopPresentation.symbolOffset[1], -2, "Spinning Top marker must stay close to the bar like an aboveBar marker");
assert.equal(spinningTopPresentation.position, "above", "Spinning Top marker must stay off the candle body");
assert.ok(CANDLESTICK_PATTERN_PRIORITY.indexOf("spinningTop") < CANDLESTICK_PATTERN_PRIORITY.indexOf("doji"), "Spinning Top must outrank generic Doji rendering");
assert.equal(
  buildCandlestickPatternSignalSummary([{ legendName: "Spinning Top", shortLabel: "ST", count: 3 }]),
  "Patterns chandeliers: ST Spinning Top: 3 signaux",
  "Candlestick summary must explain rendered Spinning Top signals",
);
assert.equal(buildCandlestickPatternSignalSummary([{ legendName: "Spinning Top", shortLabel: "ST", count: 0 }]), null, "Candlestick summary must stay hidden without rendered signals");

console.log("Candlestick pattern tests passed");
