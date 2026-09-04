import type { ReactNode } from "react";
import type { ChartType } from "../../../lib/chart-types";

const Glyph = ({ children }: { children: ReactNode }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 28 28"
    width="22"
    height="22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.55"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

/**
 * Original clean-room chart glyphs. Each type gets its own trader-recognisable
 * silhouette; no proprietary SVG path data is copied from another terminal.
 */
export const renderChartTypeIcon = (chartType: ChartType): ReactNode => {
  switch (chartType) {
    case "bars":
      return (
        <Glyph>
          <path d="M8 4.5v19M4.5 9.5H8M8 17h4" />
          <path d="M18 6.5v15M14.5 12H18M18 17.5h4" />
        </Glyph>
      );
    case "candles":
      return (
        <Glyph>
          <path d="M8 4.5v4M8 18.5v5M19 5.5v6M19 19v3.5" />
          <rect x="5.5" y="8.5" width="5" height="10" rx=".6" fill="currentColor" stroke="none" />
          <rect x="16.5" y="11.5" width="5" height="7.5" rx=".6" fill="currentColor" stroke="none" />
        </Glyph>
      );
    case "hollow_candles":
      return (
        <Glyph>
          <path d="M8 4.5v4M8 18.5v5M19 5.5v6M19 19v3.5" />
          <rect x="5.5" y="8.5" width="5" height="10" rx=".6" />
          <rect x="16.5" y="11.5" width="5" height="7.5" rx=".6" />
        </Glyph>
      );
    case "volume_candles":
      return (
        <Glyph>
          <path d="M7.5 4.5v5M7.5 18.5v5M19 5v4M19 20v3" />
          <rect x="5.5" y="9.5" width="4" height="9" rx=".5" />
          <rect x="14.5" y="9" width="9" height="11" rx=".6" />
        </Glyph>
      );
    case "line":
      return <Glyph><path d="M3.5 20.5l6-7 5 3.5 10-10" /></Glyph>;
    case "line_with_markers":
      return (
        <Glyph>
          <path d="M3.5 20.5l6-7 5 3.5 10-10" />
          <circle cx="3.5" cy="20.5" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="9.5" cy="13.5" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="14.5" cy="17" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="24.5" cy="7" r="1.4" fill="currentColor" stroke="none" />
        </Glyph>
      );
    case "step_line":
      return <Glyph><path d="M3.5 21h6v-6h6v-6h9" /></Glyph>;
    case "area":
      return (
        <Glyph>
          <path d="M3.5 20.5l6-7 5 3.5 10-10" />
          <path d="M3.5 20.5l6-7 5 3.5 10-10v14H3.5z" fill="currentColor" fillOpacity=".16" stroke="none" />
        </Glyph>
      );
    case "hlc_area":
      return (
        <Glyph>
          <path d="M3.5 10.5l5-4 5 4 5-4 6 4" />
          <path d="M3.5 15l5-4 5 4 5-4 6 4" opacity=".72" />
          <path d="M3.5 19.5l5-4 5 4 5-4 6 4" opacity=".45" />
        </Glyph>
      );
    case "baseline":
      return (
        <Glyph>
          <path d="M3.5 14h21" strokeDasharray="2.2 2.2" opacity=".65" />
          <path d="M3.5 17.5l4-7 4 4 4-7 4 10 5-5" />
        </Glyph>
      );
    case "columns":
      return (
        <Glyph>
          <path d="M3.5 22h21" opacity=".5" />
          <rect x="5" y="13" width="3.5" height="9" />
          <rect x="11" y="7" width="3.5" height="15" />
          <rect x="17" y="16" width="3.5" height="6" />
          <rect x="23" y="10" width="2" height="12" />
        </Glyph>
      );
    case "high_low":
      return (
        <Glyph>
          <path d="M8 5v18M5.5 8H8M8 20h2.5" />
          <path d="M19 7v14M16.5 10H19M19 18h2.5" />
        </Glyph>
      );
    case "volume_footprint":
      return (
        <Glyph>
          <path d="M13.5 4.5v19" opacity=".75" />
          <path d="M13.5 7H8M13.5 10H5M13.5 13H9" />
          <path d="M13.5 16h7M13.5 19h10M13.5 22h5" />
        </Glyph>
      );
    case "time_price_opportunity":
      return (
        <Glyph>
          <path d="M5 5v18M5 7h15M5 11h10M5 15h17M5 19h13M5 23h8" />
          <path d="M9 5v18M13 5v18" opacity=".45" />
        </Glyph>
      );
    case "session_volume_profile":
      return (
        <Glyph>
          <path d="M6 4.5v19" />
          <path d="M6 7h6M6 10h12M6 13h17M6 16h10M6 19h14M6 22h8" />
        </Glyph>
      );
    case "heikin_ashi":
      return (
        <Glyph>
          <path d="M7 4v5M7 17v5M14 7v4M14 20v4M21 5v7M21 18v4" />
          <rect x="5" y="9" width="4" height="8" rx=".5" />
          <rect x="12" y="11" width="4" height="9" rx=".5" fill="currentColor" fillOpacity=".28" />
          <rect x="19" y="12" width="4" height="6" rx=".5" />
        </Glyph>
      );
    case "renko":
      return (
        <Glyph>
          <path d="M4.5 18.5h6v6h-6zM10.5 12.5h6v6h-6zM16.5 6.5h6v6h-6z" />
        </Glyph>
      );
    case "line_break":
      return (
        <Glyph>
          <rect x="5" y="8" width="4.5" height="11" />
          <rect x="11.75" y="5" width="4.5" height="8" />
          <rect x="18.5" y="12" width="4.5" height="10" />
        </Glyph>
      );
    case "kagi":
      return (
        <Glyph>
          <path d="M5 22V8h7v10h6V5h5" strokeWidth="2" />
          <path d="M12 8v10" strokeWidth="3.2" opacity=".78" />
        </Glyph>
      );
    case "point_and_figure":
      return (
        <Glyph>
          <path d="M4.5 6l5 5M9.5 6l-5 5M4.5 17l5 5M9.5 17l-5 5" />
          <circle cx="18.5" cy="8.5" r="3" />
          <circle cx="18.5" cy="19.5" r="3" />
        </Glyph>
      );
    case "range":
      return (
        <Glyph>
          <path d="M7 5v18M7 5h4M7 23h4" />
          <path d="M18 8v13M14 8h4M14 21h4" />
        </Glyph>
      );
    default:
      return <Glyph><path d="M3.5 20.5l6-7 5 3.5 10-10" /></Glyph>;
  }
};
