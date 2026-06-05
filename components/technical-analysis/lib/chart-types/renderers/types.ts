import type { ChartDataPoint } from "../../Indicators/TechnicalIndicators";
import type { ChartTransformResult, ChartWarning } from "../domain/types";

export type ChartOptionPart = Record<string, unknown>;

export interface CustomRenderParams {
  dataIndex: number;
  dataIndexInside?: number;
  coordSys?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
}

export interface CustomRenderApi {
  value: (dimension: number) => unknown;
  coord: (data: unknown[]) => number[];
  size?: (dataSize: unknown[]) => number[];
  style: (style: Record<string, unknown>) => Record<string, unknown>;
}

export interface ChartTypePalette {
  upColor: string;
  downColor: string;
  textColor: string;
  liveColor: string;
}

export interface ChartTypeRendererContext {
  id: string;
  name: string;
  result: ChartTransformResult;
  palette: ChartTypePalette;
  latestPrice: number;
  visible: boolean;
  dateLabels: string[];
}

export interface ChartTypeRenderPlan {
  dates: string[];
  series: ChartOptionPart[];
  warnings: ChartWarning[];
  synthetic: boolean;
  volumeSourceData: ChartDataPoint[];
}

export type ChartTypeRenderer = (context: ChartTypeRendererContext) => ChartOptionPart[];
