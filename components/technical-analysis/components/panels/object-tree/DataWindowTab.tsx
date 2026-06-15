import React from "react";
import type { DataWindowCandleValues } from "../../../config/object-tree/objectTreeTypes";
import { TV } from "./objectTreePanelStyles";

const formatPrice = (value: number): string => value.toLocaleString("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatPercent = (value: number): string =>
  (value >= 0 ? "+" : "") + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";

const formatChangeWithPercent = (value: number, percent: number): string =>
  (value >= 0 ? "+" : "") + formatPrice(value) + " (" + formatPercent(percent) + ")";

const formatVolume = (value: number): string => {
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(2) + "M";
  if (value >= 1_000) return (value / 1_000).toFixed(1) + "K";
  return String(value);
};

const resolveInstrumentLabel = (symbolDisplay?: string): string => {
  const source = (symbolDisplay || "BOAB · BRVM, 1D").trim();
  const parts = source.split("·").map((part) => part.trim()).filter(Boolean);

  if (parts.length >= 3) return parts[0] + " · " + parts[1] + " · " + parts[2];
  if (parts.length === 2) {
    const [symbol, venueAndTimeframe] = parts;
    const [venue, timeframe] = venueAndTimeframe.split(",").map((part) => part.trim()).filter(Boolean);
    return symbol + " · " + (timeframe || "1D") + " · " + (venue || "BRVM");
  }

  return (parts[0] || "BOAB") + " · 1D · BRVM";
};

type DataWindowMetricRowProps = {
  id: string;
  label: string;
  value: string;
  color: string;
};

const DataWindowMetricRow: React.FC<DataWindowMetricRowProps> = ({ id, label, value, color }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 29, padding: "5px 14px", borderBottom: TV.divider }}>
    <span style={{ fontSize: 12, color: TV.labelColor }}>{label}</span>
    <span id={id} style={{ fontSize: 12, fontWeight: 600, color, textAlign: "right", whiteSpace: "nowrap" }}>{value}</span>
  </div>
);

export const DataWindowTab: React.FC<{ data: DataWindowCandleValues | null; symbolDisplay?: string }> = ({ data, symbolDisplay }) => {
  const [isDataHidden, setIsDataHidden] = React.useState(false);

  if (!data) {
    return (
      <div style={{ padding: "20px 14px", color: TV.labelColor, fontSize: 12, fontFamily: "Inter, system-ui, sans-serif" }}>
        Survolez le graphique pour afficher les donnees.
      </div>
    );
  }

  const candleColor = data.isUp ? TV.bullColor : TV.bearColor;
  const changeColor = data.change >= 0 ? TV.bullColor : TV.bearColor;
  const instrumentLabel = resolveInstrumentLabel(symbolDisplay);

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ padding: "8px 14px 6px", borderBottom: TV.divider }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: TV.labelColor, textTransform: "uppercase", letterSpacing: 0 }}>
          Date
        </span>
        <span id="dw-date" style={{ fontSize: 12, fontWeight: 700, color: TV.tabText, float: "right" }}>
          {data.date}
        </span>
      </div>
      <div style={{ minHeight: 36, padding: "6px 14px 4px", display: "flex", alignItems: "center", gap: 6, borderBottom: TV.divider }}>
        <span style={{ fontSize: 11, color: TV.tabMuted }}>
          <i className="bi bi-layers" />
        </span>
        <span style={{ minWidth: 0, flex: 1, fontSize: 12, fontWeight: 700, color: TV.tabText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
      <div id="dw-main-data-rows" aria-hidden={isDataHidden} style={{ display: isDataHidden ? "none" : "block" }}>
        <DataWindowMetricRow id="dw-open" label="Open" value={formatPrice(data.open)} color={candleColor} />
        <DataWindowMetricRow id="dw-high" label="High" value={formatPrice(data.high)} color={candleColor} />
        <DataWindowMetricRow id="dw-low" label="Low" value={formatPrice(data.low)} color={candleColor} />
        <DataWindowMetricRow id="dw-close" label="Close" value={formatPrice(data.close)} color={candleColor} />
        <DataWindowMetricRow id="dw-change" label="Change" value={formatChangeWithPercent(data.change, data.changePercent)} color={changeColor} />
        <DataWindowMetricRow id="dw-volume" label="Vol" value={formatVolume(data.volume)} color={TV.valueColor} />
        <DataWindowMetricRow id="dw-last-day-change" label="Last day change" value={formatChangeWithPercent(data.lastDayChange, data.lastDayChangePercent)} color={changeColor} />
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={"comp-slot-" + index}
            id={"dw-comp-row-" + index}
            style={{ display: "none", justifyContent: "space-between", alignItems: "center", minHeight: 29, padding: "5px 14px", borderBottom: TV.divider }}
          >
            <span id={"dw-comp-symbol-" + index} style={{ fontSize: 12, color: TV.labelColor, fontWeight: 600 }}></span>
            <span id={"dw-comp-val-" + index} style={{ fontSize: 12, fontWeight: 600 }}></span>
          </div>
        ))}
      </div>
    </div>
  );
};
