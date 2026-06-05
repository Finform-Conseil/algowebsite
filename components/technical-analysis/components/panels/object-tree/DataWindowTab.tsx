import React from "react";
import type { DataWindowCandleValues } from "../../../config/object-tree/objectTreeTypes";
import { TV } from "./objectTreePanelStyles";

const formatPrice = (value: number): string => value.toLocaleString("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatVolume = (value: number): string => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
};

type DataWindowMetricRowProps = {
  id: string;
  label: string;
  value: string;
  color: string;
};

const DataWindowMetricRow: React.FC<DataWindowMetricRowProps> = ({ id, label, value, color }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 14px", borderBottom: TV.divider }}>
    <span style={{ fontSize: 12, color: TV.labelColor }}>{label}</span>
    <span id={id} style={{ fontSize: 12, fontWeight: 600, color }}>{value}</span>
  </div>
);

export const DataWindowTab: React.FC<{ data: DataWindowCandleValues | null }> = ({ data }) => {
  if (!data) {
    return (
      <div style={{ padding: "20px 14px", color: TV.labelColor, fontSize: 12, fontFamily: "Inter, system-ui, sans-serif" }}>
        Survolez le graphique pour afficher les données.
      </div>
    );
  }

  const valueColor = data.isUp ? TV.bullColor : TV.bearColor;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ padding: "8px 14px 6px", borderBottom: TV.divider }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: TV.labelColor, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Date
        </span>
        <span id="dw-date" style={{ fontSize: 12, fontWeight: 700, color: TV.tabText, float: "right" }}>
          {data.date}
        </span>
      </div>
      <div style={{ padding: "6px 14px 4px", display: "flex", alignItems: "center", gap: 6, borderBottom: TV.divider }}>
        <span style={{ fontSize: 11, color: TV.tabMuted }}>
          <i className="bi bi-layers" />
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: TV.tabText }}>OHLCV</span>
      </div>
      <DataWindowMetricRow id="dw-open" label="Open" value={formatPrice(data.open)} color={valueColor} />
      <DataWindowMetricRow id="dw-high" label="High" value={formatPrice(data.high)} color={valueColor} />
      <DataWindowMetricRow id="dw-low" label="Low" value={formatPrice(data.low)} color={valueColor} />
      <DataWindowMetricRow id="dw-close" label="Close" value={formatPrice(data.close)} color={valueColor} />
      <DataWindowMetricRow id="dw-change" label="Change" value={`${data.change >= 0 ? "+" : ""}${formatPrice(data.change)}`} color={valueColor} />
      <DataWindowMetricRow id="dw-volume" label="Volume" value={formatVolume(data.volume)} color={TV.valueColor} />
      {[0, 1, 2, 3, 4].map((index) => (
        <div
          key={`comp-slot-${index}`}
          id={`dw-comp-row-${index}`}
          style={{ display: "none", justifyContent: "space-between", alignItems: "center", padding: "5px 14px", borderBottom: TV.divider }}
        >
          <span id={`dw-comp-symbol-${index}`} style={{ fontSize: 12, color: TV.labelColor, fontWeight: 600 }}></span>
          <span id={`dw-comp-val-${index}`} style={{ fontSize: 12, fontWeight: 600 }}></span>
        </div>
      ))}
    </div>
  );
};
