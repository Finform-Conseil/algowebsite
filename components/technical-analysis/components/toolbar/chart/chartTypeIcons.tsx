import type { ReactNode } from "react";
import type { ChartType } from "../../../lib/chart-types";

const CHART_TYPE_ICON_CLASS: Partial<Record<ChartType, string>> = {
  line: "bi bi-graph-up",
  line_with_markers: "bi bi-activity",
  area: "bi bi-layers",
  hlc_area: "bi bi-bounding-box",
  baseline: "bi bi-distribute-vertical",
  columns: "bi bi-bar-chart",
  high_low: "bi bi-arrows-vertical",
  volume_footprint: "bi bi-grid-3x3-gap",
  time_price_opportunity: "bi bi-fonts",
  session_volume_profile: "bi bi-bar-chart-steps",
  kagi: "bi bi-bezier2",
  point_and_figure: "bi bi-x-octagon",
};

const chartBodyIconTypes: readonly ChartType[] = [
  "bars",
  "candles",
  "hollow_candles",
  "volume_candles",
  "heikin_ashi",
  "renko",
  "line_break",
  "range",
];

export const renderChartTypeIcon = (chartType: ChartType): ReactNode => {
  if (chartType === "step_line") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="22" height="22" fill="none" aria-hidden="true">
        <path d="M5 20h5v-5h6v-5h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 22.5h18" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity=".35" />
      </svg>
    );
  }

  if (chartBodyIconTypes.includes(chartType)) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="22" height="22" fill="currentColor" aria-hidden="true">
        <path d="M17 11v6h3v-6h-3zm-.5-1h4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-7a.5.5 0 0 1 .5-.5z" />
        <path d="M18 7h1v3.5h-1zm0 10.5h1V21h-1z" />
        <path d="M9 8v12h3V8H9zm-.5-1h4a.5.5 0 0 1 .5.5v13a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 .5-.5z" />
        <path d="M10 4h1v3.5h-1zm0 16.5h1V24h-1z" />
      </svg>
    );
  }

  return <i className={CHART_TYPE_ICON_CLASS[chartType] ?? "bi bi-graph-up"} aria-hidden="true" />;
};
