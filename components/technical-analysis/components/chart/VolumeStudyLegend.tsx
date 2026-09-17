"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import type { EChartsInstance } from "../../lib/types/echarts";

interface VolumeStudyLegendProps {
  chartInstanceRef: React.RefObject<EChartsInstance | null>;
  attached: boolean;
  visible: boolean;
  outputEnabled: boolean;
  symbol: string;
  onToggleVisibility: () => void;
  onConfigure: () => void;
  onRemove: () => void;
  onOpenObjectTree: () => void;
}

type LegendPosition = { top: number; left: number } | null;
type GridOption = { top?: unknown };
type AxisOption = { id?: unknown; gridIndex?: unknown };

const LEGEND_INSET_PX = 8;
const LEGEND_MIN_TOP_PX = 6;
const LEGEND_BOTTOM_GUARD_PX = 38;

const asArray = <T,>(value: T | T[] | undefined): T[] => (
  Array.isArray(value) ? value : value === undefined ? [] : [value]
);

const resolvePixelDimension = (value: unknown, total: number): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.endsWith("%")) {
    const percent = Number.parseFloat(trimmed.slice(0, -1));
    return Number.isFinite(percent) ? total * percent / 100 : null;
  }
  const pixels = Number.parseFloat(trimmed);
  return Number.isFinite(pixels) ? pixels : null;
};

export const resolveVolumeLegendPosition = (chart: EChartsInstance | null): LegendPosition => {
  if (!chart) return null;
  try {
    if (chart.isDisposed()) return null;
    const dom = chart.getDom();
    const height = dom.clientHeight || dom.getBoundingClientRect().height;
    if (!Number.isFinite(height) || height <= 0) return null;

    const option = chart.getOption() as { grid?: GridOption | GridOption[]; yAxis?: AxisOption | AxisOption[] };
    const axes = asArray(option.yAxis);
    const volumeAxis = axes.find((axis) => axis && axis.id === "volume-yaxis");
    if (!volumeAxis) return null;

    const axisIndex = axes.indexOf(volumeAxis);
    const gridIndex = typeof volumeAxis.gridIndex === "number" && Number.isInteger(volumeAxis.gridIndex)
      ? volumeAxis.gridIndex
      : axisIndex;
    const grid = asArray(option.grid)[gridIndex];
    if (!grid) return null;

    const rawTop = resolvePixelDimension(grid.top, height);
    if (rawTop === null) return null;
    const top = Math.max(
      LEGEND_MIN_TOP_PX,
      Math.min(rawTop + 6, Math.max(LEGEND_MIN_TOP_PX, height - LEGEND_BOTTOM_GUARD_PX)),
    );
    return { top, left: LEGEND_INSET_PX };
  } catch {
    return null;
  }
};

const invokeWithoutChartPropagation = (
  event: React.MouseEvent<HTMLButtonElement>,
  action: () => void,
): void => {
  event.preventDefault();
  event.stopPropagation();
  action();
};

export const VolumeStudyLegend: React.FC<VolumeStudyLegendProps> = ({
  chartInstanceRef,
  attached,
  visible,
  outputEnabled,
  symbol,
  onToggleVisibility,
  onConfigure,
  onRemove,
  onOpenObjectTree,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const autoCollapseTimerRef = useRef<number | null>(null);
  const [position, setPosition] = useState<LegendPosition>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false);

  const cancelAutoCollapse = useCallback(() => {
    if (autoCollapseTimerRef.current !== null) {
      window.clearTimeout(autoCollapseTimerRef.current);
      autoCollapseTimerRef.current = null;
    }
  }, []);

  const collapseLegend = useCallback(() => {
    cancelAutoCollapse();
    setMoreOpen(false);
    setIsLegendCollapsed(true);
  }, [cancelAutoCollapse]);

  const scheduleAutoCollapse = useCallback(() => {
    cancelAutoCollapse();
    autoCollapseTimerRef.current = window.setTimeout(() => {
      autoCollapseTimerRef.current = null;
      setMoreOpen(false);
      setIsLegendCollapsed(true);
    }, 1800);
  }, [cancelAutoCollapse]);

  const refreshPosition = useCallback(() => {
    setPosition(resolveVolumeLegendPosition(chartInstanceRef.current));
  }, [chartInstanceRef]);

  useLayoutEffect(() => {
    if (!attached) {
      setPosition(null);
      setMoreOpen(false);
      setIsLegendCollapsed(false);
      return;
    }

    const chart = chartInstanceRef.current;
    if (!chart || chart.isDisposed()) {
      setPosition(null);
      return;
    }

    let frameId = window.requestAnimationFrame(refreshPosition);
    const handleFinished = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(refreshPosition);
    };
    chart.on("finished", handleFinished);

    const dom = chart.getDom();
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(handleFinished) : null;
    resizeObserver?.observe(dom);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      if (!chart.isDisposed()) chart.off("finished", handleFinished);
    };
  }, [attached, chartInstanceRef, refreshPosition]);

  useEffect(() => {
    if (!moreOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && rootRef.current?.contains(event.target)) return;
      setMoreOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [moreOpen]);

  useEffect(() => {
    if (!attached || isLegendCollapsed || moreOpen) {
      cancelAutoCollapse();
      return;
    }
    scheduleAutoCollapse();
    return cancelAutoCollapse;
  }, [attached, cancelAutoCollapse, isLegendCollapsed, moreOpen, scheduleAutoCollapse]);

  if (!attached || !position) return null;

  const safeSymbol = symbol.trim() || "Titre";
  const status = !visible ? "Masqué" : !outputEnabled ? "Style masqué" : "Visible";

  if (isLegendCollapsed) {
    return (
      <button
        type="button"
        className="gp-volume-study-legend__restore"
        data-volume-study-legend-restore="true"
        aria-label={`Afficher la barre Volume · ${safeSymbol}`}
        title="Afficher la barre Volume"
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => invokeWithoutChartPropagation(event, () => setIsLegendCollapsed(false))}
      >
        <span aria-hidden="true">Vol</span>
      </button>
    );
  }

  return (
    <div
      ref={rootRef}
      className={`gp-volume-study-legend${visible ? " is-visible" : " is-hidden"}${outputEnabled ? "" : " is-output-disabled"}${moreOpen ? " is-more-open" : ""}`}
      data-volume-study-legend="true"
      role="group"
      tabIndex={0}
      aria-label={`Volume · ${safeSymbol}`}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      onPointerEnter={cancelAutoCollapse}
      onPointerLeave={scheduleAutoCollapse}
      onFocusCapture={cancelAutoCollapse}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget;
        if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
        scheduleAutoCollapse();
      }}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <span className="gp-volume-study-legend__name" title={`Volume · ${safeSymbol}`}>Vol · {safeSymbol}</span>
      <span className="gp-volume-study-legend__status" aria-label={`État : ${status}`}>{status}</span>
      <div className="gp-volume-study-legend__actions">
        <button type="button" className="gp-volume-study-legend__action" aria-label={visible ? "Masquer Volume" : "Afficher Volume"} title={visible ? "Masquer" : "Afficher"} onClick={(event) => invokeWithoutChartPropagation(event, onToggleVisibility)}>
          <i className={`bi ${visible ? "bi-eye" : "bi-eye-slash"}`} aria-hidden="true" />
        </button>
        <button type="button" className="gp-volume-study-legend__action" aria-label="Paramètres de Volume" title="Paramètres" onClick={(event) => invokeWithoutChartPropagation(event, onConfigure)}>
          <i className="bi bi-gear" aria-hidden="true" />
        </button>
        <button type="button" className="gp-volume-study-legend__action is-collapse" aria-label="Masquer la barre Volume" title="Masquer la barre" onClick={(event) => invokeWithoutChartPropagation(event, collapseLegend)}>
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
        <button type="button" className="gp-volume-study-legend__action" aria-label="Plus d’actions Volume" aria-haspopup="menu" aria-expanded={moreOpen} title="Plus" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setMoreOpen((current) => !current); }}>
          <i className="bi bi-three-dots" aria-hidden="true" />
        </button>
      </div>
      {moreOpen ? (
        <div className="gp-volume-study-legend__more" role="menu" aria-label="Plus d’actions Volume">
          <button type="button" role="menuitem" onClick={(event) => invokeWithoutChartPropagation(event, () => { setMoreOpen(false); onOpenObjectTree(); })}>
            <i className="bi bi-diagram-3" aria-hidden="true" />
            <span>Arborescence des objets</span>
          </button>
          <button type="button" role="menuitem" className="is-danger" onClick={(event) => invokeWithoutChartPropagation(event, () => { setMoreOpen(false); onRemove(); })}>
            <i className="bi bi-trash3" aria-hidden="true" />
            <span>Supprimer Volume</span>
          </button>
        </div>
      ) : null}
    </div>
  );
};

VolumeStudyLegend.displayName = "VolumeStudyLegend";
