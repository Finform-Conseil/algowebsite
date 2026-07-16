"use client";

import { useEffect, useMemo, useRef, type FormEvent } from "react";
import clsx from "clsx";
import {
  BellRing,
  Brush,
  Check,
  Ellipsis,
  History,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  ALERT_TYPES,
  CHANNELS,
  CONDITIONS,
  EXPIRATIONS,
  SORT_LABELS,
  filterAndSortAlerts,
  filterLogs,
  getAlertCounts,
  getAlertLogCounts,
  getCurrentTickerAlerts,
  nextSortMode,
  validateDraft,
  type AlertConditionId,
  type AlertDraft,
  type AlertDraftUpdateValue,
  type AlertLogEntry,
  type AlertLogFilter,
  type AlertsRailContext,
  type AlertTypeId,
  type BrvmAlert,
  type IndicatorAlertTarget,
} from "./alertsRailModel";
import { AlertCard } from "./alertsRail/AlertCard";
import { AlertsLogFilter } from "./alertsRail/AlertsLogFilter";
import { AlertsMenu } from "./alertsRail/AlertsMenu";
import { AlertTriggerToast } from "./alertsRail/AlertTriggerToast";
import { requestLocalAlertPermission } from "./alertsRail/alertsRailNotifications";
import { useAlertsRailRuntime } from "./alertsRail/useAlertsRailRuntime";

interface AlertsRailPanelProps {
  context: AlertsRailContext;
  contextsByTicker?: Record<string, AlertsRailContext>;
  initialDraftRequest?: AlertsRailDraftRequest | null;
  initialEditAlertId?: string | null;
  onInitialEditHandled?: () => void;
}

export interface AlertsRailDraftRequest {
  id: number;
  condition?: "GREATER_THAN" | "LESS_THAN";
  price?: number;
}

const nowIso = () => new Date().toISOString();

const PRICE_CONDITIONS = new Set<AlertConditionId>(["price_crossing", "price_above", "price_below"]);
const INDICATOR_CONDITIONS = new Set<AlertConditionId>(["indicator_cross_above", "indicator_cross_below", "indicator_above", "indicator_below"]);

const getConditionOptions = (type: AlertTypeId) => CONDITIONS.filter((condition) => {
  if (type === "price") return PRICE_CONDITIONS.has(condition.id);
  if (type === "indicator") return INDICATOR_CONDITIONS.has(condition.id);
  if (type === "change") return condition.id === "change_at_least";
  if (type === "volume") return condition.id === "volume_ratio_at_least";
  if (type === "dividend") return condition.id === "dividend_available";
  return condition.id === "news_available";
});

const buildIndicatorOptions = (context: AlertsRailContext): IndicatorAlertTarget[] => (
  Object.values(context.indicatorValuesByKey ?? {})
    .filter((value) => typeof value.value === "number" && Number.isFinite(value.value))
    .map((value) => ({
      key: value.key,
      label: value.label,
      ...(value.source ? { source: value.source } : {}),
      ...(value.timeframe ? { timeframe: value.timeframe } : {}),
    }))
    .sort((left, right) => left.label.localeCompare(right.label, "fr-FR"))
);

export const AlertsRailPanel = ({
  context,
  contextsByTicker,
  initialDraftRequest = null,
  initialEditAlertId = null,
  onInitialEditHandled,
}: AlertsRailPanelProps) => {
  const { clearTriggerNotice, dispatch, isHydrated, state, triggerNotice } = useAlertsRailRuntime(context, contextsByTicker);
  const handledDraftRequestIdRef = useRef<number | null>(null);
  const currentAlerts = useMemo(() => getCurrentTickerAlerts(state, context.ticker), [context.ticker, state]);
  const counts = useMemo(() => getAlertCounts(currentAlerts), [currentAlerts]);
  const visibleAlerts = useMemo(() => filterAndSortAlerts(state, context.ticker), [context.ticker, state]);
  const visibleLogs = useMemo(() => filterLogs(state, context.ticker), [context.ticker, state]);
  const logCounts = useMemo(() => getAlertLogCounts(state, context.ticker), [context.ticker, state]);
  const validation = useMemo(() => validateDraft(state.draft), [state.draft]);
  const indicatorOptions = useMemo(() => buildIndicatorOptions(context), [context]);

  const openDraft = (alertId?: string) => dispatch({ type: "open_draft", context, alertId });

  useEffect(() => {
    if (!initialEditAlertId || !isHydrated) return;
    dispatch({ type: "open_draft", context, alertId: initialEditAlertId });
    onInitialEditHandled?.();
  }, [context, dispatch, initialEditAlertId, isHydrated, onInitialEditHandled]);

  useEffect(() => {
    if (!initialDraftRequest || !isHydrated || handledDraftRequestIdRef.current === initialDraftRequest.id) return;
    handledDraftRequestIdRef.current = initialDraftRequest.id;
    dispatch({ type: "open_draft", context });
    const condition = initialDraftRequest.condition === "LESS_THAN" ? "price_below" : "price_above";
    dispatch({ type: "update_draft", context, field: "type", value: "price" });
    dispatch({ type: "update_draft", context, field: "condition", value: condition });
    if (typeof initialDraftRequest.price === "number" && Number.isFinite(initialDraftRequest.price)) {
      dispatch({ type: "update_draft", context, field: "threshold", value: String(initialDraftRequest.price) });
    }
  }, [context, dispatch, initialDraftRequest, isHydrated]);

  const submitDraft = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validation.error) return;
    dispatch({ type: "submit_draft", context, now: nowIso() });
  };
  const updateDraft = (field: keyof AlertDraft, value: AlertDraftUpdateValue) => {
    if (field === "channel" && value === "local") void requestLocalAlertPermission();
    dispatch({ type: "update_draft", context, field, value });
  };

  return (
    <section className="gp-sidebar-section gp-alerts-rail-panel" aria-label="Alertes BRVM">
      {triggerNotice && (
        <AlertTriggerToast
          alert={triggerNotice}
          onClose={clearTriggerNotice}
          onEdit={(alertId) => {
            clearTriggerNotice();
            openDraft(alertId);
          }}
        />
      )}
      <div className="gp-alerts-tabs" role="tablist" aria-label="Vue alertes BRVM">
        <button type="button" role="tab" aria-selected={state.activeTab === "alerts"} className={clsx(state.activeTab === "alerts" && "active")} onClick={() => dispatch({ type: "set_tab", value: "alerts" })}>Alertes</button>
        <button type="button" role="tab" aria-selected={state.activeTab === "log"} className={clsx(state.activeTab === "log" && "active")} onClick={() => dispatch({ type: "set_tab", value: "log" })}>Journal</button>
      </div>

      <div className="gp-alerts-toolbar" aria-label="Commandes alertes BRVM">
        {state.activeTab === "alerts" ? (
          <button type="button" title="Creer une alerte BRVM" aria-label="Creer une alerte BRVM" onClick={() => openDraft()}><Plus /></button>
        ) : (
          <button type="button" title="Nettoyer le journal" aria-label="Nettoyer le journal" disabled={visibleLogs.length === 0} onClick={() => dispatch({ type: "clear_log", ticker: context.ticker, now: nowIso() })}><Brush /></button>
        )}
        <span className="gp-alerts-toolbar-spacer" />
        {state.activeTab === "alerts" && (
          <>
            <button type="button" title="Rechercher" aria-label="Rechercher les alertes" className={clsx(state.searchOpen && "active")} onClick={() => dispatch({ type: "set_search_open", value: !state.searchOpen })}><Search /></button>
            <button type="button" title={`Tri: ${SORT_LABELS[state.sortMode]}`} aria-label={`Tri: ${SORT_LABELS[state.sortMode]}`} onClick={() => dispatch({ type: "set_sort_mode", value: nextSortMode(state.sortMode) })}><SlidersHorizontal /></button>
          </>
        )}
        <button type="button" title="Menu alertes" aria-label="Menu alertes" className={clsx(state.menuOpen && "active")} onClick={() => dispatch({ type: "set_menu_open", value: !state.menuOpen })}><Ellipsis /></button>
      </div>

      {state.searchOpen && state.activeTab === "alerts" && (
        <div className="gp-alerts-search-row">
          <span>{visibleAlerts.length.toLocaleString("fr-FR")} / {counts.all.toLocaleString("fr-FR")}</span>
          <input value={state.searchQuery} onChange={(event) => dispatch({ type: "set_search_query", value: event.target.value })} placeholder="Rechercher une alerte" aria-label="Rechercher une alerte" />
          <button type="button" aria-label="Fermer la recherche" onClick={() => dispatch({ type: "set_search_open", value: false })}><X /></button>
        </div>
      )}

      {state.menuOpen && (
        <AlertsMenu
          counts={counts}
          currentSymbolOnly={state.currentSymbolOnly}
          onDeleteInactive={() => dispatch({ type: "delete_inactive", ticker: context.ticker, now: nowIso() })}
          onRestartInactive={() => dispatch({ type: "restart_inactive", ticker: context.ticker, now: nowIso() })}
          onSetCurrentOnly={(value) => dispatch({ type: "set_current_symbol_only", value })}
          onSetSoundEnabled={(value) => dispatch({ type: "set_sound_enabled", value })}
          onSetTypeFilter={(value) => dispatch({ type: "set_type_filter", value })}
          onSetViewFilter={(value) => dispatch({ type: "set_view_filter", value })}
          sortLabel={SORT_LABELS[state.sortMode]}
          soundEnabled={state.soundEnabled}
          typeFilter={state.typeFilter}
          viewFilter={state.viewFilter}
        />
      )}

      {state.activeTab === "alerts" && (
        <>
          <MarketSnapshot context={context} />
          {state.draftOpen ? (
            <AlertDraftForm draft={state.draft} error={validation.error} indicatorOptions={indicatorOptions} onCancel={() => dispatch({ type: "set_draft_open", value: false })} onChange={updateDraft} onSubmit={submitDraft} />
          ) : visibleAlerts.length > 0 ? (
            <AlertList alerts={visibleAlerts} onDelete={(alertId) => dispatch({ type: "delete_alert", alertId, now: nowIso() })} onEdit={openDraft} onToggle={(alertId) => dispatch({ type: "toggle_alert_status", alertId, now: nowIso() })} />
          ) : (
            <AlertEmptyState hasHiddenAlerts={counts.all > 0} onCreate={() => openDraft()} />
          )}
        </>
      )}

      {state.activeTab === "log" && (
        <>
          <AlertsLogFilter counts={logCounts} filter={state.logFilter} onChange={(value) => dispatch({ type: "set_log_filter", value })} />
          {visibleLogs.length > 0 ? <AlertLogList logs={visibleLogs} onRemove={(logId) => dispatch({ type: "remove_log_entry", logId })} /> : <AlertLogEmptyState filter={state.logFilter} />}
        </>
      )}
    </section>
  );
};

const MarketSnapshot = ({ context }: { context: AlertsRailContext }) => (
  <div className="gp-alerts-market-snapshot">
    <div><strong>{context.ticker}</strong><span>{context.name}</span></div>
    <div><span>{context.marketLabel}</span><span className={clsx("gp-alerts-change", "gp-alerts-change--" + context.changeTone)}>{context.changeLabel}</span></div>
    <div><span>Prix {context.priceLabel}</span><span>Volume {context.volumeLabel}</span></div>
    <div><span>{context.dividendLabel}</span><span>{context.sessionLabel}</span></div>
    <div><span>{context.newsLabel}</span></div>
  </div>
);

const AlertEmptyState = ({ hasHiddenAlerts, onCreate }: { hasHiddenAlerts: boolean; onCreate: () => void }) => (
  <div className="gp-alerts-empty">
    <BellRing aria-hidden="true" />
    <strong>{hasHiddenAlerts ? "Aucune alerte visible" : "Aucune alerte BRVM"}</strong>
    <p>{hasHiddenAlerts ? "Des filtres masquent les alertes du titre courant." : "Les conditions de cours, volume, dividende et news BRVM apparaitront ici."}</p>
    <button type="button" onClick={onCreate}>Creer une alerte</button>
  </div>
);

const AlertLogEmptyState = ({ filter }: { filter: AlertLogFilter }) => (
  <div className="gp-alerts-empty gp-alerts-empty--log">
    <History aria-hidden="true" />
    <strong>{filter === "triggered" ? "Aucun declenchement" : "Aucun evenement"}</strong>
    <p>{filter === "triggered" ? "Les creations, pauses et reprises restent disponibles dans Tout le journal." : "Le journal affichera creations, pauses, reprises, suppressions et declenchements reels."}</p>
  </div>
);

const AlertDraftForm = ({
  draft,
  error,
  indicatorOptions,
  onCancel,
  onChange,
  onSubmit,
}: {
  draft: AlertDraft;
  error: string | null;
  indicatorOptions: IndicatorAlertTarget[];
  onCancel: () => void;
  onChange: (field: keyof AlertDraft, value: AlertDraftUpdateValue) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) => {
  const conditionOptions = getConditionOptions(draft.type);
  const selectedIndicatorKey = draft.indicator?.key ?? indicatorOptions[0]?.key ?? "";
  const updateIndicator = (key: string) => {
    onChange("indicator", indicatorOptions.find((option) => option.key === key) ?? null);
  };

  return (
    <form className="gp-alerts-draft-form" onSubmit={onSubmit}>
      <label>Type<select name="alertType" value={draft.type} onChange={(event) => onChange("type", event.target.value)}>{ALERT_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}</select></label>
      {draft.type === "indicator" && (
        <label>Indicateur<select name="alertIndicator" value={selectedIndicatorKey} disabled={indicatorOptions.length === 0} onChange={(event) => updateIndicator(event.target.value)}>
          {indicatorOptions.length === 0 ? <option value="">Aucune metrique disponible</option> : indicatorOptions.map((indicator) => <option key={indicator.key} value={indicator.key}>{indicator.label}</option>)}
        </select></label>
      )}
      <label>Condition<select name="alertCondition" value={draft.condition} onChange={(event) => onChange("condition", event.target.value)}>{conditionOptions.map((condition) => <option key={condition.id} value={condition.id}>{condition.label}</option>)}</select></label>
      <label>Seuil<input name="alertThreshold" value={draft.threshold} onChange={(event) => onChange("threshold", event.target.value)} placeholder="Ex: 12500 ou 2,5" /></label>
      <label>Expiration<select name="alertExpiration" value={draft.expiration} onChange={(event) => onChange("expiration", event.target.value)}>{EXPIRATIONS.map((expiration) => <option key={expiration.id} value={expiration.id}>{expiration.label}</option>)}</select></label>
      <label>Canal<select name="alertChannel" value={draft.channel} onChange={(event) => onChange("channel", event.target.value)}>{CHANNELS.map((channel) => <option key={channel.id} value={channel.id}>{channel.label}</option>)}</select></label>
      <label>Message<textarea name="alertMessage" rows={3} maxLength={180} value={draft.message} onChange={(event) => onChange("message", event.target.value)} /></label>
      {error && <p className="gp-alerts-form-error" role="alert">{error}</p>}
      <div className="gp-alerts-draft-actions"><button type="button" onClick={onCancel}>Fermer</button><button type="submit" disabled={Boolean(error)}><Check aria-hidden="true" /> Activer</button></div>
    </form>
  );
};

const AlertList = ({ alerts, onDelete, onEdit, onToggle }: { alerts: BrvmAlert[]; onDelete: (alertId: string) => void; onEdit: (alertId: string) => void; onToggle: (alertId: string) => void }) => (
  <div className="gp-alerts-list" role="list" aria-label="Alertes actives BRVM">
    {alerts.map((alert) => <AlertCard key={alert.id} alert={alert} onDelete={onDelete} onEdit={onEdit} onToggle={onToggle} />)}
  </div>
);


const AlertLogList = ({ logs, onRemove }: { logs: AlertLogEntry[]; onRemove: (logId: string) => void }) => (
  <div className="gp-alerts-log-list" role="list" aria-label="Journal des alertes BRVM">
    {logs.map((entry) => <div className="gp-alerts-log-entry" key={entry.id} role="listitem"><RotateCcw aria-hidden="true" /><div><strong>{entry.ticker}</strong><span>{entry.message}</span><time>{new Date(entry.createdAt).toLocaleString("fr-FR")}</time></div><button type="button" aria-label="Retirer cette entree" onClick={() => onRemove(entry.id)}><X /></button></div>)}
  </div>
);

AlertsRailPanel.displayName = "AlertsRailPanel";
