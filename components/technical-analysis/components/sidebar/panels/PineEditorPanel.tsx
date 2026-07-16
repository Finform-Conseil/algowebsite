import React from "react";
import type { ChartDataPoint } from "../../../lib/Indicators/TechnicalIndicators";
import clsx from "clsx";
import { BrvmRailPanel, type BrvmRailRow } from "./BrvmRailPanel";
import { compilePineScript } from "./pineEditor/pineCompiler";
import { buildPineChartOverlayPayload } from "./pineEditor/pineChartOverlay";
import { createInitialPineEditorState, pineEditorReducer } from "./pineEditor/pineEditorReducer";
import { loadPineEditorState, savePineEditorState } from "./pineEditor/pineStorage";
import type { PineChartOverlayPayload, PineDiagnostic, PineEditorAction, PineEditorState, PineSavedScript, PineScriptTemplate } from "./pineEditor/pineTypes";

const PINE_TEMPLATES: PineScriptTemplate[] = [
  {
    description: "RSI14 Wilder, SMA20 and SMA50 context for daily BRVM closes.",
    id: "brvm-rsi-sma",
    kind: "indicator",
    name: "BRVM RSI + SMA Guard",
    source: [
      "//@version=5",
      "indicator(\"BRVM RSI + SMA Guard\", overlay=true)",
      "rsiValue = ta.rsi(close, 14)",
      "smaFast = ta.sma(close, 20)",
      "smaSlow = ta.sma(close, 50)",
      "plot(smaFast, \"SMA 20\")",
      "plot(smaSlow, \"SMA 50\")",
      "plotchar(rsiValue > 70, \"RSI high\", \"H\")",
    ].join("\n"),
  },
  {
    description: "Highlights volume expansion around BRVM fixing windows without sending orders.",
    id: "volume-fixing",
    kind: "strategy",
    name: "Volume Fixing Breakout",
    source: [
      "//@version=5",
      "strategy(\"Volume Fixing Breakout\", overlay=true)",
      "volumeAverage = ta.sma(volume, 20)",
      "breakout = volume > volumeAverage * 1.8 and close > open",
      "plot(volumeAverage, \"Volume average\")",
      "plotchar(breakout, \"Volume breakout\", \"V\")",
    ].join("\n"),
  },
  {
    description: "Local library skeleton for dividend yield overlays.",
    id: "dividend-yield",
    kind: "library",
    name: "Dividend Yield Overlay",
    source: [
      "//@version=5",
      "library(\"Dividend Yield Overlay\")",
      "yieldValue(dividend, price) => price > 0 ? dividend / price * 100 : na",
    ].join("\n"),
  },
];

interface PineEditorPanelProps {
  auditTrail?: React.ReactNode;
  chartData: ChartDataPoint[];
  marketDate: string;
  marketSource: string;
  onAttachToChart?: (overlay: PineChartOverlayPayload | null) => void;
  onClearOverlay?: () => void;
  runtimeTone?: BrvmRailRow["tone"];
  sessionLabel: string;
  ticker: string;
}

export const PineEditorPanel = React.memo(({
  auditTrail,
  chartData,
  marketDate,
  marketSource,
  onAttachToChart,
  onClearOverlay,
  runtimeTone = "neutral",
  sessionLabel,
  ticker,
}: PineEditorPanelProps) => {
  const initialTemplate = PINE_TEMPLATES[0];
  const [state, dispatch] = React.useReducer(
    pineEditorReducer,
    initialTemplate,
    (template): PineEditorState => createInitialPineEditorState(template),
  );
  const hasLoadedStoredStateRef = React.useRef(false);

  React.useEffect(() => {
    if (hasLoadedStoredStateRef.current) return undefined;
    hasLoadedStoredStateRef.current = true;
    let cancelled = false;
    const fallback = createInitialPineEditorState(initialTemplate);
    void loadPineEditorState(fallback).then((loadedState) => {
      if (!cancelled) dispatch({ state: loadedState, type: "hydrate_success" });
    });
    return () => {
      cancelled = true;
    };
  }, [initialTemplate]);
  const rows = React.useMemo<BrvmRailRow[]>(() => buildRows(state, ticker, sessionLabel, runtimeTone, marketSource, marketDate), [marketDate, marketSource, runtimeTone, sessionLabel, state, ticker]);
  const saveDraft = React.useCallback(() => { void persistState(state, dispatch); }, [state]);
  const attachOverlay = React.useCallback(() => { void attachCurrentOverlay(state, chartData, dispatch, onAttachToChart); }, [chartData, onAttachToChart, state]);
  const compileNow = React.useCallback(() => dispatch({ result: compilePineScript(state.source), type: "compile" }), [state.source]);

  React.useEffect(() => {
    if (state.attachedOverlay && state.compileResult.isExecutable && state.source !== state.attachedOverlay.checksum) {
      void attachCurrentOverlay(state, chartData, dispatch, onAttachToChart);
    }
  }, [state, state.source, state.compileResult.isExecutable, state.attachedOverlay, chartData, dispatch, onAttachToChart]);

  return (
    <BrvmRailPanel auditTrail={auditTrail} rows={rows} subtitle="Editeur Pine local, diagnostics et attachement BRVM defensif" tags={["Pine", "Editor", "Local", "BRVM"]} title="Pine">
      <div className="gp-pine-panel" aria-label="Pine workspace">
        <TemplatePicker activeTemplateId={state.activeTemplateId} onSelect={(template) => dispatch({ now: new Date().toISOString(), template, type: "select_template" })} />
        <EditorCard onCompile={compileNow} onSourceChange={(value) => dispatch({ type: "edit_source", value })} source={state.source} />
        <Diagnostics diagnostics={state.compileResult.diagnostics} storageError={state.storageError} />
        <AttachedOverlay state={state} onClear={onClearOverlay} />
        <SavedScripts scripts={state.savedScripts} />
        <div className="gp-pine-actions" aria-label="Pine actions">
          <button type="button" onClick={saveDraft}>{state.compileResult.isExecutable ? "Save script" : "Save draft"}</button>
          <button type="button" disabled={!state.compileResult.isExecutable} onClick={attachOverlay}>Add to chart</button>
          <button type="button" disabled aria-disabled="true">Publish script</button>
        </div>
      </div>
    </BrvmRailPanel>
  );
});

PineEditorPanel.displayName = "PineEditorPanel";

const TemplatePicker = ({ activeTemplateId, onSelect }: { activeTemplateId: string; onSelect: (template: PineScriptTemplate) => void }) => (
  <section className="gp-pine-script-list" aria-label="Pine templates">
    {PINE_TEMPLATES.map((script) => (
      <button
        className={clsx("gp-pine-script-card", activeTemplateId === script.id && "is-active")}
        key={script.id}
        type="button"
        onClick={() => onSelect(script)}
      >
        <div>
          <strong>{script.name}</strong>
          <span>{script.description}</span>
        </div>
        <em>{script.kind}</em>
      </button>
    ))}
  </section>
);

const EditorCard = ({ onCompile, onSourceChange, source }: { onCompile: () => void; onSourceChange: (value: string) => void; source: string }) => (
  <section className="gp-pine-editor-card" aria-label="Pine Editor">
    <div className="gp-pine-editor-head">
      <span>Pine Editor</span>
      <button type="button" onClick={onCompile}>Compile</button>
    </div>
    <textarea
      aria-label="Pine source"
      className="gp-pine-code"
      maxLength={12_000}
      spellCheck={false}
      value={source}
      onChange={(event) => onSourceChange(event.currentTarget.value)}
    />
  </section>
);

const Diagnostics = ({ diagnostics, storageError }: { diagnostics: PineDiagnostic[]; storageError: string | null }) => {
  const visibleDiagnostics = storageError
    ? [{ code: "PINE_STORAGE", line: 1, message: storageError, severity: "error" as const }, ...diagnostics]
    : diagnostics;
  if (visibleDiagnostics.length === 0) {
    return (
      <section className="gp-pine-diagnostics" aria-label="Pine diagnostics">
        <div className="gp-pine-diagnostic is-success"><span>Compile</span><strong>No blocking diagnostics</strong></div>
      </section>
    );
  }
  return (
    <section className="gp-pine-diagnostics" aria-label="Pine diagnostics">
      {visibleDiagnostics.map((diagnostic) => (
        <div className={clsx("gp-pine-diagnostic", "is-" + diagnostic.severity)} key={`${diagnostic.code}-${diagnostic.line}`}>
          <span>{diagnostic.code} · L{diagnostic.line}</span>
          <strong>{diagnostic.message}</strong>
        </div>
      ))}
    </section>
  );
};

const AttachedOverlay = ({ state, onClear }: { state: PineEditorState; onClear?: () => void }) => {
  if (!state.attachedOverlay) return null;
  return (
    <section
      aria-label="Attached Pine overlay"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 12px",
        border: "1px solid rgba(34, 197, 94, 0.25)",
        borderRadius: "6px",
        background: "rgba(16, 185, 129, 0.08)",
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "3px" }}>
        <span style={{ color: "#86efac", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3px" }}>
          Attached to chart
        </span>
        <strong style={{ color: "#d1d4dc", fontSize: "11.5px", fontWeight: 850, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {state.attachedOverlay.title}
        </strong>
        <span style={{ color: "#787b86", fontSize: "9px", fontWeight: 500 }}>
          {state.attachedOverlay.plots.length} plot{state.attachedOverlay.plots.length !== 1 ? "s" : ""} · {state.attachedOverlay.signals.length} signal{state.attachedOverlay.signals.length !== 1 ? "s" : ""}
        </span>
      </div>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          title="Remove from chart"
          style={{
            flexShrink: 0,
            border: "1px solid rgba(239, 68, 68, 0.25)",
            borderRadius: "4px",
            background: "rgba(239, 68, 68, 0.08)",
            color: "#ef5350",
            fontSize: "10px",
            fontWeight: 600,
            lineHeight: 1.15,
            padding: "6px 10px",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.16)";
            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.25)";
          }}
        >
          Remove
        </button>
      )}
    </section>
  );
};

const SavedScripts = ({ scripts }: { scripts: PineSavedScript[] }) => {
  if (scripts.length === 0) return null;
  return (
    <section className="gp-pine-saved-list" aria-label="Saved Pine scripts">
      {scripts.map((script) => (
        <article key={script.id}>
          <strong>{script.name}</strong>
          <span>{script.kind} · {script.checksum}</span>
        </article>
      ))}
    </section>
  );
};

const buildRows = (state: PineEditorState, ticker: string, sessionLabel: string, runtimeTone: BrvmRailRow["tone"], marketSource: string, marketDate: string): BrvmRailRow[] => [
  { label: "Ticker", value: ticker },
  { label: "Compile", value: state.compileResult.isExecutable ? "Executable local" : "Diagnostics actifs", tone: state.compileResult.isExecutable ? "success" : "warning" },
  { label: "Runtime", value: state.runtimeStatus === "attached" ? "Overlay local attache" : "Preview local", tone: state.runtimeStatus === "attached" ? "success" : runtimeTone },
  { label: "Session", value: sessionLabel, tone: runtimeTone },
  { label: "Source", value: marketSource },
  { label: "Date", value: marketDate },
  { label: "Saved", value: state.savedScripts.length.toLocaleString("fr-FR") },
];

const persistState = async (state: PineEditorState, dispatch: React.Dispatch<PineEditorAction>) => {
  const now = new Date().toISOString();
  const nextState = state.compileResult.isExecutable
    ? pineEditorReducer(state, { now, script: buildSavedScript(state, now), type: "save_success" })
    : pineEditorReducer(state, { now, type: "save_draft_success" });
  const result = await savePineEditorState(nextState);
  dispatch(result.error ? { message: result.error, type: "save_failed" } : state.compileResult.isExecutable ? { now, script: buildSavedScript(state, now), type: "save_success" } : { now, type: "save_draft_success" });
};

const attachCurrentOverlay = async (
  state: PineEditorState,
  chartData: ChartDataPoint[],
  dispatch: React.Dispatch<PineEditorAction>,
  onAttachToChart?: (overlay: PineChartOverlayPayload | null) => void,
) => {
  if (!state.compileResult.isExecutable) return;
  const now = new Date().toISOString();
  const chartOverlay = buildPineChartOverlayPayload({ chartData, compileResult: state.compileResult, generatedAt: now, source: state.source });
  if (chartOverlay.series.length === 0 && chartOverlay.signals.length === 0) {
    dispatch({ message: "No supported Pine plots or signals can be rendered on the chart.", type: "save_failed" });
    onAttachToChart?.(null);
    return;
  }
  const nextState = pineEditorReducer(state, { chartOverlay, now, type: "attach_overlay" });
  const result = await savePineEditorState(nextState);
  if (result.error) {
    dispatch({ message: result.error, type: "save_failed" });
    onAttachToChart?.(null);
    return;
  }
  dispatch({ chartOverlay, now, type: "attach_overlay" });
  onAttachToChart?.(chartOverlay);
};

const buildSavedScript = (state: PineEditorState, now: string): PineSavedScript => ({
  checksum: state.compileResult.checksum,
  id: `pine-${state.compileResult.checksum}`,
  kind: state.compileResult.kind,
  name: state.compileResult.title,
  source: state.source,
  updatedAt: now,
});
