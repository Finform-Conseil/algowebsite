import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import type { AdvancedIndicatorsState, BollingerSettings, IndicatorPeriods } from "../indicators/advancedIndicatorsTypes";
import type { LiveSnapshot } from "../market/marketSnapshotTypes";
import type { ChartAppearance, ChartState } from "./chartStateTypes";
import type { UiState } from "./uiStateTypes";
import type { PineChartOverlayPayload } from "../../components/sidebar/panels/pineEditor/pineTypes";

export interface Alert {
  id: string;
  symbol: string;
  condition: "GREATER_THAN" | "LESS_THAN";
  value: number;
  active: boolean;
  message?: string;
  notificationChannels?: {
    email: boolean;
    push: boolean;
    sound?: boolean;
    webhook?: boolean;
  };
}


export interface Order {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  orderType: "limit" | "stop" | "market";
  triggerPrice: number;
  qty: number;
  status: "active" | "filled" | "cancelled";
  createdAt: string;
  isPaperTrade?: boolean;
  brokerId?: string;
  brokerName?: string;
  takeProfitPrice?: number;
  stopLossPrice?: number;
}

export interface TechnicalAnalysisState {
  chartConfig: ChartState;
  advancedIndicators: AdvancedIndicatorsState;
  indicatorPeriods: IndicatorPeriods;
  bollingerSettings: BollingerSettings; // [TENOR 2026 HDR] Centralized Bollinger Config
  chartAppearance: ChartAppearance;
  ui: UiState;
  alerts: Alert[];
  orders: Order[];
  marketData: Record<string, ChartDataPoint[]>;
  marketSnapshots: Record<string, LiveSnapshot>;
  pineChartOverlay: PineChartOverlayPayload | null;
}

// ============================================================================
// [TENOR 2026 FEAT] OBJECT TREE & DATA WINDOW TYPES
// ============================================================================
