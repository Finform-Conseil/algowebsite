import type React from "react";
import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import type { DisplaySecurity } from "../../config/market/marketSnapshotTypes";

export interface TechnicalAnalysisSidebarProps {
  sidebarRef: React.RefObject<HTMLElement | null>;
  security: DisplaySecurity;
  chartData: ChartDataPoint[];
  livePrice: number;
  isMarketPositive: boolean;
  liveChange: number;
  liveChangePercent: number;
  lastUpdate?: string;
  marketSourceLabel?: string;
  marketSourceStatus?: "live" | "fallback" | "derived";
  liveVolume?: number;
  liveMarketCap?: number;
  liveReturnYTD?: number;
  livePeRatio?: number;
  isLoading?: boolean;
  currentVolume: number;
  avgVolume: number;
  benefitsChartRef: React.RefObject<HTMLDivElement | null>;
  dividendsChartRef: React.RefObject<HTMLDivElement | null>;
  dataMode: "mock" | "real";
  overlayContent?: React.ReactNode;
  isObjectTreeOpen?: boolean;
  onToggleObjectTree?: () => void;
  openTickerSelector?: () => void;
}

export type IncomeViewMode = "annual" | "quarterly";
export type SidebarClipboardKey = "isin" | "figi";

export interface SidebarFinancialMetrics {
  calculatedYield: number;
  hasValidPayout: boolean;
  hasValidYield: boolean;
  payoutRatio: number;
}

export interface SidebarTechnicalData {
  rsi: number;
  score: number;
  sentiment: string;
  sma20: number;
  sma50: number;
}

export interface SidebarAnalystData {
  label: string;
  pctChange: number;
  priceTarget: number;
  score: number;
  targetFormula: string;
}
