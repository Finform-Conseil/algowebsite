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
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { EChartsType } from "echarts/core";
import type { RefObject } from "react";
import type { ObjectTreePanelTab, DataWindowCandleValues } from "../config/TechnicalAnalysisTypes";
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
    ? `${(v / 1_000_000).toFixed(2)}M`
    : v >= 1_000
    ? `${(v / 1_000).toFixed(1)}K`
    : String(v);

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMouseMove = (params: { dataIndex?: number; seriesIndex?: number }) => {
      const data = chartDataRef.current;
      const idx = params.dataIndex;

      if (idx === undefined || idx < 0 || idx >= data.length) return;

      const candle = data[idx];
      if (!candle) return;

      const isUp = candle.close >= candle.open;

      // [TENOR 2026 SRE FIX] SCAR-PERF-05: Self-Healing DOM Check
      // Instead of relying on a fragile boolean ref, we check if the DOM node actually exists.
      // If it doesn't (initial mount or React unmounted it), we trigger a React state update.
      const dateEl = document.getElementById('dw-date');
      if (!dateEl) {
        setDataWindow({
          date: formatDataWindowDate(candle.time),
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume ?? 0,
          change: candle.close - candle.open,
          isUp,
        });
        return;
      }

      // 2. High-Frequency Updates: Direct DOM Manipulation (Zero-Lag)
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const color = isUp ? "#26a69a" : "#ef5350"; // TV.bullColor : TV.bearColor

        // We already know dateEl exists, but we query others to be safe
        dateEl.textContent = formatDataWindowDate(candle.time);

        const openEl = document.getElementById('dw-open');
        if (openEl) {
          openEl.textContent = fmtPrice(candle.open);
          openEl.style.color = color;
        }

        const highEl = document.getElementById('dw-high');
        if (highEl) {
          highEl.textContent = fmtPrice(candle.high);
          highEl.style.color = color;
        }

        const lowEl = document.getElementById('dw-low');
        if (lowEl) {
          lowEl.textContent = fmtPrice(candle.low);
          lowEl.style.color = color;
        }

        const closeEl = document.getElementById('dw-close');
        if (closeEl) {
          closeEl.textContent = fmtPrice(candle.close);
          closeEl.style.color = color;
        }

        const volEl = document.getElementById('dw-volume');
        if (volEl) {
          volEl.textContent = fmtVol(candle.volume ?? 0);
        }

        const changeEl = document.getElementById('dw-change');
        if (changeEl) {
          const change = candle.close - candle.open;
          changeEl.textContent = `${change >= 0 ? "+" : ""}${fmtPrice(change)}`;
          changeEl.style.color = color;
        }
      });
    };

    // ECharts émet 'updateAxisPointer' avec les données de la bougie pointée
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chart.on("updateAxisPointer", handleMouseMove as any);

    return () => {
      cancelAnimationFrame(rafId);
      if (!chart.isDisposed()) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        chart.off("updateAxisPointer", handleMouseMove as any);
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