import React, { useState, useEffect, useRef, useCallback } from "react";
import clsx from "clsx";
import type { EChartsInstance } from "../../../lib/types/echarts";
import { TimeAxisRegistry, TradingViewTimeAxisControls } from "../../../hooks/useChartViewport";
import {
  HOLD_REPEAT_INTERVAL_MS,
  HOLD_START_DELAY_MS,
  TIME_AXIS_HOVER_BOTTOM_OFFSET_PX,
  TIME_AXIS_HOVER_TOP_EXTENSION_PX,
} from "./timeAxisControls.constants";

export interface TimeAxisControlsProps {
  chartInstanceRef: React.RefObject<EChartsInstance | null>;
  className?: string;
}

/**
 * [TENOR 2026] TimeAxisControls - TradingView Parity Edition
 * Refactored to use Spatial Coordinate Tracking with expanded hover zone.
 * Enforces Dark Theme inline to guarantee visual parity.
 * Fixes ECharts dataZoom targeting to prevent axis distortion.
 * 
 * [TENOR 2026 SRE FIX] SCAR-API-01: ECharts API Decoupling
 * Eradicated the hacky `(chart as any).__tvTimeAxisControls`.
 * Now safely consumes the `TimeAxisRegistry` (WeakMap) exported by `useChartViewport`.
 */
export const TimeAxisControls: React.FC<TimeAxisControlsProps> = ({
  chartInstanceRef,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const holdDelayRef = useRef<number | null>(null);
  const holdIntervalRef = useRef<number | null>(null);

  // [TENOR 2026 SRE] Safe Registry Lookup (O(1), Strongly Typed, GC-Safe)
  const getTradingViewControls = (): TradingViewTimeAxisControls | null => {
    const chart = chartInstanceRef.current;
    if (!chart) return null;
    return TimeAxisRegistry.get(chart) || null;
  };

  // --- SPATIAL COORDINATE TRACKING ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!chartInstanceRef.current) return;
      const dom = chartInstanceRef.current.getDom();
      if (!dom) return;

      const rect = dom.getBoundingClientRect();

      // TradingView Logic: The panel appears when the mouse is within the horizontal bounds of the chart
      // AND within the bottom area.
      // [FIX] Increased from 70 to 150 to catch the date axis which sits above the container's absolute bottom due to grid margins.
      const isWithinX = e.clientX >= rect.left && e.clientX <= rect.right;
      const isWithinY = e.clientY >= rect.bottom - TIME_AXIS_HOVER_BOTTOM_OFFSET_PX && e.clientY <= rect.bottom + TIME_AXIS_HOVER_TOP_EXTENSION_PX;

      if (isWithinX && isWithinY) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Attach to window to track mouse even when it leaves the chart area quickly
    window.addEventListener("mousemove", handleMouseMove);

    // Strict cleanup to prevent memory leaks
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [chartInstanceRef]);

  const handleZoom = (direction: "in" | "out") => {
    const controls = getTradingViewControls();
    if (controls) {
      if (direction === "in") controls.zoomIn();
      else controls.zoomOut();
    }
  };

  const handlePan = (direction: "left" | "right") => {
    const controls = getTradingViewControls();
    if (controls) {
      if (direction === "left") controls.panLeft();
      else controls.panRight();
    }
  };

  const handleReset = () => {
    const controls = getTradingViewControls();
    if (controls) {
      controls.reset();
    }
  };

  const stopHoldAction = useCallback(() => {
    if (holdDelayRef.current !== null) {
      window.clearTimeout(holdDelayRef.current);
      holdDelayRef.current = null;
    }
    if (holdIntervalRef.current !== null) {
      window.clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  const startHoldAction = useCallback((action: () => void) => (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    stopHoldAction();
    action();

    holdDelayRef.current = window.setTimeout(() => {
      holdIntervalRef.current = window.setInterval(action, HOLD_REPEAT_INTERVAL_MS);
    }, HOLD_START_DELAY_MS);
  }, [stopHoldAction]);

  useEffect(() => stopHoldAction, [stopHoldAction]);

  return (
    <div className={"time-axis-hover-zone"} style={{ pointerEvents: 'none' }}>
      <div
        className={clsx(
          "time-axis-controls",
          isVisible && "is-visible",
          className
        )}
        style={{ pointerEvents: 'auto' }}
        onMouseEnter={() => setIsVisible(true)}
      >
        <button
          className={"control-btn"}
          onPointerDown={startHoldAction(() => handleZoom("out"))}
          onPointerUp={stopHoldAction}
          onPointerCancel={stopHoldAction}
          onPointerLeave={stopHoldAction}
          title="Dézoomer la fenêtre temporelle"
          aria-label="Dézoomer la fenêtre temporelle"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18">
            <path fill="currentColor" d="M4 8.5h10v1H4z" />
          </svg>
        </button>
        <button
          className={"control-btn"}
          onPointerDown={startHoldAction(() => handleZoom("in"))}
          onPointerUp={stopHoldAction}
          onPointerCancel={stopHoldAction}
          onPointerLeave={stopHoldAction}
          title="Zoomer la fenêtre temporelle"
          aria-label="Zoomer la fenêtre temporelle"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18">
            <path fill="currentColor" d="M8.5 4v4.5H4v1h4.5V14h1V9.5H14v-1H9.5V4z" />
          </svg>
        </button>
        <button
          className={"control-btn"}
          onPointerDown={startHoldAction(() => handlePan("left"))}
          onPointerUp={stopHoldAction}
          onPointerCancel={stopHoldAction}
          onPointerLeave={stopHoldAction}
          title="Déplacer les bougies vers la gauche"
          aria-label="Déplacer les bougies vers la gauche"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18">
            <path fill="currentColor" d="M11.5 13.5l-4-4.5 4-4.5-.7-.7-4.7 5.2 4.7 5.2z" />
          </svg>
        </button>
        <button
          className={"control-btn"}
          onPointerDown={startHoldAction(() => handlePan("right"))}
          onPointerUp={stopHoldAction}
          onPointerCancel={stopHoldAction}
          onPointerLeave={stopHoldAction}
          title="Déplacer les bougies vers la droite"
          aria-label="Déplacer les bougies vers la droite"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18">
            <path fill="currentColor" d="M6.5 4.5l4 4.5-4 4.5.7.7 4.7-5.2-4.7-5.2z" />
          </svg>
        </button>
        <button
          className={"control-btn"}
          onClick={handleReset}
          title="Réinitialiser la fenêtre temporelle"
          aria-label="Réinitialiser la fenêtre temporelle"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18">
            <path fill="currentColor" d="M9 4c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5h-1c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4c1.3 0 2.4.6 3.1 1.5L9.5 8h4V3.5l-1.3 1.3C11.3 3.7 10.2 3 9 3v1z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// --- EOF ---
