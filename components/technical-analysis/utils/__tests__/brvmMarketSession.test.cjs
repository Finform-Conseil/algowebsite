/* eslint-env node */
const assert = require("node:assert/strict");
const test = require("node:test");

require("../../store/__tests__/testTypeScriptLoader.cjs");

const {
  BRVM_DISPLAY_TIME_ZONE_LABEL,
  formatBrvmDisplayClock,
  formatBrvmDisplayMinute,
  formatBrvmExchangeClock,
  getBrvmMarketStatus,
  getBrvmPriceAxisCountdown,
} = require("../brvmMarketSession.ts");

const utcMs = (year, month, day, hour, minute = 0, second = 0) =>
  Date.UTC(year, month - 1, day, hour, minute, second);

test("BRVM market status opens only during the weekday UTC session", () => {
  assert.deepEqual(getBrvmMarketStatus(utcMs(2026, 6, 1, 8, 59)), {
    isOpen: false,
    label: "FERMÉ",
    title: "BRVM fermée selon les horaires réguliers UTC",
  });
  assert.equal(getBrvmMarketStatus(utcMs(2026, 6, 1, 9, 0)).isOpen, true);
  assert.equal(getBrvmMarketStatus(utcMs(2026, 6, 1, 14, 59, 59)).isOpen, true);
  assert.equal(getBrvmMarketStatus(utcMs(2026, 6, 1, 15, 0)).isOpen, false);
  assert.equal(getBrvmMarketStatus(utcMs(2026, 6, 6, 10, 0)).isOpen, false);
});

test("price-axis countdown respects opening, candle boundary and daily close", () => {
  assert.deepEqual(getBrvmPriceAxisCountdown("1D", utcMs(2026, 6, 1, 8, 59)), {
    label: "Ouv. 00:01:00",
    accessibilityLabel: "prochaine ouverture BRVM dans",
  });
  assert.deepEqual(getBrvmPriceAxisCountdown("5m", utcMs(2026, 6, 1, 9, 2, 10)), {
    label: "T- 00:02:50",
    accessibilityLabel: "clôture de bougie dans",
  });
  assert.deepEqual(getBrvmPriceAxisCountdown("1D", utcMs(2026, 6, 1, 14, 59, 30)), {
    label: "Clôt. 00:00:30",
    accessibilityLabel: "prochaine clôture daily BRVM dans",
  });
});

test("BRVM display clocks keep UTC exchange time separate from GMT+1 display time", () => {
  const date = new Date(utcMs(2026, 6, 1, 9, 5, 6));

  assert.equal(BRVM_DISPLAY_TIME_ZONE_LABEL, "GMT+1");
  assert.equal(formatBrvmExchangeClock(date), "09:05:06");
  assert.equal(formatBrvmDisplayClock(date), "10:05:06");
  assert.equal(formatBrvmDisplayMinute(date), "10:05");
});
