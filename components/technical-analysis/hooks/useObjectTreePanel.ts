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
 *
 * [TENOR 2026 — Option F] FINANCIAL PROOF MODE
 * Détection O(1) des anomalies sur la bougie courante (zero volume, prix zéro, variation extrême,
 * données stale). La provenance (BRVM CSV / Live / Cache) est transmise depuis l'appelant.
 * Règle : on ne masque jamais une incertitude derrière un rendu lisse et professionnel.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { EChartsType } from "echarts/core";
import type { RefObject } from "react";
import type {
  ObjectTreePanelTab,
  DataWindowCandleValues,
  DataAnomalyFlag,
} from "../config/object-tree/objectTreeTypes";
import type { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";

// ============================================================================
// HELPERS — Formatters
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
  (v >= 0 ? "+" : "") +
  v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
  "%";

const fmtChangeWithPercent = (value: number, percent: number): string =>
  (value >= 0 ? "+" : "") + fmtPrice(value) + " (" + fmtPercent(percent) + ")";

const resolveChangeMetrics = (
  data: ChartDataPoint[],
  idx: number,
  candle: ChartDataPoint,
) => {
  const previousClose =
    idx > 0 && Number.isFinite(data[idx - 1]?.close) ? data[idx - 1].close : candle.open;
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

// ============================================================================
// HELPERS — ECharts pointer index resolution
// ============================================================================

const resolveAxisPointerIndex = (
  params: {
    dataIndex?: number;
    axesInfo?: Array<{ value?: string | number }>;
  },
  data: ChartDataPoint[],
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

  const timestampIndex = data.findIndex(
    (candle) => new Date(candle.time).getTime() === rawTimestamp,
  );
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

// ============================================================================
// [TENOR 2026 — Option F] FINANCIAL PROOF HELPERS
// ============================================================================

/**
 * Compte les jours ouvrés (hors week-end) écoulés depuis une date.
 * Utilisé pour détecter les données stale (> 3 jours ouvrés).
 * Complexité : O(1) — arithmétique pure, aucune boucle.
 *
 * Approximation : précise à ±1 pour des périodes < 4 semaines.
 */
const countTradingDaysSince = (dateMs: number, nowMs: number): number => {
  if (nowMs <= dateMs) return 0;
  const msPerDay = 86_400_000;
  const totalDays = Math.floor((nowMs - dateMs) / msPerDay);
  const dayOfWeek = new Date(dateMs).getDay(); // 0=Sun, 6=Sat
  const weekends = Math.floor((totalDays + dayOfWeek) / 7) * 2;
  return Math.max(0, totalDays - weekends);
};

/**
 * Détecte les anomalies sur une bougie OHLCV.
 * [Option F] Détection O(1) sans boucle — ne ralentit pas le RAF à 60Hz.
 *
 * Règle fondamentale de l'Option F :
 * On ne masque JAMAIS une incertitude derrière un rendu lisse et professionnel.
 * Une seule valeur corrompue silencieuse peut faire perdre de l'argent.
 */
const detectCandleAnomalies = (
  candle: ChartDataPoint,
  prevCandle: ChartDataPoint | undefined,
  nowMs: number,
): DataAnomalyFlag[] => {
  const flags: DataAnomalyFlag[] = [];
  const vol = candle.volume ?? 0;
  const close = candle.close ?? 0;
  const open = candle.open ?? 0;
  const high = candle.high ?? 0;
  const low = candle.low ?? 0;

  // ZERO_VOLUME : bougie avec 0 titre échangé — données manquantes ou marché fermé
  if (vol === 0 || !Number.isFinite(vol)) {
    flags.push("ZERO_VOLUME");
  }

  // NO_TRADES : tradesCount explicitement à 0 (distinct du volume)
  const tradesCount = (candle as unknown as Record<string, unknown>).tradesCount;
  if (tradesCount !== null && tradesCount !== undefined && tradesCount === 0) {
    flags.push("NO_TRADES");
  }

  // ZERO_PRICE : prix close ou open à 0 — donnée corrompue ou non disponible
  if (close === 0 || open === 0) {
    flags.push("ZERO_PRICE");
  }

  // SUSPICIOUS_SPREAD : H-L > 50% du close — anomalie de donnée ou split non ajusté
  const spread = high - low;
  if (close > 0 && spread > 0 && spread / close > 0.5) {
    flags.push("SUSPICIOUS_SPREAD");
  }

  // EXTREME_CHANGE : variation > 20% vs bougie précédente — split potentiel ou erreur
  if (prevCandle && prevCandle.close > 0 && Number.isFinite(prevCandle.close)) {
    const changeRatio = Math.abs((close - prevCandle.close) / prevCandle.close);
    if (changeRatio > 0.2) {
      flags.push("EXTREME_CHANGE");
    }
  }

  // STALE_DATA : dernière bougie datant de plus de 3 jours ouvrés
  if (candle.time) {
    const candleMs = new Date(candle.time).getTime();
    if (Number.isFinite(candleMs) && countTradingDaysSince(candleMs, nowMs) > 3) {
      flags.push("STALE_DATA");
    }
  }

  return flags;
};

/** Labels d'affichage pour chaque code d'anomalie */
const ANOMALY_FLAG_LABELS: Record<DataAnomalyFlag, string> = {
  ZERO_VOLUME: "Vol. zéro",
  ZERO_PRICE: "Prix zéro",
  SUSPICIOUS_SPREAD: "Spread suspect",
  NO_TRADES: "Aucune transaction",
  STALE_DATA: "Données stale",
  EXTREME_CHANGE: "Variation extrême",
};

/**
 * Résout le label de provenance de la donnée depuis le contexte d'appel.
 * Hiérarchie : snapshot live (bougie finale) > CSV BRVM > cache local.
 */
const resolveProvenanceLabel = (
  candle: ChartDataPoint,
  hasLiveSnapshot: boolean,
  isLastCandle: boolean,
): string => {
  if (isLastCandle && hasLiveSnapshot) return "BRVM Live";
  const candleMs = candle.time ? new Date(candle.time).getTime() : NaN;
  if (Number.isFinite(candleMs)) return "BRVM CSV";
  return "Cache local";
};

// ============================================================================
// HELPERS — Comparison series
// ============================================================================

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
  return (
    typeof series.id === "string" &&
    series.id.startsWith("compare-") &&
    series.lineStyle?.opacity !== 0
  );
};

// ============================================================================
// TYPES
// ============================================================================

interface UseObjectTreePanelProps {
  chartInstanceRef: RefObject<EChartsType | null>;
  chartData: ChartDataPoint[];
  /**
   * [Option F] Indique si un snapshot live est disponible pour le symbole actif.
   * Permet de résoudre la provenance : "BRVM Live" si true + dernière bougie.
   */
  hasLiveSnapshot?: boolean;
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
  hasLiveSnapshot = false,
}: UseObjectTreePanelProps): UseObjectTreePanelReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ObjectTreePanelTab>("object_tree");

  // [TENOR SRE] Ref pour éviter la closure stale sur chartData dans le listener ECharts
  const chartDataRef = useRef<ChartDataPoint[]>(chartData);
  useEffect(() => {
    chartDataRef.current = chartData;
  }, [chartData]);

  // Ref pour hasLiveSnapshot — évite de rebrancher les listeners ECharts à chaque tick snapshot
  const hasLiveSnapshotRef = useRef(hasLiveSnapshot);
  useEffect(() => {
    hasLiveSnapshotRef.current = hasLiveSnapshot;
  }, [hasLiveSnapshot]);

  // State is only used for initial mount or recovery (Self-Healing DOM check)
  const [dataWindow, setDataWindow] = useState<DataWindowCandleValues | null>(null);
  const lastDataWindowIndexRef = useRef<number | null>(null);
  const comparisonSeriesCacheRef = useRef<{
    updatedAt: number;
    series: ComparisonDataWindowSeries[];
  }>({ updatedAt: 0, series: [] });

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

      // [TENOR 2026 — Option F] Proof computation (O(1), safe at 60Hz)
      const nowMs = Date.now();
      const isLastCandle = idx === data.length - 1;
      const prevCandle = idx > 0 ? data[idx - 1] : undefined;
      const anomalyFlags = detectCandleAnomalies(candle, prevCandle, nowMs);
      const provenanceLabel = resolveProvenanceLabel(
        candle,
        hasLiveSnapshotRef.current,
        isLastCandle,
      );
      const candleMs = candle.time ? new Date(candle.time).getTime() : NaN;
      const dataAgeMs = Number.isFinite(candleMs) ? Math.max(0, nowMs - candleMs) : undefined;

      // [TENOR 2026 SRE FIX] SCAR-PERF-05: Self-Healing DOM Check.
      // If the dw-date node doesn't exist, React hasn't mounted the grid yet.
      // Trigger a React state update as fallback — this also includes proof metadata.
      if (!dateEl) {
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
          // [Option F] Financial Proof metadata (included on fallback path)
          provenanceLabel,
          dataAgeMs,
          anomalyFlags: anomalyFlags.length > 0 ? anomalyFlags : undefined,
        });
        return;
      }

      // 2. High-Frequency Path: Direct DOM Manipulation via RAF (Zero-Lag)
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const candleColor = isUp ? "#26a69a" : "#ef5350";
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
          changeEl.textContent = fmtChangeWithPercent(
            changeMetrics.change,
            changeMetrics.changePercent,
          );
          changeEl.style.color = changeColor;
        }

        const lastDayChangeEl = document.getElementById("dw-last-day-change");
        if (lastDayChangeEl) {
          lastDayChangeEl.textContent = fmtChangeWithPercent(
            changeMetrics.lastDayChange,
            changeMetrics.lastDayChangePercent,
          );
          lastDayChangeEl.style.color = changeColor;
        }

        // --- [TENOR 2026 — Option F] FINANCIAL PROOF DOM ANCHORS ---
        // Mise à jour directe du badge de provenance et du banner d'anomalie via DOM anchor.
        // Ces IDs sont pré-alloués dans DataWindowTab.tsx (zero-allocation path).

        const provenanceEl = document.getElementById("dw-provenance-label");
        if (provenanceEl) {
          provenanceEl.textContent = provenanceLabel;
          provenanceEl.style.color =
            provenanceLabel === "BRVM Live"
              ? "#22c55e"
              : provenanceLabel === "BRVM CSV"
                ? "#38bdf8"
                : "#94a3b8";
        }

        const anomalyBannerEl = document.getElementById("dw-anomaly-banner");
        if (anomalyBannerEl) {
          if (anomalyFlags.length > 0) {
            anomalyBannerEl.style.display = "flex";
            const anomalyTextEl = document.getElementById("dw-anomaly-text");
            if (anomalyTextEl) {
              anomalyTextEl.textContent = anomalyFlags
                .map((f) => ANOMALY_FLAG_LABELS[f])
                .join(" · ");
            }
          } else {
            anomalyBannerEl.style.display = "none";
          }
        }

        // --- [TENOR 2026 HDR] COMPARISON SYMBOLS UPDATE (Torvalds T3) ---
        // Cache comparison series every 250ms to avoid chart.getOption() on every pointer tick.
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

            if (s && s.data && s.data[idx] !== undefined && s.data[idx] !== null) {
              rowEl.style.display = "flex";
              symEl.textContent = s.name ?? "";
              symEl.style.color = s.itemStyle?.color || "#d1d4dc";

              const val = Number(s.data[idx]);
              valEl.textContent = `${val >= 0 ? "+" : ""}${val.toFixed(2)}%`;
              valEl.style.color = val >= 0 ? "#26a69a" : "#ef5350";
            } else {
              rowEl.style.display = "none";
            }
          }
        } catch {
          // Silent catch to prevent RAF crash on chart.getOption() failure
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

    // ECharts ne peut pas émettre updateAxisPointer si tooltip/axisPointer sont désactivés.
    // Le fallback ZRender maintient le Data Window alimenté par le pixel souris réel.
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
