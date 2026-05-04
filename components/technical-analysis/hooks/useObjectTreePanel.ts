/**
 * [TENOR 2026 FEAT] useObjectTreePanel
 *
 * Hook métier du panneau "Object Tree & Data Window".
 * Responsabilités :
 *  1. Gérer l'état ouvert/fermé du panneau et l'onglet actif.
 *  2. Exposer les valeurs OHLCV de la bougie pointée via le curseur ECharts.
 *     (Lecture depuis chartData via l'index capturé — Zero-Lag, pas de RAF React)
 *
 * PAT-216 : hook autonome — pas de couplage Redux pour cet état local UI.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { EChartsType } from "echarts/core";
import type { RefObject } from "react";
import type { ObjectTreePanelTab, DataWindowCandleValues } from "../config/TechnicalAnalysisTypes";
import type { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";

// ============================================================================
// HELPERS
// ============================================================================

/** Formate un timestamp en label lisible "Mon 18 Jan '26" */
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

  // Valeurs du Data Window : mis à jour au mousemove sur le chart, stocké en state
  // (fréquence: ~30fps max via le coût naturel de React — acceptable pour un panneau texte)
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

    const handleMouseMove = (params: { dataIndex?: number; seriesIndex?: number }) => {
      const data = chartDataRef.current;
      const idx = params.dataIndex;
      if (idx === undefined || idx < 0 || idx >= data.length) return;

      const candle = data[idx];
      if (!candle) return;

      const isUp = candle.close >= candle.open;
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
    };

    // ECharts émet 'updateAxisPointer' avec les données de la bougie pointée
    chart.on("updateAxisPointer", handleMouseMove as any);

    return () => {
      if (!chart.isDisposed()) {
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
