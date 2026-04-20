import { useLayoutEffect, useEffect, useRef, RefObject, MutableRefObject } from "react";
import type { ECharts } from "echarts/core";
import DOMPurify from "dompurify";
import { Drawing } from "../config/TechnicalAnalysisTypes";
import { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";

const MAIN_GRID_LEFT = 15;

interface UseOverlayRendererProps {
  selectedDrawingId: string | null;
  drawings: Drawing[];
  chartInstanceRef: MutableRefObject<ECharts | null>;
  drawingCanvasRef: RefObject<HTMLCanvasElement | null>;
  drawingToolbarRef: RefObject<HTMLDivElement | null>;
  drawingTooltipRef: RefObject<HTMLDivElement | null>;
  gridRect: { x: number; y: number; width: number; height: number } | null;
  toolbarOffsetRef: MutableRefObject<{ x: number; y: number }>;
  chartData: ChartDataPoint[];
}

/**
 * [TENOR 2026] useOverlayRenderer
 * Extracted from TechnicalAnalysis.tsx to enforce Single Responsibility Principle.
 * Handles the high-frequency (60 FPS) direct DOM manipulation for floating toolbars
 * and drawing tooltips, bypassing React's render cycle for maximum performance (Zero-Lag).
 *
 * [TENOR 2026 PERF-FIX BUG-2] RAF Stability Pattern:
 * `drawings` and `selectedDrawingId` are read via stable Refs inside the loop.
 * This prevents the RAF loop from being torn down and recreated every time
 * the drawings array changes (which happened on every mousemove during drag at 60Hz).
 * The useLayoutEffect now has an empty dep array[] — the loop runs once and lives forever.
 *
 * [TENOR 2026 FIX] SCAR-149: ECharts/Canvas Hard Sync
 * Integrates ECharts event listeners ('datazoom', 'restore', 'finished') to pause
 * UI updates while the chart is animating/recalculating its projection matrix.
 * Prevents the "Ghosting/Floating" effect of toolbars during zoom/pan.
 *
 * [TENOR 2026 FIX] SCAR-XSS-01: RAF DOM Dirty Checking & DOMPurify Strict Whitelist
 * Implements `lastTooltipHtmlRef` to bypass expensive DOM layout/paint recalculations
 * if the tooltip content hasn't changed. Injects `DOMPurify.sanitize` with a strict
 * whitelist (div, span, style) to guarantee absolute protection against XSS injections
 * without compromising the 60 FPS budget.
 */
export const useOverlayRenderer = ({
  selectedDrawingId,
  drawings,
  chartInstanceRef,
  drawingCanvasRef,
  drawingToolbarRef,
  drawingTooltipRef,
  gridRect,
  toolbarOffsetRef,
  chartData,
}: UseOverlayRendererProps) => {
  // --- STABLE REFS for hot-path reading (BUG-2 fix) ---
  const drawingsRef = useRef<Drawing[]>(drawings);
  const selectedIdRef = useRef<string | null>(selectedDrawingId);
  const gridRectRef = useRef(gridRect);
  const chartDataRef = useRef(chartData);

  // [TENOR 2026 FIX] SCAR-149: Stability Flag & Watchdog
  const isChartStableRef = useRef<boolean>(true);
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);

  // [TENOR 2026 FIX] SCAR-XSS-01: Dirty Checking Cache
  const lastTooltipHtmlRef = useRef<string>("");

  // Sync Refs each render — O(1) cost, no effect teardown
  useEffect(() => {
    drawingsRef.current = drawings;
  }, [drawings]);

  useEffect(() => {
    selectedIdRef.current = selectedDrawingId;
  }, [selectedDrawingId]);

  useEffect(() => {
    gridRectRef.current = gridRect;
  }, [gridRect]);

  useEffect(() => {
    chartDataRef.current = chartData;
  }, [chartData]);

  // [TENOR 2026 FIX] SCAR-149: ECharts Event Listeners for Hard Sync
  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart) return;

    const handleChartUnstable = () => {
      isChartStableRef.current = false;
      // Hide UI immediately to prevent ghosting
      if (drawingToolbarRef.current) drawingToolbarRef.current.style.display = "none";
      if (drawingTooltipRef.current) drawingTooltipRef.current.style.display = "none";

      // Watchdog Timer: Force stability after 200ms if 'finished' event is lost
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = setTimeout(() => {
        isChartStableRef.current = true;
      }, 200);
    };

    const handleChartStable = () => {
      isChartStableRef.current = true;
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }
    };

    chart.on('datazoom', handleChartUnstable);
    chart.on('restore', handleChartUnstable);
    chart.on('finished', handleChartStable);

    return () => {
      chart.off('datazoom', handleChartUnstable);
      chart.off('restore', handleChartUnstable);
      chart.off('finished', handleChartStable);
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    };
  }, [chartInstanceRef, drawingToolbarRef, drawingTooltipRef]);

  // RAF loop — created once, reads from Refs, never torn down
  useLayoutEffect(() => {
    let animId: number;

    const loop = () => {
      const chart = chartInstanceRef.current;
      const canvas = drawingCanvasRef.current;
      const currentSelectedId = selectedIdRef.current;
      const currentDrawings = drawingsRef.current;
      const currentGridRect = gridRectRef.current;

      // [TENOR 2026 FIX] SCAR-149: Pause UI updates if chart is unstable (zooming/panning)
      if (!isChartStableRef.current) {
        animId = requestAnimationFrame(loop);
        return;
      }

      if (!currentSelectedId || !chart || chart.isDisposed() || !currentDrawings.length || !canvas) {
        if (drawingToolbarRef.current) drawingToolbarRef.current.style.display = "none";
        if (drawingTooltipRef.current) drawingTooltipRef.current.style.display = "none";
        animId = requestAnimationFrame(loop);
        return;
      }

      const drawing = currentDrawings.find((d) => d.id === currentSelectedId);
      if (!drawing || drawing.points.length < 1) {
        if (drawingToolbarRef.current) drawingToolbarRef.current.style.display = "none";
        if (drawingTooltipRef.current) drawingTooltipRef.current.style.display = "none";
        animId = requestAnimationFrame(loop);
        return;
      }

      // --- 1. Position Floating Toolbar & Tooltip ---
      const pixels = drawing.points
        .map((p) => {
          const pos = chart.convertToPixel({ seriesIndex: 0 }, [
            p.time,
            p.value,
          ]);
          return pos ? { x: pos[0], y: pos[1] } : null;
        })
        .filter(Boolean) as { x: number; y: number }[];

      if (pixels.length === 0) {
        animId = requestAnimationFrame(loop);
        return;
      }

      const xs = pixels.map((p) => p.x);
      const ys = pixels.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);

      const midX = minX + (maxX - minX) / 2;
      const midY = minY;

      const canvasRect = canvas.getBoundingClientRect();
      const shieldWidth = currentGridRect ? currentGridRect.width : canvasRect.width;
      const fallbackHeight = canvasRect.height;
      const shieldHeight = currentGridRect && currentGridRect.height > 0
        ? currentGridRect.height
        : fallbackHeight - (currentGridRect ? currentGridRect.y : Math.max(30, fallbackHeight * 0.08)) - 30;

      const offsetX = currentGridRect ? currentGridRect.x : MAIN_GRID_LEFT;
      const offsetY = currentGridRect ? currentGridRect.y : Math.max(30, fallbackHeight * 0.08);

      // --- 2. Update Floating Toolbar ---
      if (drawingToolbarRef.current) {
        drawingToolbarRef.current.style.display = "flex";

        const relX = midX - offsetX;
        const relY = midY - offsetY;

        const toolbarWidth = 240;
        const topSpaceNeeded = 120; // Space needed above for toolbar + popup
        const bottomSpaceNeeded = 160; // Space needed below if flipping

        let finalY: number;
        let popupDir: "up" | "down" = "down";

        // Smart Vertical Flip Logic
        if (relY < topSpaceNeeded) {
          // No space above -> Force Below
          finalY = relY + 30 + toolbarOffsetRef.current.y;
          popupDir = "down";
        } else if (relY > shieldHeight - bottomSpaceNeeded) {
          // No space below for comfortable popup -> Force Above
          finalY = relY - 75 + toolbarOffsetRef.current.y;
          popupDir = "up";
        } else {
          // Default: Above
          finalY = relY - 75 + toolbarOffsetRef.current.y;
          popupDir = "down";
        }

        // Horizontal Clamping
        const halfW = toolbarWidth / 2;
        const finalX = Math.max(halfW, Math.min(shieldWidth - halfW, relX)) + toolbarOffsetRef.current.x;

        // CSS Variables injection for high-speed dynamic popup adjustments
        const style = drawingToolbarRef.current.style;
        style.left = `${finalX}px`;
        style.top = `${finalY}px`;

        if (popupDir === "up") {
          style.setProperty("--popup-top", "auto");
          style.setProperty("--popup-bottom", "35px");
          style.setProperty("--popup-transform", "translateY(0)");
        } else {
          style.setProperty("--popup-top", "30px");
          style.setProperty("--popup-bottom", "auto");
          style.setProperty("--popup-transform", "translateY(0)");
        }
      }

      // --- 3. Update Drawing Tooltip (Direct DOM) ---
      if (drawingTooltipRef.current) {
        //[TENOR 2026 FIX] HIDE generic tooltip for Position tools, Chart Patterns, AND Forecasting tools (Sector, Ghost Feed, etc.)
        // This prevents the "Tooltip Schism" where the DOM tooltip intercepts mouse events and breaks the Canvas hit-test.
        const isPattern = (drawing.type.includes("_pattern") && drawing.type !== "bar_pattern") || drawing.type === "head_and_shoulders";
        const isForecasting = drawing.type === "ghost_feed" || drawing.type === "sector";

        if (
          drawing.type === "long_position" ||
          drawing.type === "short_position" ||
          isPattern ||
          isForecasting
        ) {
          drawingTooltipRef.current.style.display = "none";
        } else {
          const p1 = drawing.points[0];
          const p2 = drawing.points[drawing.points.length - 1];
          const p1Px = pixels[0];
          const p2Px = pixels[pixels.length - 1];

          const price1 = p1.value;
          const price2 = p2.value;
          const priceDiff = price2 - price1;
          const priceChangePct = (priceDiff / price1) * 100;

          const htmlColors = {
            red: "#ff5252",
            green: "#00e676",
            slate: "#94a3b8",
            white: "#e2e8f0",
          };

          const isTrendPositive = priceDiff >= 0;
          const color = isTrendPositive ? htmlColors.green : htmlColors.red;
          const sign = isTrendPositive ? "+" : "";

          drawingTooltipRef.current.style.display = "block";
          drawingTooltipRef.current.style.zIndex = "200";

          // --- FEATURE-SPECIFIC TOOLTIP CONTENT ---
          let contentHtml = "";

          // DRY helper: price change HTML span (used in regression_trend + default tooltips)
          // [TENOR 2026 FIX] SCAR-XSS-01: Variables here are strictly numbers, inherently safe.
          const formatPriceHtml = (
            c: string,
            pd: number,
            s: string,
            pct: number,
          ) =>
            `<span style="color: ${c}; font-weight: 600;">${Math.abs(pd).toFixed(2)} (${s}${pct.toFixed(2)}%)</span>`;

          // Default: Angle & Distance
          const distPx = Math.sqrt(
            Math.pow(p2Px.x - p1Px.x, 2) + Math.pow(p2Px.y - p1Px.y, 2),
          );
          const angleRad = Math.atan2(p1Px.y - p2Px.y, p2Px.x - p1Px.x);
          let angleDeg = angleRad * (180 / Math.PI);
          if (angleDeg < 0) angleDeg += 360;

          if (drawing.type === "regression_trend") {
            contentHtml = `
              <div style="display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; align-items: center;">
                <span style="color: ${htmlColors.slate}; font-weight: 500;">Prx:</span>
                ${formatPriceHtml(color, priceDiff, sign, priceChangePct)}
                <span style="color: ${htmlColors.slate}; font-weight: 500;">Type:</span>
                <span style="color: ${htmlColors.white}; font-weight: 600;">Linear Reg.</span>
              </div>
            `;
          } else if (drawing.points.length === 1) {
            // Special view for single-point tools (H-Line, V-Line, etc)
            const isHLine = drawing.type === "horizontal_line" || drawing.type === "horizontal_ray";
            const isVLine = drawing.type === "vertical_line";
            
            // [TENOR 2026 FIX] SCAR-XSS-01: Strict DOMPurify for string variables
            const safeTime = typeof p1.time === "number" 
              ? new Date(p1.time).toLocaleDateString() 
              : DOMPurify.sanitize(String(p1.time), { ALLOWED_TAGS: [] });

            contentHtml = `
              <div style="display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; align-items: center;">
                ${
                  isHLine
                    ? `
                  <span style="color: ${htmlColors.slate}; font-weight: 500;">Prix:</span>
                  <span style="color: ${htmlColors.white}; font-weight: 600;">${price1.toFixed(2)}</span>
                `
                    : ""
                }
                ${
                  isVLine
                    ? `
                  <span style="color: ${htmlColors.slate}; font-weight: 500;">Date:</span>
                  <span style="color: ${htmlColors.white}; font-weight: 600;">${safeTime}</span>
                `
                    : ""
                }
                <span></span>
              </div>
            `;
          } else {
            contentHtml = `
              <div style="display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; align-items: center;">
                <span style="color: ${htmlColors.slate}; font-weight: 500;">Prx:</span>
                ${formatPriceHtml(color, priceDiff, sign, priceChangePct)}
                <span style="color: ${htmlColors.slate}; font-weight: 500;">Ang:</span>
                <span style="color: ${htmlColors.white}; font-weight: 600;">${Math.round(angleDeg)}°</span>
                <span style="color: ${htmlColors.slate}; font-weight: 500;">Dst:</span>
                <span style="color: ${htmlColors.slate}; font-weight: 400;">${Math.round(distPx)}px</span>
              </div>
            `;
          }

          // [TENOR 2026 FIX] SCAR-XSS-01: Dirty Checking Optimization & DOMPurify Strict Whitelist
          // Only update the DOM if the HTML string has actually changed.
          // This prevents severe GC stuttering and layout thrashing at 60 FPS.
          // DOMPurify guarantees absolute protection against XSS with a strict whitelist.
          if (lastTooltipHtmlRef.current !== contentHtml) {
            drawingTooltipRef.current.innerHTML = DOMPurify.sanitize(contentHtml, {
              ALLOWED_TAGS: ['div', 'span'],
              ALLOWED_ATTR: ['style']
            });
            lastTooltipHtmlRef.current = contentHtml;
          }

          const tipWidth = 160;
          const tipHeight = 85;
          const offset = 40;

          const relTooltipX = p2Px.x - offsetX;
          const relTooltipY = p2Px.y - offsetY;

          let finalX: number;
          let finalY: number;
          let transform: string;

          if (relTooltipX + offset + tipWidth > shieldWidth) {
            finalX = relTooltipX - offset - tipWidth;
          } else {
            finalX = relTooltipX + offset;
          }

          if (relTooltipY - offset - tipHeight < 10) {
            finalY = relTooltipY + 25;
            transform = "translate(0, 0)";
          } else {
            finalY = relTooltipY - offset;
            transform = "translate(0, -100%)";
          }

          drawingTooltipRef.current.style.transform = transform;
          drawingTooltipRef.current.style.left = `${finalX}px`;
          drawingTooltipRef.current.style.top = `${finalY}px`;
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animId);
    // [TENOR 2026 PERF-FIX BUG-2] Stable deps: loop created once. All dynamic data read from Refs.
  }, [chartInstanceRef, drawingCanvasRef, drawingToolbarRef, drawingTooltipRef, toolbarOffsetRef]);
};
// --- EOF ---