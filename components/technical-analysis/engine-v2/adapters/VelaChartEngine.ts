import type { Vela } from "@luxalgo/vela";

import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import {
  toEpochOhlcvBars,
  type FinancialChartEngine,
  type FinancialChartInteractionCapabilities,
  type FinancialChartMountOptions,
  type FinancialChartViewportListener,
  type FinancialChartVisibleRange,
} from "../domain/FinancialChartEngine";

export const VELA_INTERACTION_CAPABILITIES: FinancialChartInteractionCapabilities = Object.freeze({
  dragPan: true,
  wheelZoom: true,
  crosshair: true,
  resize: true,
  nativePriceAutoscale: true,
  programmaticPriceAutoscale: false,
  currentPriceLine: true,
  programmaticPan: true,
  visibleRange: true,
  fitAll: true,
});

type VelaRendererPort = Pick<Vela["renderer"], "supports" | "set">;

type VelaChartPort = Pick<
  Vela,
  | "ready"
  | "setMarket"
  | "resize"
  | "destroy"
  | "panBy"
  | "getVisibleRange"
  | "setVisibleRange"
  | "setVisibleRangePreset"
  | "on"
> & { readonly renderer: VelaRendererPort };

type VelaChartFactory = (
  container: HTMLElement,
  options: ConstructorParameters<typeof Vela>[1],
) => Promise<VelaChartPort>;

const createVelaChart: VelaChartFactory = async (container, options) => {
  const { Vela: VelaConstructor } = await import("@luxalgo/vela");
  return new VelaConstructor(container, options);
};

const assertFinite = (value: number, label: string): void => {
  if (!Number.isFinite(value)) throw new TypeError(`${label} must be finite`);
};

const assertVisibleRange = (range: FinancialChartVisibleRange): void => {
  if (!Number.isFinite(range.from) || !Number.isFinite(range.to) || range.to <= range.from) {
    throw new RangeError("visible range must contain finite from/to values with to > from");
  }
};

export class VelaChartEngine implements FinancialChartEngine {
  public readonly id = "vela-native";
  public readonly capabilities = VELA_INTERACTION_CAPABILITIES;

  private chart: VelaChartPort | null = null;
  private generation = 0;
  private viewportUnsubscribe: (() => void) | null = null;
  private readonly viewportListeners = new Set<FinancialChartViewportListener>();

  public constructor(private readonly createChart: VelaChartFactory = createVelaChart) {}

  public async mount(
    container: HTMLElement,
    bars: readonly ChartDataPoint[],
    options: FinancialChartMountOptions,
  ): Promise<void> {
    this.disposeChart();
    const generation = ++this.generation;
    const chart = await this.createChart(container, {
      data: toEpochOhlcvBars(bars),
      timeframe: options.timeframe,
      theme: "dark",
      nativeBackend: options.backend,
      priceStyle: "candles",
      currentPriceLine: true,
      animations: { zoom: true, pan: true, scroll: true, autoscale: true, liveBar: false },
      drawings: false,
    });
    if (generation !== this.generation) {
      chart.destroy();
      return;
    }

    this.chart = chart;
    this.viewportUnsubscribe = chart.on("viewport:changed", (range) => {
      if (this.chart !== chart) return;
      const snapshot = Object.freeze({ from: range.from, to: range.to });
      for (const listener of this.viewportListeners) listener(snapshot);
    });

    await chart.ready();

    if (generation !== this.generation || this.chart !== chart) {
      this.disposeChartInstance(chart);
    }
  }

  public async setBars(bars: readonly ChartDataPoint[]): Promise<void> {
    const chart = this.chart;
    if (!chart) return;
    await chart.setMarket({ data: toEpochOhlcvBars(bars) });
  }

  public getVisibleRange(): FinancialChartVisibleRange | null {
    const range = this.chart?.getVisibleRange() ?? null;
    return range ? { from: range.from, to: range.to } : null;
  }

  public setVisibleRange(range: FinancialChartVisibleRange): void {
    assertVisibleRange(range);
    this.chart?.setVisibleRange(range);
  }

  public panBy(fraction: number): void {
    assertFinite(fraction, "pan fraction");
    this.chart?.panBy(fraction);
  }

  public fitAll(): void {
    this.chart?.setVisibleRangePreset("ALL");
  }

  public setCurrentPriceLineVisible(visible: boolean): void {
    const renderer = this.chart?.renderer;
    if (!renderer?.supports("currentPriceLine")) return;
    renderer.set("currentPriceLine", visible);
  }

  public onViewportChange(listener: FinancialChartViewportListener): () => void {
    this.viewportListeners.add(listener);
    return () => this.viewportListeners.delete(listener);
  }

  public resize(): void {
    this.chart?.resize();
  }

  public destroy(): void {
    this.generation += 1;
    this.disposeChart();
    this.viewportListeners.clear();
  }

  private disposeChart(): void {
    const chart = this.chart;
    this.chart = null;
    this.viewportUnsubscribe?.();
    this.viewportUnsubscribe = null;
    chart?.destroy();
  }

  private disposeChartInstance(chart: VelaChartPort): void {
    if (this.chart === chart) this.chart = null;
    this.viewportUnsubscribe?.();
    this.viewportUnsubscribe = null;
    chart.destroy();
  }
}
