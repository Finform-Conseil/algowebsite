import React from "react";
import type { ChartDataPoint } from "../../../lib/Indicators/TechnicalIndicators";
import clsx from "clsx";
import {
  Activity,
  ChevronDown,
  Code2,
  FilePlus2,
  ListTree,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Play,
  Save,
  Settings2,
  UploadCloud,
} from "lucide-react";
import type { BrvmRailRow } from "./BrvmRailPanel";
import { compilePineScript } from "./pineEditor/pineCompiler";
import { createInitialPineEditorState, pineEditorReducer } from "./pineEditor/pineEditorReducer";
import { executePineScriptWithPineTS } from "./pineEditor/pineRuntime";
import { loadPineEditorState, savePineEditorState } from "./pineEditor/pineStorage";
import type { PineChartOverlayPayload, PineDiagnostic, PineEditorAction, PineEditorState, PineSavedScript, PineScriptTemplate } from "./pineEditor/pineTypes";

const PINE_TEMPLATES: PineScriptTemplate[] = [
  {
    description: "RSI14 Wilder, SMA20 and SMA50 context for daily BRVM closes.",
    id: "brvm-rsi-sma",
    kind: "indicator",
    name: "BRVM RSI + SMA Guard",
    source: [
      "//@version=6",
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
      "//@version=6",
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
      "//@version=6",
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
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = React.useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = React.useState(false);
  const [isSavedScriptsOpen, setIsSavedScriptsOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isMaximized, setIsMaximized] = React.useState(false);
  const [editorFontSize, setEditorFontSize] = React.useState(13);
  const [wordWrap, setWordWrap] = React.useState(false);
  const [cursorPosition, setCursorPosition] = React.useState({ column: 1, line: 1 });

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
  const compileNow = React.useCallback(() => { void runCurrentScript(state, chartData, dispatch); }, [chartData, state]);
  const clearOverlay = React.useCallback(() => { void detachCurrentOverlay(state, dispatch, onClearOverlay); }, [onClearOverlay, state]);
  const handleSourceChange = React.useCallback((value: string) => {
    if (state.attachedOverlay && value !== state.source) onClearOverlay?.();
    dispatch({ type: "edit_source", value });
  }, [onClearOverlay, state.attachedOverlay, state.source]);
  const handleTemplateSelect = React.useCallback((template: PineScriptTemplate) => {
    if (state.attachedOverlay) onClearOverlay?.();
    dispatch({ now: new Date().toISOString(), template, type: "select_template" });
    setIsTemplatesOpen(false);
  }, [onClearOverlay, state.attachedOverlay]);

  const handleNewScript = React.useCallback(() => {
    if (state.attachedOverlay) onClearOverlay?.();
    dispatch({
      type: "edit_source",
      value: [
        "//@version=6",
        "indicator(\"My script\", overlay=true)",
        "plot(close)",
      ].join("\n"),
    });
    setIsMenuOpen(false);
    setIsTemplatesOpen(false);
  }, [onClearOverlay, state.attachedOverlay]);

  const runtimeLabel = state.runtimeStatus === "running"
    ? "Running PineTS…"
    : state.runtimeStatus === "attached"
      ? "Attached"
      : state.runtimeStatus === "runtime_error"
        ? "Runtime error"
        : "Ready";
  const hasDiagnostics = Boolean(
    state.runtimeError
    || state.storageError
    || state.compileResult.diagnostics.length
    || state.runtimeDiagnostics.length,
  );

  const attachedChecksum = state.attachedOverlay?.checksum ?? null;
  React.useEffect(() => {
    if (!attachedChecksum || attachedChecksum !== state.compileResult.checksum || !state.compileResult.isExecutable) return undefined;
    let cancelled = false;
    void executePineScriptWithPineTS({
      chartData,
      compileResult: state.compileResult,
      source: state.source,
    }).then((execution) => {
      if (!cancelled && !execution.requiresSeparatePane) onAttachToChart?.(execution.overlay);
    }).catch(() => {
      // Explicit Compile/Add actions surface runtime errors. Live refreshes
      // preserve the last known-good chart overlay on transient failures.
    });
    return () => {
      cancelled = true;
    };
  }, [attachedChecksum, chartData, onAttachToChart, state.compileResult, state.source]);

  return (
    <section className={clsx("gp-pine-workbench", isMaximized && "is-maximized")} aria-label="Pine workspace">
      <header className="gp-pine-windowbar">
        <div className="gp-pine-windowbar-title">
          <Code2 size={17} aria-hidden="true" />
          <strong>Pine Editor</strong>
          <span>PineTS</span>
        </div>
        <div className="gp-pine-windowbar-actions">
          <button type="button" title="Runtime details" aria-label="Runtime details" onClick={() => setIsDiagnosticsOpen((value) => !value)}>
            <Activity size={16} />
          </button>
          <button
            type="button"
            title={isMaximized ? "Restore editor" : "Fullscreen editor"}
            aria-label={isMaximized ? "Restore editor" : "Fullscreen editor"}
            onClick={() => setIsMaximized((value) => !value)}
          >
            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      <div className="gp-pine-toolbar" role="toolbar" aria-label="Pine Editor actions">
        <div className="gp-pine-script-selector-wrap">
          <button
            type="button"
            className="gp-pine-script-selector"
            aria-expanded={isTemplatesOpen}
            aria-haspopup="menu"
            onClick={() => {
              setIsTemplatesOpen((value) => !value);
              setIsMenuOpen(false);
            }}
          >
            <span>{state.compileResult.title || "Untitled script"}</span>
            <ChevronDown size={15} aria-hidden="true" />
          </button>
          {isTemplatesOpen && (
            <div className="gp-pine-template-popover" role="menu" aria-label="Pine scripts">
              <button type="button" className="gp-pine-menu-item" onClick={handleNewScript}>
                <FilePlus2 size={16} />
                <span>New script</span>
              </button>
              <div className="gp-pine-menu-separator" />
              <TemplatePicker activeTemplateId={state.activeTemplateId} onSelect={handleTemplateSelect} />
            </div>
          )}
        </div>

        <div className="gp-pine-toolbar-actions">
          <button
            type="button"
            className="gp-pine-toolbar-run"
            title="Compile and run"
            aria-label="Compile and run"
            disabled={state.runtimeStatus === "running"}
            onClick={compileNow}
          >
            <Play size={16} fill="currentColor" />
          </button>
          <button type="button" title="Save script" aria-label="Save script" onClick={saveDraft}>
            <Save size={16} />
          </button>
          <button
            type="button"
            title="Add to chart"
            aria-label="Add to chart"
            disabled={!state.compileResult.isExecutable || state.runtimeStatus === "running"}
            onClick={attachOverlay}
          >
            <UploadCloud size={16} />
          </button>
          <div className="gp-pine-overflow-wrap">
            <button
              type="button"
              title="More Pine Editor options"
              aria-label="More Pine Editor options"
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
              onClick={() => {
                setIsMenuOpen((value) => !value);
                setIsTemplatesOpen(false);
              }}
            >
              <MoreHorizontal size={18} />
            </button>
            {isMenuOpen && (
              <div className="gp-pine-overflow-menu" role="menu">
                <button type="button" role="menuitem" onClick={() => { setIsSettingsOpen((value) => !value); setIsMenuOpen(false); }}>
                  <Settings2 size={16} /><span>Editor settings…</span>
                </button>
                <div className="gp-pine-menu-heading">OPEN EDITOR</div>
                <button type="button" role="menuitem" onClick={handleNewScript}>
                  <FilePlus2 size={16} /><span>New script</span>
                </button>
                <button type="button" role="menuitem" onClick={() => { setIsTemplatesOpen(true); setIsMenuOpen(false); }}>
                  <Code2 size={16} /><span>Templates</span>
                </button>
                <div className="gp-pine-menu-separator" />
                <div className="gp-pine-menu-heading">DEVELOPER TOOLS</div>
                <button type="button" role="menuitem" onClick={() => { setIsDiagnosticsOpen((value) => !value); setIsMenuOpen(false); }}>
                  <Activity size={16} /><span>Pine diagnostics</span>
                </button>
                <button type="button" role="menuitem" onClick={() => { setIsSavedScriptsOpen((value) => !value); setIsMenuOpen(false); }}>
                  <ListTree size={16} /><span>Saved scripts</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isSettingsOpen && (
        <section className="gp-pine-settings-bar" aria-label="Pine Editor settings">
          <label>
            Font
            <select value={editorFontSize} onChange={(event) => setEditorFontSize(Number(event.currentTarget.value))}>
              {[11, 12, 13, 14, 15, 16, 18].map((size) => <option key={size} value={size}>{size}px</option>)}
            </select>
          </label>
          <label className="gp-pine-toggle-setting">
            <input type="checkbox" checked={wordWrap} onChange={(event) => setWordWrap(event.currentTarget.checked)} />
            Word wrap
          </label>
          <button type="button" onClick={() => setIsSettingsOpen(false)}>Done</button>
        </section>
      )}

      <main className="gp-pine-editor-main">
        <EditorCard
          cursorPosition={cursorPosition}
          fontSize={editorFontSize}
          isRunning={state.runtimeStatus === "running"}
          onCompile={compileNow}
          onCursorPositionChange={setCursorPosition}
          onSourceChange={handleSourceChange}
          source={state.source}
          wordWrap={wordWrap}
        />
      </main>

      {hasDiagnostics && (
        <div className="gp-pine-drawer-toggle-row">
          <button type="button" onClick={() => setIsDiagnosticsOpen((value) => !value)}>
            <Activity size={14} />
            Diagnostics
            <span>{state.compileResult.diagnostics.length + state.runtimeDiagnostics.length + (state.runtimeError ? 1 : 0) + (state.storageError ? 1 : 0)}</span>
          </button>
        </div>
      )}

      {isDiagnosticsOpen && (
        <div className="gp-pine-bottom-drawer">
          <Diagnostics diagnostics={state.compileResult.diagnostics} runtimeDiagnostics={state.runtimeDiagnostics} runtimeError={state.runtimeError} storageError={state.storageError} />
          <details className="gp-pine-runtime-details">
            <summary>Runtime context</summary>
            <div className="gp-pine-runtime-grid">
              {rows.map((row) => <React.Fragment key={row.label}><span>{row.label}</span><strong>{row.value}</strong></React.Fragment>)}
            </div>
            {auditTrail}
          </details>
        </div>
      )}

      {isSavedScriptsOpen && (
        <div className="gp-pine-bottom-drawer">
          <SavedScripts scripts={state.savedScripts} />
        </div>
      )}

      <AttachedOverlay state={state} onClear={clearOverlay} />

      <footer className="gp-pine-statusbar">
        <div>
          <span className={clsx("gp-pine-status-dot", state.runtimeStatus === "runtime_error" && "is-error", state.runtimeStatus === "running" && "is-running")} />
          <strong>PineTS</strong>
          <span>{runtimeLabel}</span>
        </div>
        <button type="button" title="Cursor position">Ln {cursorPosition.line}, Col {cursorPosition.column}</button>
      </footer>
    </section>
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

const EditorCard = ({
  cursorPosition,
  fontSize,
  isRunning,
  onCompile,
  onCursorPositionChange,
  onSourceChange,
  source,
  wordWrap,
}: {
  cursorPosition: { column: number; line: number };
  fontSize: number;
  isRunning: boolean;
  onCompile: () => void;
  onCursorPositionChange: (position: { column: number; line: number }) => void;
  onSourceChange: (value: string) => void;
  source: string;
  wordWrap: boolean;
}) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  const lineNumbers = React.useMemo(() => Array.from({ length: Math.max(1, source.split("\n").length) }, (_, index) => index + 1), [source]);

  const updateCursor = React.useCallback((target: HTMLTextAreaElement) => {
    const beforeCursor = target.value.slice(0, target.selectionStart);
    const lines = beforeCursor.split("\n");
    onCursorPositionChange({
      column: (lines[lines.length - 1]?.length ?? 0) + 1,
      line: lines.length,
    });
  }, [onCursorPositionChange]);

  return (
    <section className="gp-pine-editor-card" aria-label="Pine Editor">
      <div className="gp-pine-editor-surface">
        <div className="gp-pine-line-numbers" aria-hidden="true">
          <div style={{ transform: `translateY(-${scrollTop}px)`, fontSize }}>
            {lineNumbers.map((line) => <span key={line}>{line}</span>)}
          </div>
        </div>
        <textarea
          aria-label="Pine source"
          className="gp-pine-code"
          maxLength={200_000}
          spellCheck={false}
          wrap={wordWrap ? "soft" : "off"}
          style={{ fontSize }}
          value={source}
          onChange={(event) => {
            onSourceChange(event.currentTarget.value);
            updateCursor(event.currentTarget);
          }}
          onClick={(event) => updateCursor(event.currentTarget)}
          onKeyUp={(event) => updateCursor(event.currentTarget)}
          onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
              event.preventDefault();
              if (!isRunning) onCompile();
            }
          }}
        />
      </div>
      <span className="visually-hidden" aria-live="polite">Line {cursorPosition.line}, column {cursorPosition.column}</span>
    </section>
  );
};

const Diagnostics = ({ diagnostics, runtimeDiagnostics, runtimeError, storageError }: { diagnostics: PineDiagnostic[]; runtimeDiagnostics: PineDiagnostic[]; runtimeError: string | null; storageError: string | null }) => {
  const visibleDiagnostics: PineDiagnostic[] = [
    ...(storageError ? [{ code: "PINE_STORAGE", line: 1, message: storageError, severity: "error" as const }] : []),
    ...(runtimeError ? [{ code: "PINE_RUNTIME", line: 1, message: runtimeError, severity: "error" as const }] : []),
    ...diagnostics,
    ...runtimeDiagnostics,
  ];
  if (visibleDiagnostics.length === 0) {
    return (
      <section className="gp-pine-diagnostics" aria-label="Pine diagnostics">
        <div className="gp-pine-diagnostic is-success"><span>PineTS</span><strong>Static checks passed; runtime ready</strong></div>
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
          {state.attachedOverlay.chartOverlay.series.length} plot{state.attachedOverlay.chartOverlay.series.length !== 1 ? "s" : ""} · {state.attachedOverlay.chartOverlay.signals.length} signal{state.attachedOverlay.chartOverlay.signals.length !== 1 ? "s" : ""}
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
  { label: "Compile", value: state.compileResult.isExecutable ? "Static gate passed" : "Diagnostics actifs", tone: state.compileResult.isExecutable ? "success" : "warning" },
  { label: "Engine", value: state.runtimeEngine ?? "PineTS ready", tone: state.runtimeError ? "danger" : state.runtimeEngine ? "success" : "neutral" },
  { label: "Runtime", value: state.runtimeStatus === "running" ? "Execution PineTS…" : state.runtimeStatus === "attached" ? "Overlay PineTS attaché" : state.runtimeStatus === "runtime_error" ? "Erreur runtime" : "Prêt", tone: state.runtimeStatus === "attached" ? "success" : state.runtimeStatus === "runtime_error" ? "danger" : runtimeTone },
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

const runCurrentScript = async (
  state: PineEditorState,
  chartData: ChartDataPoint[],
  dispatch: React.Dispatch<PineEditorAction>,
) => {
  const compileResult = compilePineScript(state.source);
  dispatch({ result: compileResult, type: "compile" });
  if (!compileResult.isExecutable) return;
  dispatch({ type: "runtime_start" });
  try {
    const execution = await executePineScriptWithPineTS({ chartData, compileResult, source: state.source });
    dispatch({ diagnostics: execution.diagnostics, engine: execution.engine, type: "runtime_success" });
  } catch (error) {
    dispatch({ message: runtimeErrorMessage(error), type: "runtime_failed" });
  }
};

const attachCurrentOverlay = async (
  state: PineEditorState,
  chartData: ChartDataPoint[],
  dispatch: React.Dispatch<PineEditorAction>,
  onAttachToChart?: (overlay: PineChartOverlayPayload | null) => void,
) => {
  const compileResult = compilePineScript(state.source);
  dispatch({ result: compileResult, type: "compile" });
  if (!compileResult.isExecutable) return;

  dispatch({ type: "runtime_start" });
  const now = new Date().toISOString();
  try {
    const execution = await executePineScriptWithPineTS({ chartData, compileResult, generatedAt: now, source: state.source });
    dispatch({ diagnostics: execution.diagnostics, engine: execution.engine, type: "runtime_success" });
    const chartOverlay = execution.overlay;
    if (execution.requiresSeparatePane || (chartOverlay.series.length === 0 && chartOverlay.signals.length === 0)) {
      onAttachToChart?.(null);
      return;
    }

    const nextState = pineEditorReducer({ ...state, compileResult }, { chartOverlay, now, type: "attach_overlay" });
    const result = await savePineEditorState(nextState);
    if (result.error) {
      dispatch({ message: result.error, type: "save_failed" });
      return;
    }
    dispatch({ chartOverlay, now, type: "attach_overlay" });
    onAttachToChart?.(chartOverlay);
  } catch (error) {
    dispatch({ message: runtimeErrorMessage(error), type: "runtime_failed" });
  }
};

const detachCurrentOverlay = async (
  state: PineEditorState,
  dispatch: React.Dispatch<PineEditorAction>,
  onClearOverlay?: () => void,
) => {
  const nextState = pineEditorReducer(state, { type: "detach_overlay" });
  dispatch({ type: "detach_overlay" });
  onClearOverlay?.();
  const result = await savePineEditorState(nextState);
  if (result.error) dispatch({ message: result.error, type: "save_failed" });
};

const runtimeErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message;
  return "PineTS runtime failed with an unknown error.";
};

const buildSavedScript = (state: PineEditorState, now: string): PineSavedScript => ({
  checksum: state.compileResult.checksum,
  id: `pine-${state.compileResult.checksum}`,
  kind: state.compileResult.kind,
  name: state.compileResult.title,
  source: state.source,
  updatedAt: now,
});
