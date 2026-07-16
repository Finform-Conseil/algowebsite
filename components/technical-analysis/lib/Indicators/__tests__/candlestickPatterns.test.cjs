/* eslint-env node */
const assert = require("node:assert/strict");
const test = require("node:test");

require("../../../store/__tests__/testTypeScriptLoader.cjs");

const { calculateCandlestickPatterns } = require("../TechnicalIndicators.ts");

const bar = (index, open, high, low, close, volume = 1000) => ({
  time: `2026-01-${String(index + 1).padStart(2, "0")}`,
  open,
  high,
  low,
  close,
  volume,
  tradesCount: 12,
});

const seedTrend = (direction, count = 25) => Array.from({ length: count }, (_, index) => {
  const base = direction === "up" ? 90 + index : 140 - index;
  return direction === "up"
    ? bar(index, base - 0.4, base + 1, base - 1, base + 0.4)
    : bar(index, base + 0.4, base + 1, base - 1, base - 0.4);
});

const evaluate = (data, options = {}) => calculateCandlestickPatterns(data, {
  requireVolumeForPattern: false,
  tickSize: 0.05,
  ...options,
});

test("two-candle candlestick patterns emit TA-Lib-compatible shape scores", () => {
  const bullishEngulfingData = [
    ...seedTrend("down"),
    bar(25, 110, 111, 99, 100),
    bar(26, 99, 112, 98, 111),
  ];
  const bullishEngulfing = evaluate(bullishEngulfingData);
  assert.equal(bullishEngulfing.engulfingBullish[26], 100);
  assert.equal(bullishEngulfing.engulfingBullishConfirmed[26], 1);

  const bearishEngulfingData = [
    ...seedTrend("up"),
    bar(25, 100, 111, 99, 110),
    bar(26, 111, 112, 98, 99),
  ];
  const bearishEngulfing = evaluate(bearishEngulfingData);
  assert.equal(bearishEngulfing.engulfingBearish[26], -100);
  assert.equal(bearishEngulfing.engulfingBearishConfirmed[26], 1);
});

test("harami patterns require a long first body and a contained short second body", () => {
  const bullishHaramiData = [
    ...seedTrend("down"),
    bar(25, 110, 111, 99, 100),
    bar(26, 103, 105, 102, 104),
  ];
  const bullishHarami = evaluate(bullishHaramiData);
  assert.equal(bullishHarami.haramiBullish[26], 100);
  assert.equal(bullishHarami.haramiBullishConfirmed[26], 1);

  const bearishHaramiData = [
    ...seedTrend("up"),
    bar(25, 100, 111, 99, 110),
    bar(26, 107, 108, 105, 106),
  ];
  const bearishHarami = evaluate(bearishHaramiData);
  assert.equal(bearishHarami.haramiBearish[26], -100);
  assert.equal(bearishHarami.haramiBearishConfirmed[26], 1);
});

test("tweezer patterns use effective equality tolerance including tick size", () => {
  const tweezerTopData = [
    ...seedTrend("up"),
    bar(25, 100, 110, 99, 108),
    bar(26, 108.5, 110.04, 104, 105),
  ];
  const tweezerTop = evaluate(tweezerTopData, { equalFactor: 0.001 });
  assert.equal(tweezerTop.tweezerTop[26], -100);
  assert.equal(tweezerTop.tweezerTopConfirmed[26], 1);
  assert.equal(tweezerTop.equalTolerance[26], 0.05);

  const tweezerBottomData = [
    ...seedTrend("down"),
    bar(25, 110, 111, 100, 102),
    bar(26, 102, 106, 99.96, 105),
  ];
  const tweezerBottom = evaluate(tweezerBottomData, { equalFactor: 0.001 });
  assert.equal(tweezerBottom.tweezerBottom[26], 100);
  assert.equal(tweezerBottom.tweezerBottomConfirmed[26], 1);
  assert.equal(tweezerBottom.equalTolerance[26], 0.05);
});

test("piercing line and dark cloud cover apply midpoint penetration rules", () => {
  const piercingLineData = [
    ...seedTrend("down"),
    bar(25, 110, 111, 99, 100),
    bar(26, 98, 108, 97, 106),
  ];
  const piercingLine = evaluate(piercingLineData);
  assert.equal(piercingLine.piercingLine[26], 100);
  assert.equal(piercingLine.piercingLineConfirmed[26], 1);

  const darkCloudData = [
    ...seedTrend("up"),
    bar(25, 100, 111, 99, 110),
    bar(26, 112, 113, 102, 104),
  ];
  const darkCloud = evaluate(darkCloudData);
  assert.equal(darkCloud.darkCloudCover[26], -100);
  assert.equal(darkCloud.darkCloudCoverConfirmed[26], 1);
});

test("classic reversal patterns expose session-compatible signals when strict gaps are absent", () => {
  const piercingLineNoGapData = [
    ...seedTrend("down"),
    bar(25, 110, 111, 99, 100),
    bar(26, 100, 108, 99, 106),
  ];
  const piercingLineNoGap = evaluate(piercingLineNoGapData);
  assert.equal(piercingLineNoGap.piercingLine[26], 80);
  assert.equal(piercingLineNoGap.piercingLineConfirmed[26], 1);

  const darkCloudNoGapData = [
    ...seedTrend("up"),
    bar(25, 100, 111, 99, 110),
    bar(26, 110, 111, 102, 104),
  ];
  const darkCloudNoGap = evaluate(darkCloudNoGapData);
  assert.equal(darkCloudNoGap.darkCloudCover[26], -80);
  assert.equal(darkCloudNoGap.darkCloudCoverConfirmed[26], 1);
});

test("continuation and confrontation patterns emit directional scores", () => {
  const upsideTasukiData = [
    ...seedTrend("up"),
    bar(25, 100, 108.1, 99, 108),
    bar(26, 110, 116.1, 109, 116),
    bar(27, 115, 115.5, 108.5, 109),
  ];
  const upsideTasuki = evaluate(upsideTasukiData);
  assert.equal(upsideTasuki.tasukiGap[27], 100);
  assert.equal(upsideTasuki.tasukiGapConfirmed[27], 1);

  const downsideTasukiData = [
    ...seedTrend("down"),
    bar(25, 108, 109, 99.9, 100),
    bar(26, 96, 97, 89.9, 90),
    bar(27, 91, 97.5, 90.5, 97),
  ];
  const downsideTasuki = evaluate(downsideTasukiData);
  assert.equal(downsideTasuki.tasukiGap[27], -100);
  assert.equal(downsideTasuki.tasukiGapConfirmed[27], 1);

  const separatingData = [
    ...seedTrend("up"),
    bar(25, 120, 121, 114, 115),
    bar(26, 120.02, 129, 119, 128),
  ];
  const separating = evaluate(separatingData);
  assert.equal(separating.separatingLines[26], 100);
  assert.equal(separating.separatingLinesConfirmed[26], 1);

  const thrustingData = [
    ...seedTrend("down"),
    bar(25, 110, 111, 99, 100),
    bar(26, 98, 105, 97, 104),
  ];
  const thrusting = evaluate(thrustingData);
  assert.equal(thrusting.thrusting[26], -100);
  assert.equal(thrusting.thrustingConfirmed[26], 1);

  const counterattackData = [
    ...seedTrend("down"),
    bar(25, 110, 111, 99, 100),
    bar(26, 94, 101, 93, 100.02),
  ];
  const counterattack = evaluate(counterattackData);
  assert.equal(counterattack.counterattack[26], 100);
  assert.equal(counterattack.counterattackConfirmed[26], 1);
});

test("star reversal patterns apply three-candle penetration rules", () => {
  const morningStarData = [
    ...seedTrend("down"),
    bar(25, 110, 111, 99, 100),
    bar(26, 98.5, 99, 98, 98.8),
    bar(27, 99, 107, 98.5, 106),
  ];
  const morningStar = evaluate(morningStarData);
  assert.equal(morningStar.morningStar[27], 100);
  assert.equal(morningStar.morningStarConfirmed[27], 1);

  const eveningStarData = [
    ...seedTrend("up"),
    bar(25, 100, 111, 99, 110),
    bar(26, 112, 112.8, 111.8, 112.5),
    bar(27, 112, 112.5, 103, 104),
  ];
  const eveningStar = evaluate(eveningStarData);
  assert.equal(eveningStar.eveningStar[27], -100);
  assert.equal(eveningStar.eveningStarConfirmed[27], 1);
});

test("directional impulse patterns require structured three-candle sequences", () => {
  const soldiersData = [
    ...seedTrend("down"),
    bar(25, 100, 106.1, 99, 106),
    bar(26, 102, 109.1, 101, 109),
    bar(27, 105, 112.1, 104, 112),
  ];
  const soldiers = evaluate(soldiersData);
  assert.equal(soldiers.threeWhiteSoldiers[27], 100);
  assert.equal(soldiers.threeWhiteSoldiersConfirmed[27], 1);

  const crowsData = [
    ...seedTrend("up"),
    bar(25, 110, 119, 109, 118),
    bar(26, 117, 118, 111.95, 112),
    bar(27, 115, 116, 107.95, 108),
    bar(28, 111, 112, 103.95, 104),
  ];
  const crows = evaluate(crowsData);
  assert.equal(crows.threeBlackCrows[28], -100);
  assert.equal(crows.threeBlackCrowsConfirmed[28], 1);
});

test("three inside patterns confirm harami reversals on the third candle", () => {
  const threeInsideUpData = [
    ...seedTrend("down"),
    bar(25, 110, 111, 99, 100),
    bar(26, 103, 105, 102, 104),
    bar(27, 104, 112, 103, 111),
  ];
  const threeInsideUp = evaluate(threeInsideUpData);
  assert.equal(threeInsideUp.threeInsideUp[27], 100);
  assert.equal(threeInsideUp.threeInsideUpConfirmed[27], 1);

  const threeInsideDownData = [
    ...seedTrend("up"),
    bar(25, 100, 111, 99, 110),
    bar(26, 108.8, 109, 108, 108.1),
    bar(27, 106, 107, 98, 99),
  ];
  const threeInsideDown = evaluate(threeInsideDownData);
  assert.equal(threeInsideDown.threeInsideDown[27], -100);
  assert.equal(threeInsideDown.threeInsideDownConfirmed[27], 1);
});

test("rare three-candle patterns emit directional scores and trend confirmations", () => {
  const uniqueThreeRiverData = [
    ...seedTrend("down"),
    bar(25, 110, 111, 99, 100),
    bar(26, 105, 106, 94, 98),
    bar(27, 96, 97, 95, 96.5),
  ];
  const uniqueThreeRiver = evaluate(uniqueThreeRiverData);
  assert.equal(uniqueThreeRiver.uniqueThreeRiver[27], 100);
  assert.equal(uniqueThreeRiver.uniqueThreeRiverConfirmed[27], 1);

  const upsideGapTwoCrowsData = [
    ...seedTrend("up"),
    bar(25, 100, 111, 99, 110),
    bar(26, 112, 113, 111, 111.5),
    bar(27, 113, 114, 110.2, 111),
  ];
  const upsideGapTwoCrows = evaluate(upsideGapTwoCrowsData);
  assert.equal(upsideGapTwoCrows.upsideGapTwoCrows[27], -100);
  assert.equal(upsideGapTwoCrows.upsideGapTwoCrowsConfirmed[27], 1);
});

test("kicker patterns require opposite long marubozu bodies separated by a real-body gap", () => {
  const kickerBullData = [
    ...seedTrend("down"),
    bar(25, 110, 110.04, 99.98, 100),
    bar(26, 112, 122.02, 111.98, 122),
  ];
  const kickerBull = evaluate(kickerBullData);
  assert.equal(kickerBull.kickerBull[26], 100);
  assert.equal(kickerBull.kickerBullConfirmed[26], 1);

  const kickerBearData = [
    ...seedTrend("up"),
    bar(25, 100, 110.02, 99.98, 110),
    bar(26, 98, 98.02, 87.98, 88),
  ];
  const kickerBear = evaluate(kickerBearData);
  assert.equal(kickerBear.kickerBear[26], -100);
  assert.equal(kickerBear.kickerBearConfirmed[26], 1);
});

test("abandoned baby patterns isolate a doji by gaps before penetration", () => {
  const abandonedBabyBullData = [
    ...seedTrend("down"),
    bar(25, 110, 111, 100, 100),
    bar(26, 98, 98.4, 97.6, 98.02),
    bar(27, 99, 104, 98.5, 103.5),
  ];
  const abandonedBabyBull = evaluate(abandonedBabyBullData);
  assert.equal(abandonedBabyBull.abandonedBabyBull[27], 100);
  assert.equal(abandonedBabyBull.abandonedBabyBullConfirmed[27], 1);

  const abandonedBabyBearData = [
    ...seedTrend("up"),
    bar(25, 100, 110, 99, 110),
    bar(26, 112, 112.4, 111.6, 111.98),
    bar(27, 111, 111.5, 105, 106.5),
  ];
  const abandonedBabyBear = evaluate(abandonedBabyBearData);
  assert.equal(abandonedBabyBear.abandonedBabyBear[27], -100);
  assert.equal(abandonedBabyBear.abandonedBabyBearConfirmed[27], 1);
});

test("belt hold patterns use a single long directional candle opened near an extreme", () => {
  const beltHoldBullData = [
    ...seedTrend("down"),
    bar(25, 100, 111, 100, 110),
  ];
  const beltHoldBull = evaluate(beltHoldBullData);
  assert.equal(beltHoldBull.beltHoldBull[25], 100);
  assert.equal(beltHoldBull.beltHoldBullConfirmed[25], 1);

  const beltHoldBearData = [
    ...seedTrend("up"),
    bar(25, 110, 110, 99, 100),
  ];
  const beltHoldBear = evaluate(beltHoldBearData);
  assert.equal(beltHoldBear.beltHoldBear[25], -100);
  assert.equal(beltHoldBear.beltHoldBearConfirmed[25], 1);
});

test("breakaway patterns span five candles and reverse before fully erasing the gap", () => {
  const breakawayBullData = [
    ...seedTrend("down"),
    bar(25, 110, 111, 100, 100),
    bar(26, 98, 99, 93, 94),
    bar(27, 94, 95, 90, 91),
    bar(28, 91, 92, 86, 88),
    bar(29, 88, 105, 87, 100),
  ];
  const breakawayBull = evaluate(breakawayBullData);
  assert.equal(breakawayBull.breakawayBull[29], 100);
  assert.equal(breakawayBull.breakawayBullConfirmed[29], 1);

  const breakawayBearData = [
    ...seedTrend("up"),
    bar(25, 100, 111, 99, 110),
    bar(26, 112, 116, 111, 116),
    bar(27, 116, 120, 115, 119),
    bar(28, 119, 123, 118, 122),
    bar(29, 122, 123, 107, 108),
  ];
  const breakawayBear = evaluate(breakawayBearData);
  assert.equal(breakawayBear.breakawayBear[29], -100);
  assert.equal(breakawayBear.breakawayBearConfirmed[29], 1);
});

test("three methods continuation patterns span five candles with trend confirmation", () => {
  const risingData = [
    ...seedTrend("up"),
    bar(25, 115, 126, 114, 125),
    bar(26, 124.8, 125, 124, 124.2),
    bar(27, 124.1, 124.3, 123.4, 123.6),
    bar(28, 123.5, 123.7, 122.8, 123),
    bar(29, 123.2, 127, 122.8, 126.5),
  ];
  const rising = evaluate(risingData);
  assert.equal(rising.risingThreeMethods[29], 100);
  assert.equal(rising.risingThreeMethodsConfirmed[29], 1);

  const fallingData = [
    ...seedTrend("down"),
    bar(25, 115, 116, 104, 105),
    bar(26, 105.2, 106, 105, 105.8),
    bar(27, 105.9, 106.6, 105.7, 106.4),
    bar(28, 106.5, 107.2, 106.2, 107),
    bar(29, 106.8, 107, 103, 103.5),
  ];
  const falling = evaluate(fallingData);
  assert.equal(falling.fallingThreeMethods[29], -100);
  assert.equal(falling.fallingThreeMethodsConfirmed[29], 1);
});

test("mat hold detects a bullish gap followed by controlled consolidation", () => {
  const data = [
    ...seedTrend("up"),
    bar(25, 116, 127, 115, 126),
    bar(26, 128, 128.5, 127.2, 127.4),
    bar(27, 125.8, 126.1, 125, 125.2),
    bar(28, 125, 125.2, 124.2, 124.5),
    bar(29, 125, 129.5, 124.8, 129),
  ];
  const result = evaluate(data);
  assert.equal(result.matHold[29], 100);
  assert.equal(result.matHoldConfirmed[29], 1);
});

test("gap side-by-side white emits signed bullish and bearish gap scores", () => {
  const bullishData = [
    ...seedTrend("up"),
    bar(25, 100, 111, 99, 110),
    bar(26, 112, 114, 111.5, 113.5),
    bar(27, 112.02, 114, 111.7, 113.42),
  ];
  const bullish = evaluate(bullishData);
  assert.equal(bullish.gapSideBySideWhite[27], 100);
  assert.equal(bullish.gapSideBySideWhiteConfirmed[27], 1);

  const bearishData = [
    ...seedTrend("down"),
    bar(25, 110, 111, 99, 100),
    bar(26, 95, 96.5, 94.8, 96),
    bar(27, 95.02, 96.4, 94.9, 96.05),
  ];
  const bearish = evaluate(bearishData);
  assert.equal(bearish.gapSideBySideWhite[27], -100);
  assert.equal(bearish.gapSideBySideWhiteConfirmed[27], 1);
});

test("hikkake emits initial false-break scores and later confirmed scores", () => {
  const bullishData = [
    ...seedTrend("down"),
    bar(25, 104, 110, 100, 106),
    bar(26, 103, 108, 102, 107),
    bar(27, 106, 107, 101, 103),
    bar(28, 103, 107.5, 102.5, 107),
    bar(29, 107, 109.5, 106.5, 109),
  ];
  const bullish = evaluate(bullishData);
  assert.equal(bullish.hikkake[27], 100);
  assert.equal(bullish.hikkakeConfirmed[27], 0);
  assert.equal(bullish.hikkake[29], 200);
  assert.equal(bullish.hikkakeConfirmed[29], 1);

  const bearishData = [
    ...seedTrend("up"),
    bar(25, 106, 110, 100, 104),
    bar(26, 107, 108, 102, 103),
    bar(27, 103, 109, 103, 107),
    bar(28, 107, 107.5, 100.5, 101),
  ];
  const bearish = evaluate(bearishData);
  assert.equal(bearish.hikkake[27], -100);
  assert.equal(bearish.hikkakeConfirmed[27], 0);
  assert.equal(bearish.hikkake[28], -200);
  assert.equal(bearish.hikkakeConfirmed[28], 1);
});

test("concealing baby swallow, ladder bottom and stick sandwich emit rare bullish reversal scores", () => {
  const concealingData = [
    ...seedTrend("down"),
    bar(25, 110, 110, 100, 100),
    bar(26, 99, 99, 90, 90),
    bar(27, 88, 91, 85, 86),
    bar(28, 91, 92, 83, 84),
  ];
  const concealing = evaluate(concealingData);
  assert.equal(concealing.concealingBabySwallow[28], 100);
  assert.equal(concealing.concealingBabySwallowConfirmed[28], 1);

  const ladderData = [
    ...seedTrend("down"),
    bar(25, 120, 121, 109, 110),
    bar(26, 109, 110, 99, 100),
    bar(27, 99, 100, 91, 92),
    bar(28, 91, 96, 87, 88),
    bar(29, 92, 98, 91, 97),
  ];
  const ladder = evaluate(ladderData);
  assert.equal(ladder.ladderBottom[29], 100);
  assert.equal(ladder.ladderBottomConfirmed[29], 1);

  const sandwichData = [
    ...seedTrend("down"),
    bar(25, 110, 111, 99, 100),
    bar(26, 102, 107, 101, 106),
    bar(27, 105, 106, 99.8, 100.02),
  ];
  const sandwich = evaluate(sandwichData);
  assert.equal(sandwich.stickSandwich[27], 100);
  assert.equal(sandwich.stickSandwichConfirmed[27], 1);
});

test("BOAB 2018-01-05 emits Ladder Bottom BRVM without polluting strict mode", () => {
  const boabWindow = [
    ...seedTrend("down"),
    { time: "2017-12-29", open: 3623, high: 3748, low: 3623, close: 3723, volume: 1015, tradesCount: 12 },
    { time: "2018-01-02", open: 3598, high: 3598, low: 3548, close: 3595, volume: 787, tradesCount: 12 },
    { time: "2018-01-03", open: 3593, high: 3595, low: 3548, close: 3548, volume: 4415, tradesCount: 12 },
    { time: "2018-01-04", open: 3550, high: 3573, low: 3548, close: 3548, volume: 13138, tradesCount: 12 },
    { time: "2018-01-05", open: 3548, high: 3573, low: 3548, close: 3573, volume: 1489, tradesCount: 12 },
  ];
  const result = evaluate(boabWindow);
  const signalIndex = boabWindow.length - 1;

  assert.equal(result.ladderBottom[signalIndex], 0);
  assert.equal(result.ladderBottomConfirmed[signalIndex], 0);
  assert.equal(result.ladderBottomBrvm[signalIndex], 80);
  assert.equal(result.ladderBottomBrvmConfirmed[signalIndex], 0);
});

test("invalid OHLC keeps pattern values non-computable instead of false positives", () => {
  const invalidData = [
    ...seedTrend("up"),
    bar(25, 100, 111, 99, 110),
    bar(26, 112, 100, 102, 104),
  ];
  const result = evaluate(invalidData);
  assert.equal(result.invalidOHLC[26], 1);
  assert.equal(result.darkCloudCover[26], "-");
  assert.equal(result.darkCloudCoverConfirmed[26], "-");
});
