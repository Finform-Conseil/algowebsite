import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";

export type VelaNativeBackend = "canvas2d" | "webgl2";

export interface FinancialChartMountOptions {
  symbol: string;
  timeframe: string;
  backend: VelaNativeBackend;
}

export interface FinancialChartVisibleRange {
  from: number;
  to: number;
}

export interface FinancialChartInteractionCapabilities {
  readonly dragPan: boolean;
  readonly wheelZoom: boolean;
  readonly crosshair: boolean;
  readonly resize: boolean;
  readonly nativePriceAutoscale: boolean;
  readonly programmaticPriceAutoscale: boolean;
  readonly currentPriceLine: boolean;
  readonly programmaticPan: boolean;
  readonly visibleRange: boolean;
  readonly fitAll: boolean;
}

export type FinancialChartViewportListener = (range: FinancialChartVisibleRange) => void;

export interface FinancialChartInteractionController {
  readonly capabilities: FinancialChartInteractionCapabilities;
  getVisibleRange(): FinancialChartVisibleRange | null;
  setVisibleRange(range: FinancialChartVisibleRange): void;
  panBy(fraction: number): void;
  fitAll(): void;
  setCurrentPriceLineVisible(visible: boolean): void;
  onViewportChange(listener: FinancialChartViewportListener): () => void;
  resize(): void;
}

export interface FinancialChartEngine extends FinancialChartInteractionController {
  readonly id: string;
  mount(
    container: HTMLElement,
    bars: readonly ChartDataPoint[],
    options: FinancialChartMountOptions,
  ): Promise<void>;
  setBars(bars: readonly ChartDataPoint[]): Promise<void>;
  destroy(): void;
}

export interface EpochOhlcvBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const toEpochOhlcvBars = (bars: readonly ChartDataPoint[]): EpochOhlcvBar[] => {
  const result: EpochOhlcvBar[] = [];
  for (const bar of bars) {
    const time = Date.parse(String(bar.time));
    if (!Number.isFinite(time)) continue;
    if (![bar.open, bar.high, bar.low, bar.close, bar.volume].every(Number.isFinite)) continue;
    result.push({
      time,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
      volume: bar.volume,
    });
  }
  return result;
};
