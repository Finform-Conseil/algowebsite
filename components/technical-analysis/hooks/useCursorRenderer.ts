import { useLayoutEffect, useRef, useCallback, useEffect } from 'react';
import type { EChartsInstance } from '../lib/types/echarts';
import { useMasterRenderLoop, type RenderFrameMeta } from './useMasterRenderLoop';
import {
  clamp,
  getOverlayScale,
  resolveChartPixelFromClient,
} from './overlays/overlayCoordinates';
import {
  applyStyle,
  createCrosshairElement,
  createDataWindowColumn,
  hideCrosshairElements,
  hideTooltipElement,
  updateCrosshairElements,
  type CrosshairDomElements,
} from './overlays/cursorDom';

const TOOLTIP_BASE_WIDTH = 240;
const TOOLTIP_BASE_HEIGHT = 160;
const TOOLTIP_MIN_SCALE = 0.62;
const TOOLTIP_EDGE_GAP = 6;
const COMPACT_TOOLTIP_WIDTH = 316;
const COMPACT_TOOLTIP_HEIGHT = 132;
const MICRO_TOOLTIP_WIDTH = 268;
const MICRO_TOOLTIP_HEIGHT = 112;
const MAX_CANVAS_DPR = 2;

// [TENOR 2026] Ajout des modes "magic" et "eraser" pour la parité TradingView
export type CursorMode = "arrow" | "arrow-tooltip" | "cross" | "cross-tooltip" | "dot" | "demonstration" | "magic" | "eraser";

export type CandleData = {
  time?: string | number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
} | (string | number)[];

interface UseCursorRendererProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLElement | null>;
  eventSourceRef?: React.RefObject<HTMLElement | null>;
  mode: CursorMode;
  suspendForDrawing?: boolean;
  chartRef: React.RefObject<EChartsInstance>;
  chartData: CandleData[];
  interactionScopeKey?: string;
}

// ============================================================================
// Magic particles use the last pushed canvas physics engine with a bounded object pool.
// ============================================================================
const MAX_PARTICLES = 150;
const GRAVITY = 0.4;
const EMOJIS = ['💩', '💸', '🌟', '🐎', '🍬', '🎄', '🎉', '⛄', '🎁', '🎯'];

interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  vAngle: number;
  life: number;
  maxLife: number;
  emoji: string;
  size: number;
}

const formatCursorDateText = (time: string | number): string => {
  const date = new Date(time);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear().toString();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const timeStr = typeof time === 'string' ? time : date.toISOString();
  const hasTime = timeStr.includes("T") && !timeStr.includes("T00:00:00");

  return hasTime
    ? `${dayName} ${day} ${month} ${year} ${hours}:${minutes}`
    : `${dayName} ${day} ${month} ${year}`;
};

const fallbackCursorDateText = (): string => {
  const now = new Date();
  return `${now.toLocaleDateString('en-US', { weekday: 'short' })} ${now.getDate().toString().padStart(2, '0')} ${now.toLocaleDateString('en-US', { month: 'short' })} ${now.getFullYear()}`;
};

const resolveCursorDateText = (
  chart: EChartsInstance | null,
  data: CandleData[],
  clientX: number,
  clientY: number
): string => {
  if (!chart || chart.isDisposed() || data.length === 0) return fallbackCursorDateText();

  try {
    const chartPixel = resolveChartPixelFromClient(chart, clientX, clientY);
    const pointInData = chart.convertFromPixel({ xAxisIndex: 0, yAxisIndex: 0 }, chartPixel);
    if (!pointInData || !Array.isArray(pointInData)) return fallbackCursorDateText();

    const dataIndex = Math.round(pointInData[0]);
    const safeIndex = Math.max(0, Math.min(data.length - 1, dataIndex));
    const candle = data[safeIndex];
    const time = Array.isArray(candle) ? candle[0] : candle?.time;

    return time ? formatCursorDateText(time) : fallbackCursorDateText();
  } catch {
    return fallbackCursorDateText();
  }
};

/**
 * High-performance cursor renderer hook for TechnicalAnalysis chart.
 * 
 * Renders custom cursor overlays (crosshair, dot, presentation mode, magic wand, eraser) on a canvas layer.
 * Magic wand particles use bounded canvas physics copied from the last pushed implementation.
 * Uses ResizeObserver for robust canvas sizing and useMasterRenderLoop for smooth rendering.
 * Now supports "Pro" Order Flow style tooltips with visual candles and a Physics Engine.
 */
export const useCursorRenderer = ({
  canvasRef,
  containerRef,
  eventSourceRef,
  mode,
  suspendForDrawing = false,
  chartRef,
  chartData,
  interactionScopeKey,
}: UseCursorRendererProps) => {
  const mouseRef = useRef<{ x: number, y: number, clientX: number, clientY: number } | null>(null);
  const isReadyRef = useRef(false);
  const isDirtyRef = useRef(true);
  const modeRef = useRef<CursorMode>(mode);
  const suspendForDrawingRef = useRef(Boolean(suspendForDrawing));
  const pointerGestureActiveRef = useRef(false);
  const chartDataRef = useRef<CandleData[]>(chartData);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const crosshairElementsRef = useRef<CrosshairDomElements | null>(null);
  const particlesRef = useRef<Particle[]>(
    Array.from({ length: MAX_PARTICLES }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      angle: 0,
      vAngle: 0,
      life: 0,
      maxLife: 1,
      emoji: '',
      size: 12,
    }))
  );
  const particleIndexRef = useRef(0);
  const canvasRectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const canvasMetricsRef = useRef<{ width: number; height: number; dpr: number } | null>(null);
  const hasCanvasContentRef = useRef(false);
  const cursorVisualsVisibleRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const tooltip = document.createElement('div');
    tooltip.className = 'gp-cursor-data-window';
    Object.assign(tooltip.style, {
      position: 'absolute',
      zIndex: '92',
      display: 'none',
      pointerEvents: 'none',
      boxSizing: 'border-box',
      border: '1px solid rgba(96, 165, 250, 0.62)',
      borderRadius: '4px',
      background: 'rgba(14, 38, 70, 0.9)',
      boxShadow: '0 14px 30px rgba(4, 12, 28, 0.42)',
      color: '#e5eefc',
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontVariantNumeric: 'tabular-nums',
      lineHeight: '1.15',
      overflow: 'hidden',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
      textRendering: 'geometricPrecision',
      opacity: '1',
      filter: 'none',
      backdropFilter: 'blur(8px) saturate(1.12)',
    } as Partial<CSSStyleDeclaration>);

    container.appendChild(tooltip);
    tooltipRef.current = tooltip;

    const vertical = createCrosshairElement('gp-cursor-crosshair-line gp-cursor-crosshair-line--vertical');
    applyStyle(vertical, {
      top: '0',
      bottom: '0',
      left: '0',
      width: '0',
      'border-left': '1px dashed rgba(148, 163, 184, 0.82)',
      'backface-visibility': 'hidden',
    });

    const horizontal = createCrosshairElement('gp-cursor-crosshair-line gp-cursor-crosshair-line--horizontal');
    applyStyle(horizontal, {
      left: '0',
      right: '0',
      top: '0',
      height: '0',
      'border-top': '1px dashed rgba(148, 163, 184, 0.82)',
      'backface-visibility': 'hidden',
    });

    const dateLabel = createCrosshairElement('gp-cursor-date-label');
    applyStyle(dateLabel, {
      left: '0',
      top: '0',
      'align-items': 'center',
      'justify-content': 'center',
      'z-index': '23',
      'border-radius': '3px',
      background: 'rgba(30, 34, 45, 0.98)',
      color: '#ffffff',
      'font-family': 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      'font-size': '11px',
      'font-weight': '800',
      'font-variant-numeric': 'tabular-nums',
      'line-height': '1',
      'letter-spacing': '0',
      'white-space': 'nowrap',
      'text-rendering': 'geometricPrecision',
      '-webkit-font-smoothing': 'antialiased',
      'box-shadow': '0 6px 14px rgba(0, 0, 0, 0.28)',
    });

    container.append(vertical, horizontal, dateLabel);
    crosshairElementsRef.current = { vertical, horizontal, dateLabel };

    return () => {
      tooltip.remove();
      if (tooltipRef.current === tooltip) tooltipRef.current = null;
      vertical.remove();
      horizontal.remove();
      dateLabel.remove();
      if (crosshairElementsRef.current?.vertical === vertical) {
        crosshairElementsRef.current = null;
      }
    };
  }, [containerRef, interactionScopeKey]);

  // --- GESTIONNAIRE D'ÉVÉNEMENTS SOURIS & PARTICULES ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === 'undefined') return;

    const resolvePoint = (event: PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      let rect = canvasRectRef.current;
      if (!rect || rect.width <= 0 || rect.height <= 0) {
        const liveRect = canvas.getBoundingClientRect();
        rect = { left: liveRect.left, top: liveRect.top, width: liveRect.width, height: liveRect.height };
        canvasRectRef.current = rect;
      }

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < 0 || x > rect.width || y < 0 || y > rect.height) return null;

      return { x, y, clientX: event.clientX, clientY: event.clientY };
    };

    const clearPointerState = () => {
      if (!mouseRef.current && !hasCanvasContentRef.current && !cursorVisualsVisibleRef.current) return;
      mouseRef.current = null;
      cursorVisualsVisibleRef.current = false;
      hideTooltipElement(tooltipRef.current);
      hideCrosshairElements(crosshairElementsRef.current);
      isDirtyRef.current = true;
    };

    const syncPointerState = (event: PointerEvent) => {
      const point = resolvePoint(event);
      if (!point) {
        clearPointerState();
        return null;
      }

      const previous = mouseRef.current;
      mouseRef.current = point;
      cursorVisualsVisibleRef.current = true;
      if (modeRef.current !== 'magic' && (!previous || Math.round(previous.x) !== Math.round(point.x) || Math.round(previous.y) !== Math.round(point.y))) {
        isDirtyRef.current = true;
      }
      return point;
    };

    const spawnMagicParticles = (event: PointerEvent) => {
      if (suspendForDrawingRef.current) return;
      const point = syncPointerState(event);
      if (!point) return;

      const count = Math.floor(10 + Math.random() * 10);
      const particles = particlesRef.current;

      for (let i = 0; i < count; i += 1) {
        const idx = particleIndexRef.current;
        const particle = particles[idx];

        particle.active = true;
        particle.x = point.x;
        particle.y = point.y;
        particle.vx = (Math.random() - 0.5) * 10;
        particle.vy = (Math.random() - 1) * 12 - 2;
        particle.angle = Math.random() * Math.PI * 2;
        particle.vAngle = (Math.random() - 0.5) * 0.4;
        particle.maxLife = 50 + Math.random() * 40;
        particle.life = particle.maxLife;
        particle.emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
        particle.size = 18 + Math.random() * 16;

        particleIndexRef.current = (idx + 1) % MAX_PARTICLES;
      }

      isDirtyRef.current = true;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (suspendForDrawingRef.current || (modeRef.current !== 'magic' && (pointerGestureActiveRef.current || event.buttons !== 0))) {
        pointerGestureActiveRef.current = event.buttons !== 0;
        clearPointerState();
        return;
      }

      if (!syncPointerState(event)) return;
    };

    const handlePointerDown = (event: PointerEvent) => {
      const point = syncPointerState(event);
      if (!point) return;
      pointerGestureActiveRef.current = true;
      if (suspendForDrawingRef.current) {
        clearPointerState();
        return;
      }
      if (modeRef.current !== 'magic') {
        isDirtyRef.current = true;
        return;
      }
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      spawnMagicParticles(event);
    };

    const releasePointerGesture = () => {
      pointerGestureActiveRef.current = false;
      isDirtyRef.current = true;
    };

    const cancelPointerGesture = () => {
      pointerGestureActiveRef.current = false;
      clearPointerState();
    };

    const handleWindowBlur = () => cancelPointerGesture();

    window.addEventListener('pointermove', handlePointerMove, { capture: true });
    window.addEventListener('pointerdown', handlePointerDown, { capture: true });
    window.addEventListener('pointerup', releasePointerGesture, { capture: true });
    window.addEventListener('pointercancel', cancelPointerGesture, { capture: true });
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove, { capture: true });
      window.removeEventListener('pointerdown', handlePointerDown, { capture: true });
      window.removeEventListener('pointerup', releasePointerGesture, { capture: true });
      window.removeEventListener('pointercancel', cancelPointerGesture, { capture: true });
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [canvasRef, containerRef, eventSourceRef, interactionScopeKey]);

  useEffect(() => {
    modeRef.current = mode;
    isDirtyRef.current = true;
  }, [mode]);

  useEffect(() => {
    suspendForDrawingRef.current = Boolean(suspendForDrawing);
    if (suspendForDrawingRef.current) {
      pointerGestureActiveRef.current = false;
      mouseRef.current = null;
      cursorVisualsVisibleRef.current = false;
      hideTooltipElement(tooltipRef.current);
      hideCrosshairElements(crosshairElementsRef.current);
    }
    isDirtyRef.current = true;
  }, [suspendForDrawing]);

  useEffect(() => {
    chartDataRef.current = chartData;
    isDirtyRef.current = true;
  }, [chartData]);

  useEffect(() => {
    let isActive = true;
    let attachedChart: EChartsInstance | null = null;
    let retryRafId: number | null = null;
    let retryCount = 0;

    const markDirty = () => {
      isDirtyRef.current = true;
    };

    const clearRetry = () => {
      if (retryRafId !== null) {
        cancelAnimationFrame(retryRafId);
        retryRafId = null;
      }
    };

    const detach = () => {
      if (!attachedChart) return;
      try {
        if (!attachedChart.isDisposed()) {
          attachedChart.off('datazoom', markDirty);
          attachedChart.off('restore', markDirty);
          attachedChart.off('finished', markDirty);
        }
      } catch {
        // ECharts may throw while a chart is being disposed during layout remount.
      } finally {
        attachedChart = null;
      }
    };

    const attach = () => {
      if (!isActive) return;
      clearRetry();

      const chart = chartRef.current;
      try {
        if (!chart || chart.isDisposed()) {
          if (retryCount < 12) {
            retryCount += 1;
            retryRafId = requestAnimationFrame(attach);
          }
          return;
        }

        if (attachedChart === chart) return;
        detach();
        attachedChart = chart;
        chart.on('datazoom', markDirty);
        chart.on('restore', markDirty);
        chart.on('finished', markDirty);
        markDirty();
      } catch {
        if (retryCount < 12) {
          retryCount += 1;
          retryRafId = requestAnimationFrame(attach);
        }
      }
    };

    attach();

    return () => {
      isActive = false;
      clearRetry();
      detach();
    };
  }, [chartRef, interactionScopeKey]);

  // ============================================================================
  // 1. CANVAS SIZING & RESIZE OBSERVER
  // ============================================================================
  useLayoutEffect(() => {
    // [TENOR 2026 SRE FIX] SCAR-CURSOR-CANVAS-STALE-BACKINGSTORE:
    // When key={chartInteractionScopeKey} remounts the canvas (layout 1→4→6),
    // canvasRef and containerRef are the same ref OBJECTS — only .current changes.
    // Without interactionScopeKey in deps, this effect never re-ran on layout switch.
    // The new canvas kept its HTML default 300×150 backing store while CSS stretched
    // it to fill 100%×100%, causing dpr = 300/realWidth ≈ 0.5 → everything distorted.
    // Fix: include interactionScopeKey in deps + eagerly reset isReadyRef so the
    // render loop is blocked until syncCanvasSize succeeds on the new canvas/container.
    isReadyRef.current = false;

    let isDisposed = false;
    let resizeObserver: ResizeObserver | null = null;
    let retryFrameId: number | null = null;

    const cancelRetry = () => {
      if (retryFrameId !== null) {
        cancelAnimationFrame(retryFrameId);
        retryFrameId = null;
      }
    };

    // Critical: Canvas internal size must match CSS display size.
    const syncCanvasSize = (): boolean => {
      const canvas = canvasRef.current;
      const container = containerRef.current;

      if (!canvas || !container) {
        isReadyRef.current = false;
        return false;
      }

      const rect = container.getBoundingClientRect();
      canvasRectRef.current = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };

      // GUARD: Don't initialize if container hasn't been laid out yet.
      if (rect.width < 10 || rect.height < 10) {
        isReadyRef.current = false;
        return false;
      }

      const displayWidth = Math.floor(rect.width);
      const displayHeight = Math.floor(rect.height);
      const dpr = Math.min(MAX_CANVAS_DPR, Math.max(1, window.devicePixelRatio || 1));
      canvasMetricsRef.current = { width: displayWidth, height: displayHeight, dpr };
      const backingWidth = Math.max(1, Math.round(displayWidth * dpr));
      const backingHeight = Math.max(1, Math.round(displayHeight * dpr));

      // Only resize if dimensions actually changed.
      if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
        canvas.width = backingWidth;
        canvas.height = backingHeight;
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
        isDirtyRef.current = true;
      }

      isReadyRef.current = true;
      return true;
    };

    const attachWhenReady = () => {
      if (isDisposed) return;
      cancelRetry();

      const container = containerRef.current;
      if (!container || !syncCanvasSize()) {
        retryFrameId = requestAnimationFrame(attachWhenReady);
        return;
      }

      resizeObserver?.disconnect();
      resizeObserver = new ResizeObserver(() => {
        if (!syncCanvasSize()) {
          retryFrameId = requestAnimationFrame(attachWhenReady);
        }
      });

      resizeObserver.observe(container);
      isDirtyRef.current = true;
    };

    attachWhenReady();

    return () => {
      isDisposed = true;
      cancelRetry();
      resizeObserver?.disconnect();
      canvasMetricsRef.current = null;
      // Reset ready state so that if the canvas remounts (key change), the render
      // loop is blocked until the new syncCanvasSize runs successfully.
      isReadyRef.current = false;
    };
  }, [canvasRef, containerRef, interactionScopeKey]);

  // ============================================================================
  // 2. RENDER LOOP (Orchestrated by MasterRenderLoop)
  // ============================================================================
  const render = useCallback((_time: number, _meta: RenderFrameMeta) => {
    const currentMode = modeRef.current;
    const particles = particlesRef.current;
    const hasActiveParticles = particles.some((particle) => particle.active);
    if (!isDirtyRef.current && currentMode !== 'demonstration' && !hasActiveParticles) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || !isReadyRef.current) return;

    const canvasMetrics = canvasMetricsRef.current;
    if (!canvasMetrics) return;
    const logicalWidth = Math.max(1, canvasMetrics.width);
    const logicalHeight = Math.max(1, canvasMetrics.height);
    ctx.setTransform(canvasMetrics.dpr, 0, 0, canvasMetrics.dpr, 0, 0);

    const shouldSuspendCursorRender = suspendForDrawingRef.current || (pointerGestureActiveRef.current && currentMode !== 'magic');
    if (shouldSuspendCursorRender) {
      if (hasCanvasContentRef.current) {
        ctx.clearRect(0, 0, logicalWidth, logicalHeight);
        hasCanvasContentRef.current = false;
      }
      hideTooltipElement(tooltipRef.current);
      hideCrosshairElements(crosshairElementsRef.current);
      cursorVisualsVisibleRef.current = false;
      isDirtyRef.current = false;
      return;
    }

    isDirtyRef.current = false;
    const currentChartData = chartDataRef.current;

    if (currentMode === 'magic') {
      hideTooltipElement(tooltipRef.current);
      hideCrosshairElements(crosshairElementsRef.current);
    }

    /**
     * DRAW PRO TOOLTIP (Exocharts Style)
     * Renders a sophisticated tooltip with:
     * - Visual Candle (Big graphical representation)
     * - Detailed OHLC + Volume
     * - Metrics: Range, Body, Wicks
     */
    const drawProTooltip = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      clientX: number,
      clientY: number,
      w: number,
      h: number,
      chart: EChartsInstance,
      data: CandleData[]
    ) => {
      const hideHtmlTooltip = () => hideTooltipElement(tooltipRef.current);

      // 1. Get Candle Data
      if (chart.isDisposed()) return;
      let pointInData;
      try {
        pointInData = chart.convertFromPixel({ xAxisIndex: 0, yAxisIndex: 0 }, resolveChartPixelFromClient(chart, clientX, clientY));
      } catch {
        return;
      }

      if (!pointInData || !Array.isArray(pointInData)) return;
      const dataIndex = Math.round(pointInData[0]);
      if (dataIndex < 0 || dataIndex >= data.length) return;

      const candle = data[dataIndex];
      let dOpen, dHigh, dLow, dClose, dVol;

      // Handle data formats
      if (Array.isArray(candle)) {
        dOpen = Number(candle[1]);
        dClose = Number(candle[2]);
        dLow = Number(candle[3]);
        dHigh = Number(candle[4]);
        dVol = Number(candle[5] || 0);
      } else if (candle && typeof candle === 'object') {
        dOpen = Number(candle.open ?? 0);
        dHigh = Number(candle.high ?? 0);
        dLow = Number(candle.low ?? 0);
        dClose = Number(candle.close ?? 0);
        dVol = Number(candle.volume ?? 0);
      } else {
        return;
      }

      // 2. Calculations
      const isBullish = dClose >= dOpen;
      const colorBull = '#00da3c'; // Green
      const colorBear = '#ce4243'; // Red
      const candleColor = isBullish ? colorBull : colorBear;

      const metrics = {
        rng: (dHigh - dLow).toFixed(2),
        body: Math.abs(dOpen - dClose).toFixed(2),
        upW: (dHigh - Math.max(dOpen, dClose)).toFixed(2),
        dnW: (Math.min(dOpen, dClose) - dLow).toFixed(2),
      };

      const shouldUseHtmlTooltip = w > 0 && h > 0;
      if (shouldUseHtmlTooltip) {
        const isMicroSurface = w < 480 || h < 300;
        const targetWidth = isMicroSurface ? MICRO_TOOLTIP_WIDTH : COMPACT_TOOLTIP_WIDTH;
        const targetHeight = isMicroSurface ? MICRO_TOOLTIP_HEIGHT : COMPACT_TOOLTIP_HEIGHT;
        const minWidth = isMicroSurface ? 238 : 292;
        const minHeight = isMicroSurface ? 104 : 124;
        const compactWidth = Math.min(targetWidth, Math.max(minWidth, w - TOOLTIP_EDGE_GAP * 2));
        const compactHeight = Math.min(targetHeight, Math.max(minHeight, h - TOOLTIP_EDGE_GAP * 2));
        const compactPadding = isMicroSurface ? 8 : 10;
        const rowHeight = isMicroSurface ? 17 : 20;
        const offset = isMicroSurface ? 10 : 12;
        const fontSize = isMicroSurface ? 11 : 12;

        let boxX = x + offset;
        let boxY = y + offset;
        if (boxX + compactWidth > w) boxX = x - offset - compactWidth;
        if (boxY + compactHeight > h) boxY = y - offset - compactHeight;
        boxX = clamp(boxX, TOOLTIP_EDGE_GAP, Math.max(TOOLTIP_EDGE_GAP, w - compactWidth - TOOLTIP_EDGE_GAP));
        boxY = clamp(boxY, TOOLTIP_EDGE_GAP, Math.max(TOOLTIP_EDGE_GAP, h - compactHeight - TOOLTIP_EDGE_GAP));

        const labelColor = '#cbd5e1';
        const valColor = '#ffffff';
        const statColor = '#f59e0b';
        const leftRows = [
          { label: 'O', value: dOpen.toFixed(2), color: valColor },
          { label: 'H', value: dHigh.toFixed(2), color: valColor },
          { label: 'L', value: dLow.toFixed(2), color: valColor },
          { label: 'C', value: dClose.toFixed(2), color: candleColor },
          { label: 'V', value: (dVol / 1000).toFixed(1) + 'k', color: valColor },
        ];
        const rightRows = [
          { label: 'R', value: metrics.rng, color: statColor },
          { label: 'B', value: metrics.body, color: statColor },
          { label: 'UW', value: metrics.upW, color: statColor },
          { label: 'DW', value: metrics.dnW, color: statColor },
        ];

        const tooltip = tooltipRef.current;
        if (!tooltip) return;

        tooltip.style.display = 'grid';
        tooltip.style.left = `${Math.round(boxX)}px`;
        tooltip.style.top = `${Math.round(boxY)}px`;
        tooltip.style.width = `${Math.round(compactWidth)}px`;
        tooltip.style.height = `${Math.round(compactHeight)}px`;
        tooltip.style.padding = `${compactPadding}px ${compactPadding + 2}px`;
        tooltip.style.gridTemplateColumns = 'minmax(0, 1.04fr) minmax(0, 0.96fr)';
        tooltip.style.alignItems = 'center';
        tooltip.style.columnGap = isMicroSurface ? '10px' : '16px';
        tooltip.style.rowGap = '0';
        tooltip.style.fontSize = `${fontSize}px`;
        tooltip.style.background = 'rgba(14, 38, 70, 0.9)';
        tooltip.style.borderColor = 'rgba(96, 165, 250, 0.5)';
        tooltip.style.boxShadow = '0 14px 30px rgba(4, 12, 28, 0.44)';
        tooltip.style.lineHeight = '1';
        tooltip.style.zIndex = '92';
        tooltip.style.opacity = '1';
        tooltip.style.color = '#f8fafc';
        tooltip.style.backdropFilter = 'blur(8px) saturate(1.12)';

        const columnOptions = {
          labelWidth: isMicroSurface ? 18 : 22,
          rowHeight,
          labelColor,
          fontSize,
        };
        const tooltipContentKey = [
          dataIndex,
          isMicroSurface ? 'micro' : 'compact',
          Math.round(compactWidth),
          Math.round(compactHeight),
          rowHeight,
          fontSize,
          dOpen,
          dHigh,
          dLow,
          dClose,
          dVol,
        ].join('|');
        if (tooltip.dataset.contentKey !== tooltipContentKey) {
          tooltip.dataset.contentKey = tooltipContentKey;
          tooltip.replaceChildren(
            createDataWindowColumn(leftRows, columnOptions),
            createDataWindowColumn(rightRows, columnOptions)
          );
        }

        return;
      }

      hideHtmlTooltip();

      // 3. Layout Configuration
      const scale = getOverlayScale(w, h, TOOLTIP_MIN_SCALE);
      const boxWidth = TOOLTIP_BASE_WIDTH * scale;
      const boxHeight = TOOLTIP_BASE_HEIGHT * scale;
      const padding = 12 * scale;
      const visualCandleWidth = 30 * scale; // Width of the graphical candle area
      const offset = 18 * scale;

      // Smart Positioning (Flip if near edges)
      let boxX = x + offset;
      let boxY = y + offset;

      if (boxX + boxWidth > w) boxX = x - offset - boxWidth;
      if (boxY + boxHeight > h) boxY = y - offset - boxHeight;
      boxX = clamp(boxX, TOOLTIP_EDGE_GAP, Math.max(TOOLTIP_EDGE_GAP, w - boxWidth - TOOLTIP_EDGE_GAP));
      boxY = clamp(boxY, TOOLTIP_EDGE_GAP, Math.max(TOOLTIP_EDGE_GAP, h - boxHeight - TOOLTIP_EDGE_GAP));

      // 4. Draw Background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)'; // Slate-900 transparent
      ctx.strokeStyle = '#334155'; // Slate-700 border
      ctx.lineWidth = Math.max(1, scale);
      ctx.setLineDash([]);
      ctx.beginPath();
      // Remove rounded corners for "Pro" feel, Exocharts uses sharp corners often,
      // but slight radius looks better in modern UI. Keeping radius small (2px).
      ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 2 * scale);
      ctx.fill();
      ctx.stroke();

      // 5. Draw Visual Candle (Left Side)
      const candleAreaX = boxX + padding;
      const candleAreaY = boxY + padding;
      const candleAreaH = boxHeight - padding * 2;
      const candleAreaW = visualCandleWidth;

      // Visual ratios
      const rng = dHigh - dLow || 1; // Avoid divide by zero
      const bodyH = Math.abs(dOpen - dClose);
      const wickTopH = dHigh - Math.max(dOpen, dClose);

      // Scale factor to fit inside the candle area
      const pxPerUnit = candleAreaH / (rng * 1.2); // 1.2 for breathing room

      const visualBodyH = Math.max(1, bodyH * pxPerUnit); // Min 1px
      const visualWickTopH = wickTopH * pxPerUnit;

      // Center vertically in the area
      const startY = candleAreaY + (candleAreaH - (rng * pxPerUnit)) / 2;
      const topY = startY;
      const bodyTopY = topY + visualWickTopH;

      ctx.fillStyle = candleColor;
      ctx.strokeStyle = candleColor;

      // Draw Wicks (Center line)
      const centerX = candleAreaX + candleAreaW / 2;
      ctx.beginPath();
      ctx.moveTo(centerX, startY);
      ctx.lineTo(centerX, startY + (rng * pxPerUnit));
      ctx.lineWidth = Math.max(1, 2 * scale); // Thicker wicks for visual impact
      ctx.stroke();

      // Draw Body (Rectangle)
      const bodyW = 16 * scale;
      ctx.beginPath();
      ctx.fillRect(centerX - bodyW / 2, bodyTopY, bodyW, visualBodyH);

      // 6. Draw Text Data (Right Side)
      const textStartX = boxX + padding + candleAreaW + padding;
      const col1X = textStartX;
      const col2X = textStartX + 90 * scale;
      const lineHeight = 20 * scale;
      const labelColor = '#94a3b8'; // Slate-400
      const valColor = '#f8fafc'; // Slate-50

      ctx.font = `${Math.max(9, 11 * scale)}px Inter, system-ui, sans-serif`;
      ctx.textBaseline = 'middle';

      // Column 1: OHLCV
      const col1Data = [
        { L: "Open", V: dOpen.toFixed(2) },
        { L: "High", V: dHigh.toFixed(2) },
        { L: "Low", V: dLow.toFixed(2) },
        { L: "Close", V: dClose.toFixed(2) },
        { L: "Vol", V: (dVol / 1000).toFixed(1) + 'k' }, // Format volume K
      ];

      col1Data.forEach((item, i) => {
        const yPos = candleAreaY + (10 * scale) + (i * lineHeight);
        // Label
        ctx.textAlign = 'left';
        ctx.fillStyle = labelColor;
        ctx.fillText(item.L, col1X, yPos);
        // Value
        ctx.textAlign = 'right';
        ctx.fillStyle = i === 3 ? candleColor : valColor; // Color close price
        ctx.fillText(item.V, col1X + 80 * scale, yPos);
      });

      // Column 2: Stats
      const col2Data = [
        { L: "Rng", V: metrics.rng },
        { L: "Body", V: metrics.body },
        { L: "UpW", V: metrics.upW },
        { L: "DnW", V: metrics.dnW },
        // Delta/OI placeholders removed as per plan
      ];

      col2Data.forEach((item, i) => {
        const yPos = candleAreaY + (10 * scale) + (i * lineHeight);
        // Label
        ctx.textAlign = 'left';
        ctx.fillStyle = labelColor;
        ctx.fillText(item.L, col2X, yPos);
        // Value
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fb923c'; // Orange for stats (like user screenshot)
        ctx.fillText(item.V, col2X + 80 * scale, yPos);
      });
    };

    const modeUsesCanvas = currentMode === 'dot' || currentMode === 'demonstration' || currentMode === 'eraser' || currentMode === 'cross-tooltip' || currentMode === 'arrow-tooltip' || currentMode === 'magic' || hasActiveParticles;
    if (modeUsesCanvas || hasCanvasContentRef.current) {
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);
    }
    hasCanvasContentRef.current = modeUsesCanvas;

    for (const particle of particles) {
      if (!particle.active) continue;

      const frameStep = Math.max(1, Math.min(3, _meta.delta / 16.7));
      particle.vy += GRAVITY * frameStep;
      particle.x += particle.vx * frameStep;
      particle.y += particle.vy * frameStep;
      particle.angle += particle.vAngle * frameStep;
      particle.life -= frameStep;

      if (particle.life <= 0) {
        particle.active = false;
        continue;
      }

      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.angle);
      ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      ctx.font = particle.size + 'px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(particle.emoji, 0, 0);
      ctx.restore();
    }

    // ============================================================================
    // RENDU DES CURSEURS SPÉCIFIQUES (Dépendant de la souris)
    // ============================================================================
    if (mouseRef.current) {
      const { x, y, clientX, clientY } = mouseRef.current;
      const w = logicalWidth;
      const h = logicalHeight;

      const accentCyan = '#29b6f6';

      const chart = chartRef.current;
      const showCrosshairLines = currentMode === 'cross' || currentMode === 'cross-tooltip' || currentMode === 'eraser';
      const showDateLabel = currentMode === 'cross' || currentMode === 'cross-tooltip' || currentMode === 'arrow-tooltip';

      updateCrosshairElements(crosshairElementsRef.current, {
        x,
        y,
        width: w,
        height: h,
        showLines: showCrosshairLines,
        showDateLabel,
        dateText: showDateLabel ? resolveCursorDateText(chart ?? null, currentChartData, clientX, clientY) : '',
      });

      if (currentMode !== 'cross-tooltip' && currentMode !== 'arrow-tooltip') {
        hideTooltipElement(tooltipRef.current);
      }

      // --- MODE: CROSS & CROSS-TOOLTIP ---
      if (currentMode === 'cross' || currentMode === 'cross-tooltip') {
        if (currentMode === 'cross-tooltip') {
          if (chart && currentChartData.length > 0) {
            drawProTooltip(ctx, x, y, clientX, clientY, w, h, chart, currentChartData);
          } else {
            hideTooltipElement(tooltipRef.current);
          }
        } else {
          hideTooltipElement(tooltipRef.current);
        }
      }

      // --- MODE: ARROW-TOOLTIP ---
      if (currentMode === 'arrow-tooltip') {
        if (chart && currentChartData.length > 0) {
          drawProTooltip(ctx, x, y, clientX, clientY, w, h, chart, currentChartData);
        } else {
          hideTooltipElement(tooltipRef.current);
        }
      }

      // --- MODE: DOT ---
      if (currentMode === 'dot') {
        ctx.save();
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      // --- MODE: DEMONSTRATION ---
      if (currentMode === 'demonstration') {
        ctx.save();
        const pulseSize = 15 + Math.sin(_time / 200) * 3;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(41, 182, 246, 0.2)';
        ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = accentCyan;
        ctx.shadowBlur = 10;
        ctx.shadowColor = accentCyan;
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        isDirtyRef.current = true;
      }

      // --- MODE: MAGIC WAND ---
      if (currentMode === 'magic') {
        ctx.save();
        ctx.font = '22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🪄', x + 12, y - 12);
        ctx.restore();
      }

      // --- MODE: ERASER ---
      if (currentMode === 'eraser') {
        // [TENOR 2026 FIX] TradingView Parity Eraser Icon
        ctx.save();
        // Offset the eraser icon to the bottom right of the cursor
        ctx.translate(x + 16, y + 16);
        ctx.rotate(-Math.PI / 4); // Tilt 45 degrees

        // Shadow for depth
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;

        // Draw Eraser Body
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(-6, -10, 12, 20, 2);
        } else {
          ctx.rect(-6, -10, 12, 20);
        }
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.shadowColor = 'transparent'; // turn off shadow for stroke
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#131722';
        ctx.stroke();

        // Draw Eraser Top (Dark sleeve)
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(-6, -10, 12, 8, [2, 2, 0, 0]);
        } else {
          ctx.rect(-6, -10, 12, 8);
        }
        ctx.fillStyle = '#4b5563'; // Slate 600
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      }
    } else {
      hideTooltipElement(tooltipRef.current);
      hideCrosshairElements(crosshairElementsRef.current);
    }
  }, [canvasRef, chartRef]);

  // ============================================================================
  // 3. MASTER RENDER LOOP SUBSCRIPTION
  // ============================================================================
  useMasterRenderLoop(render, "cursor-canvas");
};

// --- EOF ---
