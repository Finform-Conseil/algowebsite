import type { ChartType } from "../../lib/chart-types";

export interface ChartState {
  symbol: string;
  timeframe: string;
  chartType: ChartType;
  indicators: {
    sma: boolean;
    ema: boolean;
    volume: boolean;
    activeSma: number[];
    activeEma: number[];
    activeWma: number[];
    activeDema: number[];
    activeTema: number[];
    activeHma: number[];
    activeZlema: number[];
    activeAlma: number[];
    activeSmma: number[];
    activeKama: number[];
    activeVwma: number[];
  };
}

export type VolumeColorMode = "candle-body" | "session-change";

export interface ChartAppearance {
  showGrid: boolean;
  upColor: string;
  downColor: string;
  backgroundColor: string;
  showVolume: boolean;
  volumeColorMode: VolumeColorMode;
}
