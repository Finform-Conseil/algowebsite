import React from "react";
import type {
  DataWindowCandleValues,
  DataAnomalyFlag,
} from "../../../config/object-tree/objectTreeTypes";
import { TV } from "./objectTreePanelStyles";

const formatPrice = (value: number): string =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatPercent = (value: number): string =>
  (value >= 0 ? "+" : "") +
  value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
  "%";

const formatChangeWithPercent = (value: number, percent: number): string =>
  (value >= 0 ? "+" : "") + formatPrice(value) + " (" + formatPercent(percent) + ")";

const formatVolume = (value: number): string => {
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(2) + "M";
  if (value >= 1_000) return (value / 1_000).toFixed(1) + "K";
  return String(value);
};

const resolveInstrumentLabel = (symbolDisplay?: string): string => {
  const source = (symbolDisplay || "BOAB · BRVM, 1D").trim();
  const parts = source
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 3) return parts[0] + " · " + parts[1] + " · " + parts[2];
  if (parts.length === 2) {
    const [symbol, venueAndTimeframe] = parts;
    const [venue, timeframe] = venueAndTimeframe
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    return symbol + " · " + (timeframe || "1D") + " · " + (venue || "BRVM");
  }

  return (parts[0] || "BOAB") + " · 1D · BRVM";
};

// ============================================================================
// Sub-components
// ============================================================================

type DataWindowMetricRowProps = {
  id: string;
  label: string;
  value: string;
  color: string;
};

const DataWindowMetricRow: React.FC<DataWindowMetricRowProps> = ({ id, label, value, color }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      minHeight: 29,
      padding: "5px 14px",
      borderBottom: TV.divider,
    }}
  >
    <span style={{ fontSize: 12, color: TV.labelColor }}>{label}</span>
    <span
      id={id}
      style={{ fontSize: 12, fontWeight: 600, color, textAlign: "right", whiteSpace: "nowrap" }}
    >
      {value}
    </span>
  </div>
);

// ============================================================================
// [TENOR 2026 — Option F] Financial Proof sub-components
// ============================================================================

/** Label de provenance de la donnée avec codage couleur */
const ProvenanceBadge: React.FC<{ label?: string }> = ({ label = "BRVM CSV" }) => {
  const color =
    label === "BRVM Live" ? "#22c55e" : label === "BRVM CSV" ? "#38bdf8" : "#94a3b8";

  const icon =
    label === "BRVM Live"
      ? "bi bi-circle-fill"
      : label === "BRVM CSV"
        ? "bi bi-file-earmark-text"
        : "bi bi-archive";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 14px 3px",
        borderBottom: TV.divider,
        minHeight: 22,
      }}
    >
      <i
        className={icon}
        style={{ fontSize: 8, color, flexShrink: 0 }}
        aria-hidden="true"
      />
      {/* dw-provenance-label : anchor DOM mis à jour directement par le hook RAF */}
      <span
        id="dw-provenance-label"
        style={{ fontSize: 10, fontWeight: 600, color, letterSpacing: "0.02em" }}
      >
        {label}
      </span>
    </div>
  );
};

/** Labels d'affichage pour chaque code d'anomalie */
const ANOMALY_FLAG_LABELS: Record<DataAnomalyFlag, string> = {
  ZERO_VOLUME: "Vol. zéro",
  ZERO_PRICE: "Prix zéro",
  SUSPICIOUS_SPREAD: "Spread suspect",
  NO_TRADES: "Aucune transaction",
  STALE_DATA: "Données stale",
  EXTREME_CHANGE: "Variation extrême",
};

/**
 * Banner d'anomalie — affiché si des flags sont détectés sur la bougie courante.
 * [Option F] Le DOM est pré-alloué (display:none par défaut) et mis à jour
 * directement par le hook RAF via `document.getElementById("dw-anomaly-banner")`.
 * Zero re-render React sur le chemin haute-fréquence.
 */
const AnomalyBanner: React.FC<{ flags?: DataAnomalyFlag[] }> = ({ flags }) => {
  const hasFlags = flags && flags.length > 0;
  const text = hasFlags
    ? flags.map((f) => ANOMALY_FLAG_LABELS[f]).join(" · ")
    : "";

  return (
    /* dw-anomaly-banner : anchor DOM mis à jour directement par le hook RAF */
    <div
      id="dw-anomaly-banner"
      role="alert"
      aria-live="polite"
      style={{
        display: hasFlags ? "flex" : "none",
        alignItems: "flex-start",
        gap: 6,
        padding: "5px 14px",
        borderBottom: TV.divider,
        backgroundColor: "rgba(234, 179, 8, 0.08)",
        borderLeft: "2px solid #ca8a04",
      }}
    >
      <i
        className="bi bi-exclamation-triangle-fill"
        style={{ fontSize: 10, color: "#facc15", flexShrink: 0, marginTop: 1 }}
        aria-hidden="true"
      />
      {/* dw-anomaly-text : anchor DOM mis à jour directement par le hook RAF */}
      <span
        id="dw-anomaly-text"
        style={{ fontSize: 10, color: "#fde68a", lineHeight: "1.4", wordBreak: "break-word" }}
      >
        {text}
      </span>
    </div>
  );
};

// ============================================================================
// Main DataWindowTab component
// ============================================================================

export const DataWindowTab: React.FC<{
  data: DataWindowCandleValues | null;
  symbolDisplay?: string;
}> = ({ data, symbolDisplay }) => {
  const [isDataHidden, setIsDataHidden] = React.useState(false);

  if (!data) {
    return (
      <div
        style={{
          padding: "20px 14px",
          color: TV.labelColor,
          fontSize: 12,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        Survolez le graphique pour afficher les données.
      </div>
    );
  }

  const candleColor = data.isUp ? TV.bullColor : TV.bearColor;
  const changeColor = data.change >= 0 ? TV.bullColor : TV.bearColor;
  const instrumentLabel = resolveInstrumentLabel(symbolDisplay);

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* ── Date header ──────────────────────────────────────────── */}
      <div style={{ padding: "8px 14px 6px", borderBottom: TV.divider }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: TV.labelColor,
            textTransform: "uppercase",
            letterSpacing: 0,
          }}
        >
          Date
        </span>
        <span
          id="dw-date"
          style={{ fontSize: 12, fontWeight: 700, color: TV.tabText, float: "right" }}
        >
          {data.date}
        </span>
      </div>

      {/* ── Instrument label + hide toggle ───────────────────────── */}
      <div
        style={{
          minHeight: 36,
          padding: "6px 14px 4px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          borderBottom: TV.divider,
        }}
      >
        <span style={{ fontSize: 11, color: TV.tabMuted }}>
          <i className="bi bi-layers" />
        </span>
        <span
          style={{
            minWidth: 0,
            flex: 1,
            fontSize: 12,
            fontWeight: 700,
            color: TV.tabText,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {instrumentLabel}
        </span>
        <button
          id="dw-main-hide-data"
          type="button"
          aria-pressed={isDataHidden}
          title={isDataHidden ? "Show data" : "Hide data"}
          onClick={() => setIsDataHidden((current) => !current)}
          style={{
            border: "none",
            background: "transparent",
            color: TV.iconBtn,
            cursor: "pointer",
            fontSize: 11,
            padding: "2px 0 2px 6px",
            whiteSpace: "nowrap",
          }}
        >
          {isDataHidden ? "Show data" : "Hide data"}
        </button>
      </div>

      {/* ── [Option F] Provenance badge ───────────────────────────── */}
      <ProvenanceBadge label={data.provenanceLabel} />

      {/* ── [Option F] Anomaly banner (pre-allocated, zero-lag) ──── */}
      <AnomalyBanner flags={data.anomalyFlags} />

      {/* ── Main OHLCV metric rows ────────────────────────────────── */}
      <div
        id="dw-main-data-rows"
        aria-hidden={isDataHidden}
        style={{ display: isDataHidden ? "none" : "block" }}
      >
        <DataWindowMetricRow
          id="dw-open"
          label="Open"
          value={formatPrice(data.open)}
          color={candleColor}
        />
        <DataWindowMetricRow
          id="dw-high"
          label="High"
          value={formatPrice(data.high)}
          color={candleColor}
        />
        <DataWindowMetricRow
          id="dw-low"
          label="Low"
          value={formatPrice(data.low)}
          color={candleColor}
        />
        <DataWindowMetricRow
          id="dw-close"
          label="Close"
          value={formatPrice(data.close)}
          color={candleColor}
        />
        <DataWindowMetricRow
          id="dw-change"
          label="Change"
          value={formatChangeWithPercent(data.change, data.changePercent)}
          color={changeColor}
        />
        <DataWindowMetricRow
          id="dw-volume"
          label="Vol"
          value={formatVolume(data.volume)}
          color={TV.valueColor}
        />
        <DataWindowMetricRow
          id="dw-last-day-change"
          label="Last day change"
          value={formatChangeWithPercent(data.lastDayChange, data.lastDayChangePercent)}
          color={changeColor}
        />

        {/* ── [TENOR 2026 HDR] Comparison symbol slots (Torvalds T3) */}
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={"comp-slot-" + index}
            id={"dw-comp-row-" + index}
            style={{
              display: "none",
              justifyContent: "space-between",
              alignItems: "center",
              minHeight: 29,
              padding: "5px 14px",
              borderBottom: TV.divider,
            }}
          >
            <span
              id={"dw-comp-symbol-" + index}
              style={{ fontSize: 12, color: TV.labelColor, fontWeight: 600 }}
            />
            <span id={"dw-comp-val-" + index} style={{ fontSize: 12, fontWeight: 600 }} />
          </div>
        ))}
      </div>
    </div>
  );
};
