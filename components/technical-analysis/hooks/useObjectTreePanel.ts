/**
 * [TENOR 2026 FEAT] useObjectTreePanel
 *
 * Hook métier du panneau "Object Tree & Data Window".
 * Responsabilités :
 * 1. Gérer l'état ouvert/fermé du panneau et l'onglet actif.
 * 2. Exposer les valeurs OHLCV de la bougie pointée via le curseur ECharts.
 *
 * [TENOR 2026 FIX] SCAR-PERF-05 : Éradication du DataWindow Bottleneck.
 * Remplacement du `setState` à 60Hz par une manipulation directe du DOM via `requestAnimationFrame`.
 * Le state React n'est utilisé qu'une seule fois pour monter la grille, puis le DOM prend le relais.
 *
 * [TENOR 2026 SRE] Self-Healing DOM Check :
 * Le hook vérifie l'existence physique des nœuds DOM (`document.getElementById`) au lieu
 * de se fier à un `useRef` booléen. Cela garantit une synchronisation parfaite même si
 * React démonte et remonte le composant de manière inattendue.
 * 
 * [TENOR 2026 HDR] COMPARE SYMBOLS DATAWINDOW (Torvalds T3)
 * Extraction O(1) des performances relatives des symboles comparés depuis l'instance ECharts,
 * injectées directement dans 5 slots DOM pré-alloués pour garantir 60 FPS.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { EChartsType } from "echarts/core";
import type { RefObject } from "react";
import type { ObjectTreePanelTab, DataWindowCandleValues } from "../config/object-tree/objectTreeTypes";
import type { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";

// ============================================================================
// HELPERS
// ============================================================================

const formatDataWindowDate = (raw: string | number): string => {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "---";
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
};

const fmtPrice = (v: number): string =>
  v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtVol = (v: number): string =>
  v >= 1_000_000
    ? (v / 1_000_000).toFixed(2) + "M"
    : v >= 1_000
      ? (v / 1_000).toFixed(1) + "K"
      : String(v);

const fmtPercent = (v: number): string =>
  (v >= 0 ? "+" : "") + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";

const fmtChangeWithPercent = (value: number, percent: number): string =>
  (value >= 0 ? "+" : "") + fmtPrice(value) + " (" + fmtPercent(percent) + ")";

const resolveChangeMetrics = (data: ChartDataPoint[], idx: number, candle: ChartDataPoint) => {
  const previousClose = idx > 0 && Number.isFinite(data[idx - 1]?.close)
    ? data[idx - 1].close
    : candle.open;
  const baseline = previousClose !== 0 ? previousClose : candle.open;
  const change = candle.close - baseline;
  const changePercent = baseline !== 0 ? (change / baseline) * 100 : 0;

  return {
    change,
    changePercent,
    lastDayChange: change,
    lastDayChangePercent: changePercent,
  };
};

const resolveAxisPointerIndex = (
  params: {
    dataIndex?: number;
    axesInfo?: Array<{ value?: string | number }>;
  },
  data: ChartDataPoint[]
): number | null => {
  if (Number.isInteger(params.dataIndex)) return params.dataIndex as number;
  const rawValue = params.axesInfo?.find((axis) => axis.value !== undefined)?.value;
  if (rawValue === undefined) return null;

  const numericValue = typeof rawValue === "number" ? rawValue : Number(rawValue);
  if (Number.isInteger(numericValue)) return numericValue;

  const rawTime = String(rawValue);
  const exactIndex = data.findIndex((candle) => candle.time === rawTime);
  if (exactIndex !== -1) return exactIndex;

  const rawTimestamp = new Date(rawTime).getTime();
  if (!Number.isFinite(rawTimestamp)) return null;

  const timestampIndex = data.findIndex((candle) => new Date(candle.time).getTime() === rawTimestamp);
  return timestampIndex === -1 ? null : timestampIndex;
};

type AxisPointerPayload = {
  dataIndex?: number;
  axesInfo?: Array<{ value?: string | number }>;
};

const isAxisPointerPayload = (value: unknown): value is AxisPointerPayload =>
  typeof value === "object" && value !== null;

type ZrMouseMovePayload = {
  offsetX?: number;
  offsetY?: number;
  event?: {
    offsetX?: number;
    offsetY?: number;
  };
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const resolveZrMousePoint = (payload: ZrMouseMovePayload): [number, number] | null => {
  const offsetX = isFiniteNumber(payload.offsetX) ? payload.offsetX : payload.event?.offsetX;
  const offsetY = isFiniteNumber(payload.offsetY) ? payload.offsetY : payload.event?.offsetY;
  return isFiniteNumber(offsetX) && isFiniteNumber(offsetY) ? [offsetX, offsetY] : null;
};

const resolvePixelPointerIndex = (
  chart: EChartsType,
  payload: ZrMouseMovePayload,
): number | null => {
  const point = resolveZrMousePoint(payload);
  if (!point) return null;
  if (!chart.containPixel({ gridIndex: 0 }, point)) return null;

  const pointInData = chart.convertFromPixel({ xAxisIndex: 0, yAxisIndex: 0 }, point);
  const rawIndex = Array.isArray(pointInData) ? pointInData[0] : pointInData;
  if (!isFiniteNumber(rawIndex)) return null;
  return Math.round(rawIndex);
};

type ComparisonDataWindowSeries = {
  id?: string;
  name?: string;
  data?: unknown[];
  itemStyle?: { color?: string };
  lineStyle?: { opacity?: number };
};

const isComparisonDataWindowSeries = (value: unknown): value is ComparisonDataWindowSeries => {
  if (typeof value !== "object" || value === null) return false;
  const series = value as ComparisonDataWindowSeries;
  return typeof series.id === "string" && series.id.startsWith("compare-") && series.lineStyle?.opacity !== 0;
};

// ============================================================================
// TYPES
// ============================================================================

interface UseObjectTreePanelProps {
  chartInstanceRef: RefObject<EChartsType | null>;
  chartData: ChartDataPoint[];
}

interface UseObjectTreePanelReturn {
  isOpen: boolean;
  activeTab: ObjectTreePanelTab;
  togglePanel: () => void;
  setActiveTab: (tab: ObjectTreePanelTab) => void;
  dataWindow: DataWindowCandleValues | null;
}

// ============================================================================
// HOOK
// ============================================================================

export const useObjectTreePanel = ({
  chartInstanceRef,
  chartData,
}: UseObjectTreePanelProps): UseObjectTreePanelReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ObjectTreePanelTab>("object_tree");

  // [TENOR SRE] Ref pour éviter la closure stale sur chartData dans le listener ECharts
  const chartDataRef = useRef<ChartDataPoint[]>(chartData);
  useEffect(() => {
    chartDataRef.current = chartData;
  }, [chartData]);

  // State is only used for initial mount or recovery
  const [dataWindow, setDataWindow] = useState<DataWindowCandleValues | null>(null);
  const lastDataWindowIndexRef = useRef<number | null>(null);
  const comparisonSeriesCacheRef = useRef<{ updatedAt: number; series: ComparisonDataWindowSeries[] }>({
    updatedAt: 0,
    series: [],
  });

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // ============================================================================
  // [TENOR 2026] Écoute des événements curseur ECharts pour le Data Window
  // Se branche/débranche selon l'état isOpen pour éviter un overhead permanent.
  // ============================================================================
  useEffect(() => {
    if (!isOpen) return;

    const chart = chartInstanceRef.current;
    if (!chart || chart.isDisposed()) return;

    let rafId: number;

    const updateDataWindowAtIndex = (idx: number) => {
      const data = chartDataRef.current;
      if (idx < 0 || idx >= data.length) return;

      const candle = data[idx];
      if (!candle) return;

      const isUp = candle.close >= candle.open;
      const changeMetrics = resolveChangeMetrics(data, idx, candle);
      const dateEl = document.getElementById("dw-date");
      if (lastDataWindowIndexRef.current === idx && dateEl) return;
      lastDataWindowIndexRef.current = idx;

      // [TENOR 2026 SRE FIX] SCAR-PERF-05: Self-Healing DOM Check
      // Instead of relying on a fragile boolean ref, we check if the DOM node actually exists.
      // If it doesn't (initial mount or React unmounted it), we trigger a React state update.
      if (!dateEl) {
        // Fallback React State (Includes empty comparisons array to satisfy type)
        setDataWindow({
          date: formatDataWindowDate(candle.time),
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume ?? 0,
          change: changeMetrics.change,
          changePercent: changeMetrics.changePercent,
          lastDayChange: changeMetrics.lastDayChange,
          lastDayChangePercent: changeMetrics.lastDayChangePercent,
          isUp,
        });
        return;
      }

      // 2. High-Frequency Updates: Direct DOM Manipulation (Zero-Lag)
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const candleColor = isUp ? "#26a69a" : "#ef5350"; // TV.bullColor : TV.bearColor
        const changeColor = changeMetrics.change >= 0 ? "#26a69a" : "#ef5350";

        // --- MAIN OHLCV UPDATE ---
        dateEl.textContent = formatDataWindowDate(candle.time);

        const openEl = document.getElementById("dw-open");
        if (openEl) {
          openEl.textContent = fmtPrice(candle.open);
          openEl.style.color = candleColor;
        }

        const highEl = document.getElementById("dw-high");
        if (highEl) {
          highEl.textContent = fmtPrice(candle.high);
          highEl.style.color = candleColor;
        }

        const lowEl = document.getElementById("dw-low");
        if (lowEl) {
          lowEl.textContent = fmtPrice(candle.low);
          lowEl.style.color = candleColor;
        }

        const closeEl = document.getElementById("dw-close");
        if (closeEl) {
          closeEl.textContent = fmtPrice(candle.close);
          closeEl.style.color = candleColor;
        }

        const volEl = document.getElementById("dw-volume");
        if (volEl) {
          volEl.textContent = fmtVol(candle.volume ?? 0);
        }

        const changeEl = document.getElementById("dw-change");
        if (changeEl) {
          changeEl.textContent = fmtChangeWithPercent(changeMetrics.change, changeMetrics.changePercent);
          changeEl.style.color = changeColor;
        }

        const lastDayChangeEl = document.getElementById("dw-last-day-change");
        if (lastDayChangeEl) {
          lastDayChangeEl.textContent = fmtChangeWithPercent(changeMetrics.lastDayChange, changeMetrics.lastDayChangePercent);
          lastDayChangeEl.style.color = changeColor;
        }

        // --- [TENOR 2026 HDR] COMPARISON SYMBOLS UPDATE (Torvalds T3) ---
        // Cache comparison series so hover does not call chart.getOption() on every pointer tick.
        try {
          const now = performance.now();
          if (now - comparisonSeriesCacheRef.current.updatedAt > 250) {
            const option = chart.getOption();
            const optionSeries = Array.isArray(option.series) ? option.series : [];
            comparisonSeriesCacheRef.current = {
              updatedAt: now,
              series: optionSeries.filter(isComparisonDataWindowSeries),
            };
          }

          const compSeries = comparisonSeriesCacheRef.current.series;

          // Update the 5 pre-allocated DOM slots
          for (let i = 0; i < 5; i++) {
            const rowEl = document.getElementById(`dw-comp-row-${i}`);
            const symEl = document.getElementById(`dw-comp-symbol-${i}`);
            const valEl = document.getElementById(`dw-comp-val-${i}`);

            if (!rowEl || !symEl || !valEl) continue;

            const s = compSeries[i];

            // If series exists and has valid data at this index
            if (s && s.data && s.data[idx] !== undefined && s.data[idx] !== null) {
              rowEl.style.display = "flex";
              symEl.textContent = s.name ?? "";
              symEl.style.color = s.itemStyle?.color || "#d1d4dc";

              const val = Number(s.data[idx]);
              valEl.textContent = `${val >= 0 ? "+" : ""}${val.toFixed(2)}%`;
              valEl.style.color = val >= 0 ? "#26a69a" : "#ef5350";
            } else {
              // Hide the slot if no data or no series
              rowEl.style.display = "none";
            }
          }
        } catch (e) {
          // Silent catch to prevent RAF crash
        }
      });
    };

    const handleAxisPointerMove = (...args: unknown[]) => {
      const params = args[0];
      if (!isAxisPointerPayload(params)) return;

      const data = chartDataRef.current;
      const idx = resolveAxisPointerIndex(params, data);
      if (idx !== null) updateDataWindowAtIndex(idx);
    };

    const handleCanvasMouseMove = (payload: ZrMouseMovePayload) => {
      const idx = resolvePixelPointerIndex(chart, payload);
      if (idx !== null) updateDataWindowAtIndex(idx);
    };

    // ECharts peut ne pas emettre updateAxisPointer quand tooltip/axisPointer sont desactives.
    // Le fallback ZRender garde la Data Window alimentee par le pixel souris reel du chart.
    chart.on("updateAxisPointer", handleAxisPointerMove);
    const zr = chart.getZr();
    zr.on("mousemove", handleCanvasMouseMove);

    return () => {
      cancelAnimationFrame(rafId);
      if (!chart.isDisposed()) {
        chart.off("updateAxisPointer", handleAxisPointerMove);
        zr.off("mousemove", handleCanvasMouseMove);
      }
    };
  }, [isOpen, chartInstanceRef]);

  return {
    isOpen,
    activeTab,
    togglePanel,
    setActiveTab,
    dataWindow,
  };
};

// --- EOF ---
