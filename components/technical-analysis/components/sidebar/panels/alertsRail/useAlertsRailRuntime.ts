import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { buildDefaultDraft } from "./alertsRailDrafts";
import { alertsRailReducer, createInitialState } from "./alertsRailReducer";
import { fetchLiveAlertContexts } from "./alertsRailLiveContexts";
import { shouldSurfaceAlert, showLocalAlertNotification } from "./alertsRailNotifications";
import { playAlertSound } from "./alertsRailSound";
import {
  buildAlertsSnapshotSyncKey,
  buildAlertsSyncMessage,
  isAlertsSyncMessageFromPeer,
  openAlertsSyncChannel,
  readStoredSnapshot,
  writeStoredSnapshot,
} from "./alertsRailStorage";
import type { AlertsRailContext, AlertsRailContextByTicker, BrvmAlert } from "./alertsRailTypes";

const LIVE_ALERT_CONTEXT_POLL_MS = 15_000;

const nowIso = () => new Date().toISOString();

const buildTriggeredSignature = (alerts: BrvmAlert[]) => alerts
  .filter((alert) => alert.status === "triggered" && alert.lastTriggeredAt)
  .map((alert) => `${alert.id}:${alert.lastTriggeredAt}`)
  .sort()
  .join("|");

export const useAlertsRailRuntime = (context: AlertsRailContext, contextsByTicker?: AlertsRailContextByTicker) => {
  const [state, dispatch] = useReducer(alertsRailReducer, context, createInitialState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [supplementalContexts, setSupplementalContexts] = useState<AlertsRailContextByTicker>({});
  const [triggerNotice, setTriggerNotice] = useState<BrvmAlert | null>(null);
  const latestContextRef = useRef(context);
  const previousTriggeredSignatureRef = useRef("");
  const skippedWriteSnapshotKeyRef = useRef("");
  const syncChannelRef = useRef<BroadcastChannel | null>(null);
  const syncSourceIdRef = useRef("alerts-rail-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2));
  const { alerts, currentTicker, draftOpen, draftOpenByTicker, draftsByTicker, logs, soundEnabled } = state;
  const storeSnapshot = useMemo(() => ({
    alerts,
    draftOpenByTicker: { ...draftOpenByTicker, [currentTicker]: draftOpen },
    draftsByTicker,
    logs,
    soundEnabled,
  }), [alerts, currentTicker, draftOpen, draftOpenByTicker, draftsByTicker, logs, soundEnabled]);
  const storeSnapshotSyncKey = useMemo(() => buildAlertsSnapshotSyncKey(storeSnapshot), [storeSnapshot]);
  const triggerContexts = useMemo(
    () => mergeTriggerContexts(context, contextsByTicker, supplementalContexts),
    [context, contextsByTicker, supplementalContexts],
  );
  const activeAlertTickerKey = useMemo(() => alerts
    .filter((alert) => alert.status === "active")
    .map((alert) => alert.ticker)
    .filter((ticker, index, tickers) => tickers.indexOf(ticker) === index)
    .sort()
    .join("|"), [alerts]);
  const activeIndicatorTickerKey = useMemo(() => alerts
    .filter((alert) => alert.status === "active" && alert.type === "indicator" && alert.indicator?.key)
    .map((alert) => alert.ticker)
    .filter((ticker, index, tickers) => tickers.indexOf(ticker) === index)
    .sort()
    .join("|"), [alerts]);
  const supplementalTickerKey = useMemo(
    () => buildSupplementalTickerKey(activeAlertTickerKey, context.ticker),
    [activeAlertTickerKey, context.ticker],
  );
  const supplementalIndicatorTickerKey = useMemo(
    () => buildSupplementalTickerKey(activeIndicatorTickerKey, context.ticker),
    [activeIndicatorTickerKey, context.ticker],
  );
  const triggeredSignature = useMemo(() => buildTriggeredSignature(alerts), [alerts]);

  useEffect(() => {
    latestContextRef.current = context;
  }, [context]);

  useEffect(() => {
    let cancelled = false;
    const ticker = context.ticker;
    setIsHydrated(false);
    void readStoredSnapshot().then((snapshot) => {
      if (cancelled) return;
      const latestContext = latestContextRef.current;
      const draft = buildDefaultDraft({
        defaultThreshold: latestContext.defaultThreshold,
        priceLabel: latestContext.priceLabel,
        ticker,
      });
      previousTriggeredSignatureRef.current = buildTriggeredSignature(snapshot.alerts);
      dispatch({ type: "hydrate", draft, now: nowIso(), snapshot, ticker });
      setIsHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, [context.ticker]);

  useEffect(() => {
    dispatch({ type: "sync_context", context });
  }, [context]);


  useEffect(() => {
    const tickers = supplementalTickerKey.split("|").filter(Boolean);
    const indicatorTickers = supplementalIndicatorTickerKey.split("|").filter(Boolean);
    if (!isHydrated || tickers.length === 0) {
      setSupplementalContexts((current) => (Object.keys(current).length === 0 ? current : {}));
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const refresh = async () => {
      try {
        const contexts = await fetchLiveAlertContexts(tickers, controller.signal, indicatorTickers);
        if (cancelled) return;
        setSupplementalContexts((current) => mergeSupplementalContexts(current, contexts, tickers));
      } catch (error) {
        if (!controller.signal.aborted && typeof console !== "undefined") {
          console.warn("Alerts live context refresh failed", error);
        }
      }
    };

    void refresh();
    const intervalId = window.setInterval(refresh, LIVE_ALERT_CONTEXT_POLL_MS);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [isHydrated, supplementalIndicatorTickerKey, supplementalTickerKey]);

  useEffect(() => {
    if (!isHydrated) return;
    dispatch({ type: "trigger_alerts", contextsByTicker: triggerContexts, now: nowIso() });
  }, [alerts, isHydrated, triggerContexts]);

  useEffect(() => {
    if (!isHydrated) return;
    const channel = openAlertsSyncChannel();
    if (!channel) return;

    syncChannelRef.current = channel;
    channel.onmessage = (event: MessageEvent<unknown>) => {
      const message = isAlertsSyncMessageFromPeer(event.data, syncSourceIdRef.current);
      if (!message) return;

      const latestContext = latestContextRef.current;
      const draft = buildDefaultDraft({
        defaultThreshold: latestContext.defaultThreshold,
        priceLabel: latestContext.priceLabel,
        ticker: latestContext.ticker,
      });

      skippedWriteSnapshotKeyRef.current = buildAlertsSnapshotSyncKey(message.snapshot);
      previousTriggeredSignatureRef.current = buildTriggeredSignature(message.snapshot.alerts);
      dispatch({
        draft,
        now: nowIso(),
        snapshot: message.snapshot,
        ticker: latestContext.ticker,
        type: "hydrate",
      });
    };

    return () => {
      if (syncChannelRef.current === channel) syncChannelRef.current = null;
      channel.close();
    };
  }, [isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (skippedWriteSnapshotKeyRef.current === storeSnapshotSyncKey) {
      skippedWriteSnapshotKeyRef.current = "";
      return;
    }

    void writeStoredSnapshot(storeSnapshot).then(() => {
      syncChannelRef.current?.postMessage(buildAlertsSyncMessage(syncSourceIdRef.current, storeSnapshot));
    });
  }, [isHydrated, storeSnapshot, storeSnapshotSyncKey]);

  useEffect(() => {
    const previousSignature = previousTriggeredSignatureRef.current;
    if (!isHydrated) {
      previousTriggeredSignatureRef.current = triggeredSignature;
      return;
    }

    const previousTriggers = new Set(previousSignature.split("|").filter(Boolean));
    const freshTriggeredAlert = triggeredSignature
      .split("|")
      .filter(Boolean)
      .map((signature) => (previousTriggers.has(signature) ? null : alerts.find((alert) => signature === `${alert.id}:${alert.lastTriggeredAt}`) ?? null))
      .find((alert): alert is BrvmAlert => alert !== null);

    if (freshTriggeredAlert && shouldSurfaceAlert(freshTriggeredAlert)) {
      setTriggerNotice(freshTriggeredAlert);
    }
    if (freshTriggeredAlert?.channel === "local") {
      void showLocalAlertNotification(freshTriggeredAlert);
    }
    if (soundEnabled && freshTriggeredAlert && shouldSurfaceAlert(freshTriggeredAlert)) {
      void playAlertSound();
    }
    previousTriggeredSignatureRef.current = triggeredSignature;
  }, [alerts, isHydrated, soundEnabled, triggeredSignature]);

  return {
    clearTriggerNotice: () => setTriggerNotice(null),
    dispatch,
    isHydrated,
    state,
    triggerNotice,
  };
};

const mergeSupplementalContexts = (
  current: AlertsRailContextByTicker,
  incoming: AlertsRailContextByTicker,
  tickers: string[],
): AlertsRailContextByTicker => {
  const next = tickers.reduce<AlertsRailContextByTicker>((contexts, ticker) => {
    const context = incoming[ticker] ?? current[ticker];
    if (context) contexts[ticker] = context;
    return contexts;
  }, {});
  if (Object.keys(current).length !== Object.keys(next).length) return next;
  return tickers.every((ticker) => current[ticker] === next[ticker]) ? current : next;
};

export const buildSupplementalTickerKey = (activeTickerKey: string, currentTicker: string) => activeTickerKey
  .split("|")
  .filter((ticker) => ticker.length > 0 && ticker !== currentTicker)
  .join("|");

export const mergeTriggerContexts = (
  context: AlertsRailContext,
  contextsByTicker: AlertsRailContextByTicker | undefined,
  supplementalContexts: AlertsRailContextByTicker,
): AlertsRailContextByTicker => ({
  ...contextsByTicker,
  ...supplementalContexts,
  [context.ticker]: context,
});
