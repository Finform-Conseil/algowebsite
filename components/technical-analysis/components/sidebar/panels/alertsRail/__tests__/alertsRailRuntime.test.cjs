/* eslint-env node */
require("../../../../../store/__tests__/testTypeScriptLoader.cjs");

const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const { evaluateAlert } = require("../alertsRailEngine.ts");
const { alertsRailReducer, createInitialState, isAlertExpired } = require("../alertsRailReducer.ts");
const { validateDraft } = require("../alertsRailValidation.ts");
const { isBrvmBusinessDay } = require("../../../../../utils/brvmMarketSession.ts");
const { getIndicatorRuntimeAlertKeyForInventoryId } = require("../../../../../config/indicators/indicatorRuntimeAlertCatalog.ts");
const indicatorBacktestAlertPolicy = require("../../../../../config/indicators/indicatorBacktestAlertPolicy.ts");
const indicatorResearchGradePolicy = require("../../../../../config/indicators/indicatorResearchGradePolicy.ts");
const { getMissingRuntimeIndicatorExtractorKeys } = require("../alertsRailIndicatorMetricExtractors.ts");
const { buildIndicatorAlertValuesFromSeries } = require("../alertsRailIndicatorMetrics.ts");
const { buildDailyAlertContext, buildLiveAlertContext } = require("../alertsRailLiveContexts.ts");
const { shouldSurfaceAlert } = require("../alertsRailNotifications.ts");
const {
  buildAlertsSnapshotSyncKey,
  buildAlertsSyncMessage,
  isAlertsSyncMessageFromPeer,
  sanitizeAlertsSyncMessage,
  sanitizeSnapshot,
} = require("../alertsRailStorage.ts");
const { buildSupplementalTickerKey, mergeTriggerContexts } = require("../useAlertsRailRuntime.ts");

const makeContext = (ticker, currentPrice, overrides = {}) => ({
  changeLabel: "+0,00%",
  changePercent: 0,
  changeTone: "neutral",
  currentPrice,
  defaultThreshold: currentPrice === null ? "" : String(currentPrice),
  dividendLabel: "Aucun dividende",
  hasDividend: false,
  hasNews: false,
  marketLabel: "BRVM · UEMOA",
  name: ticker,
  newsLabel: "Flux calme",
  priceLabel: currentPrice === null ? "N/D" : `${currentPrice} XOF`,
  sessionLabel: "Snapshot",
  ticker,
  volumeLabel: "N/D",
  volumeRatio: null,
  ...overrides,
});

const makeAlert = (overrides = {}) => ({
  channel: "interface",
  condition: "price_crossing",
  createdAt: "2026-06-10T08:00:00.000Z",
  expiration: "none",
  id: "alert-1",
  indicator: null,
  lastObservedValue: 8700,
  lastTriggeredAt: null,
  lastTriggeredSignature: null,
  lastTriggeredValue: null,
  message: "BOAB Crossing 8 750",
  status: "active",
  threshold: 8750,
  ticker: "BOAB",
  type: "price",
  updatedAt: "2026-06-10T08:00:00.000Z",
  ...overrides,
});

const makeLog = (overrides = {}) => ({
  alertId: "alert-1",
  createdAt: "2026-06-10T12:00:00.000Z",
  id: "log-1",
  kind: "triggered",
  message: "BOAB Crossing 8 750",
  ticker: "BOAB",
  ...overrides,
});

const makeDailySeries = (count = 60) => Array.from({ length: count }, (_, index) => {
  const close = 100 + index + (index > count - 8 ? index - (count - 8) : 0);
  return {
    close,
    high: close + 1,
    low: close - 1,
    open: close - 0.5,
    time: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
    volume: 1000 + index * 10,
  };
});

const makeIndicatorDailySeries = (count = 320) => Array.from({ length: count }, (_, index) => {
  const wave = Math.sin(index / 5) * 7 + Math.cos(index / 13) * 4;
  const close = 100 + index * 0.22 + wave;
  const open = close - Math.sin(index / 3) * 1.4;
  return {
    close,
    high: Math.max(open, close) + 1.2 + (index % 5) * 0.07,
    low: Math.min(open, close) - 1.1 - (index % 3) * 0.06,
    open,
    time: new Date(Date.UTC(2025, 0, index + 1)).toISOString(),
    volume: 1000 + index * 11 + (index % 9) * 31,
  };
});

describe("alerts rail engine", () => {
  it("detects a real crossing from previous value to current value", () => {
    const matched = evaluateAlert(makeAlert({ lastObservedValue: 8700 }), makeContext("BOAB", 8760));
    const notMatched = evaluateAlert(makeAlert({ lastObservedValue: 8725 }), makeContext("BOAB", 8740));

    assert.equal(matched.matched, true);
    assert.equal(matched.observedValue, 8760);
    assert.equal(notMatched.matched, false);
    assert.equal(notMatched.observedValue, 8740);
  });

  it("evaluates indicator threshold crossings from runtime indicator values", () => {
    const matched = evaluateAlert(
      makeAlert({
        condition: "indicator_cross_above",
        indicator: { key: "technical:rsi14", label: "RSI 14", source: "sidebar-technicals", timeframe: "1D" },
        lastObservedValue: 47,
        message: "BOAB - RSI 14 croise 50",
        threshold: 50,
        type: "indicator",
      }),
      makeContext("BOAB", 8700, {
        indicatorValuesByKey: {
          "technical:rsi14": { key: "technical:rsi14", label: "RSI 14", previousValue: 49, value: 51 },
        },
      }),
    );
    const stale = evaluateAlert(
      makeAlert({
        condition: "indicator_cross_above",
        indicator: { key: "technical:rsi14", label: "RSI 14" },
        lastObservedValue: 51,
        threshold: 50,
        type: "indicator",
      }),
      makeContext("BOAB", 8700, {
        indicatorValuesByKey: {
          "technical:rsi14": { key: "technical:rsi14", label: "RSI 14", previousValue: 51, value: 52 },
        },
      }),
    );

    assert.equal(matched.matched, true);
    assert.equal(matched.observedValue, 51);
    assert.match(matched.metricLabel, /RSI 14/);
    assert.equal(stale.matched, false);
  });
});

describe("alerts rail reducer", () => {
  it("triggers an alert for another ticker when that ticker has a live context", () => {
    const initial = createInitialState(makeContext("SNTS", 28200));
    const state = {
      ...initial,
      alerts: [makeAlert()],
      currentTicker: "SNTS",
      logs: [],
    };

    const next = alertsRailReducer(state, {
      contextsByTicker: {
        BOAB: makeContext("BOAB", 8760),
        SNTS: makeContext("SNTS", 28200),
      },
      now: "2026-06-10T12:00:00.000Z",
      type: "trigger_alerts",
    });

    assert.equal(next.alerts[0].ticker, "BOAB");
    assert.equal(next.alerts[0].status, "triggered");
    assert.equal(next.alerts[0].lastTriggeredValue, 8760);
    assert.equal(next.logs[0].kind, "triggered");
  });

  it("triggers an indicator alert using runtime indicator values", () => {
    const initial = createInitialState(makeContext("BOAB", 8700));
    const state = {
      ...initial,
      alerts: [makeAlert({
        condition: "indicator_above",
        indicator: { key: "technical:rsi14", label: "RSI 14", source: "sidebar-technicals", timeframe: "1D" },
        lastObservedValue: 49,
        message: "BOAB - RSI 14 au-dessus de 50",
        threshold: 50,
        type: "indicator",
      })],
      logs: [],
    };

    const next = alertsRailReducer(state, {
      contextsByTicker: {
        BOAB: makeContext("BOAB", 8700, {
          indicatorValuesByKey: {
            "technical:rsi14": { key: "technical:rsi14", label: "RSI 14", previousValue: 49, value: 52 },
          },
        }),
      },
      now: "2026-06-10T12:00:00.000Z",
      type: "trigger_alerts",
    });

    assert.equal(next.alerts[0].status, "triggered");
    assert.equal(next.alerts[0].lastTriggeredValue, 52);
    assert.match(next.logs[0].message, /RSI 14/);
  });

  it("creates an indicator alert draft with the current runtime metric target", () => {
    const context = makeContext("BOAB", 8700, {
      indicatorValuesByKey: {
        "technical:rsi14": { key: "technical:rsi14", label: "RSI 14", source: "sidebar-technicals", timeframe: "1D", value: 55.34 },
      },
    });
    let state = createInitialState(context);

    state = alertsRailReducer(state, { type: "update_draft", context, field: "type", value: "indicator" });
    state = alertsRailReducer(state, { type: "update_draft", context, field: "condition", value: "indicator_above" });
    state = alertsRailReducer(state, { type: "update_draft", context, field: "threshold", value: "50" });
    state = alertsRailReducer(state, { type: "submit_draft", context, now: "2026-06-10T12:00:00.000Z" });

    assert.equal(state.alerts[0].type, "indicator");
    assert.equal(state.alerts[0].indicator.key, "technical:rsi14");
    assert.equal(state.alerts[0].lastObservedValue, 55.34);
    assert.equal(state.alerts[0].threshold, 50);
    assert.match(state.alerts[0].message, /RSI 14/);
  });

  it("does not invent a trigger when the alert ticker has no context", () => {
    const initial = createInitialState(makeContext("SNTS", 28200));
    const state = {
      ...initial,
      alerts: [makeAlert()],
      currentTicker: "SNTS",
      logs: [],
    };

    const next = alertsRailReducer(state, {
      contextsByTicker: {
        SNTS: makeContext("SNTS", 28200),
      },
      now: "2026-06-10T12:00:00.000Z",
      type: "trigger_alerts",
    });

    assert.equal(next.alerts[0].status, "active");
    assert.equal(next.logs.length, 0);
  });

  it("expires active alerts and writes an audit log", () => {
    const initial = createInitialState(makeContext("BOAB", 8700));
    const state = {
      ...initial,
      alerts: [makeAlert({ expiration: "next_session" })],
      logs: [],
    };

    const next = alertsRailReducer(state, {
      contextsByTicker: {
        BOAB: makeContext("BOAB", 8760),
      },
      now: "2026-06-10T09:00:00.000Z",
      type: "trigger_alerts",
    });

    assert.equal(next.alerts[0].status, "expired");
    assert.equal(next.logs[0].kind, "expired");
  });
});

describe("alerts rail indicator metrics", () => {
  it("builds current and previous alert indicator values from a daily series", () => {
    const values = buildIndicatorAlertValuesFromSeries(makeDailySeries(), { source: "daily-csv", timeframe: "1D" });

    assert.equal(typeof values["technical:rsi14"].value, "number");
    assert.equal(typeof values["technical:rsi14"].previousValue, "number");
    assert.equal(typeof values["technical:macd_line"].value, "number");
    assert.equal(typeof values["technical:vp_poc"].value, "number");
    assert.equal(values["technical:sma20"].source, "daily-csv");
    assert.equal(values["technical:score"].timeframe, "1D");
  });

  it("computes every runtime-routed indicator alert value from the supplemental daily series", () => {
    const inventory = indicatorResearchGradePolicy.buildIndicatorResearchGradeInventory({
      indicatorPeriods: { sma1: 5, sma2: 10, sma3: 20, rsiPeriod: 14 },
    });
    const values = buildIndicatorAlertValuesFromSeries(makeIndicatorDailySeries(), { source: "daily-csv", timeframe: "1D" }) || {};
    const runtimeEntries = inventory.filter((entry) => (
      indicatorBacktestAlertPolicy.getIndicatorAlertTemplate(entry).route === "indicator-runtime"
    ));
    const missingValues = runtimeEntries
      .filter((entry) => {
        const key = getIndicatorRuntimeAlertKeyForInventoryId(entry.id);
        const value = key ? values[key]?.value : null;
        return typeof value !== "number" || !Number.isFinite(value);
      })
      .map((entry) => entry.id);

    assert.deepEqual(getMissingRuntimeIndicatorExtractorKeys(), []);
    assert.equal(runtimeEntries.length, 105);
    assert.deepEqual(missingValues, []);
  });

  it("builds a fallback daily context for off-screen indicator alert evaluation", () => {
    const context = buildDailyAlertContext("BOAB", makeDailySeries());

    assert.equal(context.ticker, "BOAB");
    assert.equal(context.sessionLabel, "Daily CSV");
    assert.equal(context.currentPrice > 0, true);
    assert.equal(typeof context.volumeRatio, "number");
  });
});

describe("alerts rail runtime context priority", () => {
  it("refreshes active off-screen alert tickers and prefers fresh supplemental contexts", () => {
    const current = makeContext("SNTS", 28250);
    const staleBoab = makeContext("BOAB", 8745);
    const liveBoab = makeContext("BOAB", 8600);

    assert.equal(buildSupplementalTickerKey("BOAB|SNTS", "SNTS"), "BOAB");

    const contexts = mergeTriggerContexts(current, { BOAB: staleBoab, SNTS: makeContext("SNTS", 28100) }, { BOAB: liveBoab });

    assert.equal(contexts.BOAB.currentPrice, 8600);
    assert.equal(contexts.SNTS.currentPrice, 28250);
  });

  it("uses supplemental off-screen indicator values to trigger indicator alerts", () => {
    const current = makeContext("SNTS", 28250);
    const staleBoab = makeContext("BOAB", 8700);
    const indicatorBoab = makeContext("BOAB", 8700, {
      indicatorValuesByKey: {
        "technical:rsi14": { key: "technical:rsi14", label: "RSI 14", previousValue: 49, value: 51 },
      },
    });
    const contexts = mergeTriggerContexts(current, { BOAB: staleBoab }, { BOAB: indicatorBoab });
    const initial = createInitialState(current);
    const state = {
      ...initial,
      alerts: [makeAlert({
        condition: "indicator_cross_above",
        indicator: { key: "technical:rsi14", label: "RSI 14" },
        lastObservedValue: 48,
        message: "BOAB - RSI 14 croise 50",
        threshold: 50,
        type: "indicator",
      })],
      logs: [],
    };

    const next = alertsRailReducer(state, {
      contextsByTicker: contexts,
      now: "2026-06-10T12:00:00.000Z",
      type: "trigger_alerts",
    });

    assert.equal(next.alerts[0].status, "triggered");
    assert.equal(next.alerts[0].lastTriggeredValue, 51);
    assert.match(next.logs[0].message, /RSI 14/);
  });
});

describe("alerts rail expiration", () => {
  it("applies concrete expiration windows", () => {
    assert.equal(
      isAlertExpired(makeAlert({ expiration: "next_session" }), "2026-06-10T08:59:59.000Z"),
      false,
    );
    assert.equal(
      isAlertExpired(makeAlert({ expiration: "next_session" }), "2026-06-10T09:00:00.000Z"),
      true,
    );
    assert.equal(
      isAlertExpired(makeAlert({ createdAt: "2026-06-12T14:00:00.000Z", expiration: "week" }), "2026-06-12T15:00:00.000Z"),
      true,
    );
    assert.equal(
      isAlertExpired(makeAlert({ expiration: "none" }), "2027-06-10T09:00:00.000Z"),
      false,
    );
  });

  it("skips observed BRVM holidays when expiring on the next session", () => {
    assert.equal(isBrvmBusinessDay(new Date("2026-01-01T12:00:00.000Z")), false);
    assert.equal(
      isAlertExpired(
        makeAlert({ createdAt: "2025-12-31T16:00:00.000Z", expiration: "next_session" }),
        "2026-01-01T09:00:00.000Z",
      ),
      false,
    );
    assert.equal(
      isAlertExpired(
        makeAlert({ createdAt: "2025-12-31T16:00:00.000Z", expiration: "next_session" }),
        "2026-01-02T09:00:00.000Z",
      ),
      true,
    );
  });

  it("uses the previous business close when weekly expiration lands on a holiday", () => {
    const alert = makeAlert({ createdAt: "2026-04-30T14:00:00.000Z", expiration: "week" });

    assert.equal(isAlertExpired(alert, "2026-04-30T14:59:59.000Z"), false);
    assert.equal(isAlertExpired(alert, "2026-04-30T15:00:00.000Z"), true);
  });
});

describe("alerts rail validation", () => {
  it("requires an explicit indicator target for indicator drafts", () => {
    const missingTarget = validateDraft({
      channel: "interface",
      condition: "indicator_above",
      expiration: "none",
      id: null,
      indicator: null,
      message: "BOAB - RSI 14 au-dessus de 50",
      messageTouched: true,
      threshold: "50",
      type: "indicator",
    });
    const validTarget = validateDraft({
      channel: "interface",
      condition: "indicator_below",
      expiration: "none",
      id: null,
      indicator: { key: "technical:rsi14", label: "RSI 14" },
      message: "BOAB - RSI 14 sous 30",
      messageTouched: true,
      threshold: "30",
      type: "indicator",
    });

    assert.equal(missingTarget.error, "Indicateur requis");
    assert.equal(validTarget.error, null);
    assert.equal(validTarget.threshold, 30);
  });
});

describe("alerts rail storage", () => {
  it("preserves expired alerts and expired audit entries from IndexedDB snapshots", () => {
    const snapshot = sanitizeSnapshot({
      alerts: [makeAlert({ expiration: "week", status: "expired" })],
      draftOpenByTicker: {},
      draftsByTicker: {},
      logs: [makeLog({ kind: "expired" })],
      soundEnabled: false,
    });

    assert.equal(snapshot.alerts[0].status, "expired");
    assert.equal(snapshot.alerts[0].expiration, "week");
    assert.equal(snapshot.logs[0].kind, "expired");
    assert.equal(snapshot.soundEnabled, false);
  });

  it("preserves valid indicator targets and rejects invalid indicator alerts from snapshots", () => {
    const snapshot = sanitizeSnapshot({
      alerts: [
        makeAlert({
          condition: "indicator_above",
          indicator: { key: "technical:rsi14", label: "RSI 14", source: "sidebar-technicals", timeframe: "1D" },
          threshold: 50,
          type: "indicator",
        }),
        makeAlert({
          condition: "indicator_above",
          id: "bad-indicator-alert",
          indicator: { key: "technical rsi", label: "RSI 14" },
          threshold: 50,
          type: "indicator",
        }),
      ],
      draftOpenByTicker: {},
      draftsByTicker: {
        BOAB: {
          channel: "interface",
          condition: "indicator_above",
          expiration: "none",
          id: null,
          indicator: { key: "technical:rsi14", label: "RSI 14", source: "sidebar-technicals", timeframe: "1D" },
          message: "BOAB - RSI 14 au-dessus de 50",
          messageTouched: true,
          threshold: "50",
          type: "indicator",
        },
      },
      logs: [],
      soundEnabled: true,
    });

    assert.equal(snapshot.alerts.length, 1);
    assert.equal(snapshot.alerts[0].indicator.key, "technical:rsi14");
    assert.equal(snapshot.alerts[0].indicator.label, "RSI 14");
    assert.equal(snapshot.draftsByTicker.BOAB.indicator.key, "technical:rsi14");
  });
});

describe("alerts rail cross-tab sync", () => {
  it("sanitizes peer snapshots and ignores messages from the same tab", () => {
    const snapshot = sanitizeSnapshot({
      alerts: [makeAlert()],
      draftOpenByTicker: { BOAB: true },
      draftsByTicker: {},
      logs: [makeLog()],
      soundEnabled: false,
    });
    const message = buildAlertsSyncMessage("tab-a", snapshot, new Date("2026-06-10T12:30:00.000Z"));
    const sanitized = sanitizeAlertsSyncMessage(message);
    const peer = isAlertsSyncMessageFromPeer(message, "tab-b");

    assert.equal(sanitized.sourceId, "tab-a");
    assert.equal(sanitized.updatedAt, "2026-06-10T12:30:00.000Z");
    assert.equal(isAlertsSyncMessageFromPeer(message, "tab-a"), null);
    assert.equal(peer.snapshot.alerts[0].id, "alert-1");
    assert.equal(peer.snapshot.soundEnabled, false);
    assert.equal(buildAlertsSnapshotSyncKey(peer.snapshot), buildAlertsSnapshotSyncKey(snapshot));
  });
});

describe("alerts rail notification channels", () => {
  it("keeps journal-only alerts silent and surfaces interface/local alerts", () => {
    assert.equal(shouldSurfaceAlert(makeAlert({ channel: "journal" })), false);
    assert.equal(shouldSurfaceAlert(makeAlert({ channel: "interface" })), true);
    assert.equal(shouldSurfaceAlert(makeAlert({ channel: "local" })), true);
  });
});


describe("alerts rail live contexts", () => {
  it("builds an alert context from a live BRVM snapshot", () => {
    const context = buildLiveAlertContext({
      price: 28250,
      source: "BRVM_DIRECT",
      symbol: "SNTS",
      variation: "-0.60%",
      volume: 5058,
    });

    assert.equal(context.ticker, "SNTS");
    assert.equal(context.currentPrice, 28250);
    assert.equal(context.changePercent, -0.6);
    assert.equal(context.sessionLabel, "BRVM_DIRECT");
  });
});
