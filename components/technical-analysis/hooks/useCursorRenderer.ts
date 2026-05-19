import { useLayoutEffect, useRef, useCallback, useEffect } from 'react';
import * as echarts from 'echarts/core';
import { useMasterRenderLoop, type RenderFrameMeta } from './useMasterRenderLoop';

const MAIN_GRID_LEFT = 15;
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
  mode: CursorMode;
  chartRef: React.RefObject<echarts.ECharts>;
  chartData: CandleData[];
  interactionScopeKey?: string;
}

// ============================================================================
// [TENOR 2026 SRE] MOTEUR PHYSIQUE DE PARTICULES (OBJECT POOL PATTERN)
// ============================================================================
// Pour garantir 60 FPS et éviter les saccades du Garbage Collector (GC Stuttering),
// nous pré-allouons un tableau fixe de particules. Zéro allocation mémoire pendant le rendu.
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

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const hideTooltipElement = (tooltip: HTMLDivElement | null): void => {
  if (!tooltip) return;
  tooltip.style.display = 'none';
};

const getOverlayScale = (width: number, height: number): number =>
  clamp(Math.min(width / 900, height / 480), TOOLTIP_MIN_SCALE, 1);

const resolveChartPixelFromClient = (
  chart: echarts.ECharts,
  clientX: number,
  clientY: number
): [number, number] => {
  const chartRect = chart.getDom().getBoundingClientRect();
  return [clientX - chartRect.left, clientY - chartRect.top];
};

const resolveCanvasPoint = (
  canvas: HTMLCanvasElement,
  event: PointerEvent
): { x: number; y: number; clientX: number; clientY: number } | null => {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;

  const cssX = event.clientX - rect.left;
  const cssY = event.clientY - rect.top;
  if (cssX < 0 || cssX > rect.width || cssY < 0 || cssY > rect.height) return null;

  return {
    x: cssX,
    y: cssY,
    clientX: event.clientX,
    clientY: event.clientY,
  };
};

type DataWindowRow = {
  label: string;
  value: string;
  color: string;
};

type CrosshairDomElements = {
  vertical: HTMLDivElement;
  horizontal: HTMLDivElement;
  dateLabel: HTMLDivElement;
};

const applyStyle = (element: HTMLElement, styles: Record<string, string>): void => {
  Object.entries(styles).forEach(([property, value]) => {
    element.style.setProperty(property, value);
  });
};

const createDataWindowColumn = (
  rows: DataWindowRow[],
  options: { labelWidth: number; rowHeight: number; labelColor: string; fontSize: number }
): HTMLDivElement => {
  const column = document.createElement('div');
  applyStyle(column, {
    display: 'grid',
    gap: '0',
    'min-width': '0',
  });

  rows.forEach((item) => {
    const row = document.createElement('div');
    applyStyle(row, {
      display: 'grid',
      'grid-template-columns': `${options.labelWidth}px minmax(0, 1fr)`,
      'align-items': 'center',
      gap: '8px',
      height: `${options.rowHeight}px`,
      'min-width': '0',
    });

    const label = document.createElement('span');
    label.textContent = item.label;
    applyStyle(label, {
      color: options.labelColor,
      'font-size': `${options.fontSize}px`,
      'font-weight': '800',
      'white-space': 'nowrap',
    });

    const value = document.createElement('span');
    value.textContent = item.value;
    applyStyle(value, {
      color: item.color,
      'font-size': `${options.fontSize}px`,
      'font-weight': '900',
      'letter-spacing': '0',
      'text-align': 'right',
      'white-space': 'nowrap',
      overflow: 'hidden',
      'text-overflow': 'clip',
    });

    row.replaceChildren(label, value);
    column.appendChild(row);
  });

  return column;
};

const hideCrosshairElements = (elements: CrosshairDomElements | null): void => {
  if (!elements) return;
  elements.vertical.style.display = 'none';
  elements.horizontal.style.display = 'none';
  elements.dateLabel.style.display = 'none';
};

const createCrosshairElement = (className: string): HTMLDivElement => {
  const element = document.createElement('div');
  element.className = className;
  applyStyle(element, {
    position: 'absolute',
    display: 'none',
    'pointer-events': 'none',
    'box-sizing': 'border-box',
    'z-index': '22',
    'will-change': 'transform',
  });
  return element;
};

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
  chart: echarts.ECharts | null,
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

const updateCrosshairElements = (
  elements: CrosshairDomElements | null,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    showLines: boolean;
    showDateLabel: boolean;
    dateText: string;
  }
): void => {
  if (!elements) return;

  const snappedX = Math.round(options.x);
  const snappedY = Math.round(options.y);

  if (options.showLines) {
    elements.vertical.style.display = 'block';
    elements.vertical.style.transform = `translate3d(${snappedX}px, 0, 0)`;
    elements.horizontal.style.display = 'block';
    elements.horizontal.style.transform = `translate3d(0, ${snappedY}px, 0)`;
  } else {
    elements.vertical.style.display = 'none';
    elements.horizontal.style.display = 'none';
  }

  if (!options.showDateLabel) {
    elements.dateLabel.style.display = 'none';
    return;
  }

  const labelWidth = Math.ceil(options.dateText.length * 7.2 + 18);
  const labelHeight = 22;
  const labelLeft = clamp(
    options.x - labelWidth / 2,
    MAIN_GRID_LEFT,
    Math.max(MAIN_GRID_LEFT, options.width - labelWidth)
  );
  const labelTop = Math.max(0, options.height - labelHeight);

  elements.dateLabel.textContent = options.dateText;
  elements.dateLabel.style.display = 'flex';
  elements.dateLabel.style.width = `${labelWidth}px`;
  elements.dateLabel.style.height = `${labelHeight}px`;
  elements.dateLabel.style.transform = `translate3d(${Math.round(labelLeft)}px, ${Math.round(labelTop)}px, 0)`;
};

/**
 * High-performance cursor renderer hook for TechnicalAnalysis chart.
 * 
 * Renders custom cursor overlays (crosshair, dot, presentation mode, magic wand, eraser) on a canvas layer.
 * Uses ResizeObserver for robust canvas sizing and useMasterRenderLoop for smooth rendering.
 * Now supports "Pro" Order Flow style tooltips with visual candles and a Physics Engine.
 */
export const useCursorRenderer = ({ canvasRef, containerRef, mode, chartRef, chartData, interactionScopeKey }: UseCursorRendererProps) => {
  const mouseRef = useRef<{ x: number, y: number, clientX: number, clientY: number } | null>(null);
  const isReadyRef = useRef(false);
  const isDirtyRef = useRef(true);
  const modeRef = useRef<CursorMode>(mode);
  const chartDataRef = useRef<CandleData[]>(chartData);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const crosshairElementsRef = useRef<CrosshairDomElements | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const tooltip = document.createElement('div');
    tooltip.className = 'gp-cursor-data-window';
    Object.assign(tooltip.style, {
      position: 'absolute',
      zIndex: '24',
      display: 'none',
      pointerEvents: 'none',
      boxSizing: 'border-box',
      border: '1px solid rgba(96, 165, 250, 0.26)',
      borderRadius: '4px',
      background: 'rgba(8, 13, 32, 0.985)',
      boxShadow: '0 12px 26px rgba(0, 0, 0, 0.32)',
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
      backdropFilter: 'none',
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

  // --- INITIALISATION DE L'OBJECT POOL (Ring Buffer) ---
  const particlesRef = useRef<Particle[]>(
    Array.from({ length: MAX_PARTICLES }, () => ({
      active: false, x: 0, y: 0, vx: 0, vy: 0, angle: 0, vAngle: 0, life: 0, maxLife: 1, emoji: '', size: 12
    }))
  );
  const particleIndexRef = useRef(0);

  // --- GESTIONNAIRE D'ÉVÉNEMENTS SOURIS & PARTICULES ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handlePointerMove = (e: PointerEvent) => {
      const canvas = canvasRef.current;
      mouseRef.current = canvas ? resolveCanvasPoint(canvas, e) : null;
      isDirtyRef.current = true;
    };

    const handlePointerLeave = () => {
      mouseRef.current = null;
      hideTooltipElement(tooltipRef.current);
      hideCrosshairElements(crosshairElementsRef.current);
      isDirtyRef.current = true;
    };

    // [TENOR 2026] Spawn de particules au clic (Mode Magic)
    const handlePointerDown = (e: PointerEvent) => {
      if (mode !== 'magic') return;

      const canvas = canvasRef.current;
      const point = canvas ? resolveCanvasPoint(canvas, e) : null;
      if (!point) return;

      // Spawn 10 à 20 particules par clic
      const count = Math.floor(10 + Math.random() * 10);
      const particles = particlesRef.current;

      for (let i = 0; i < count; i++) {
        const idx = particleIndexRef.current;
        const p = particles[idx];

        // Réutilisation de l'objet (Zéro allocation)
        p.active = true;
        p.x = point.x;
        p.y = point.y;
        p.vx = (Math.random() - 0.5) * 10; // Dispersion horizontale
        p.vy = (Math.random() - 1) * 12 - 2; // Explosion vers le haut
        p.angle = Math.random() * Math.PI * 2;
        p.vAngle = (Math.random() - 0.5) * 0.4;
        p.maxLife = 50 + Math.random() * 40; // Durée de vie en frames
        p.life = p.maxLife;
        p.emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
        p.size = 18 + Math.random() * 16;

        // Avance le pointeur du Ring Buffer
        particleIndexRef.current = (idx + 1) % MAX_PARTICLES;
      }
      isDirtyRef.current = true;
    };

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerleave', handlePointerLeave);
    container.addEventListener('pointerdown', handlePointerDown);

    return () => {
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
      container.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [canvasRef, containerRef, mode, interactionScopeKey]); // Re-bind si le mode ou le DOM cible change

  useEffect(() => {
    modeRef.current = mode;
    isDirtyRef.current = true;
  }, [mode]);

  useEffect(() => {
    chartDataRef.current = chartData;
    isDirtyRef.current = true;
  }, [chartData]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || chart.isDisposed()) return;

    const markDirty = () => {
      isDirtyRef.current = true;
    };

    chart.on('datazoom', markDirty);
    chart.on('restore', markDirty);
    chart.on('finished', markDirty);

    return () => {
      if (chart.isDisposed()) return;
      chart.off('datazoom', markDirty);
      chart.off('restore', markDirty);
      chart.off('finished', markDirty);
    };
  }, [chartRef]);

  // ============================================================================
  // 1. CANVAS SIZING & RESIZE OBSERVER
  // ============================================================================
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    // [TENOR 2026 SRE FIX] SCAR-CURSOR-CANVAS-STALE-BACKINGSTORE:
    // When key={chartInteractionScopeKey} remounts the canvas (layout 1→4→6),
    // canvasRef and containerRef are the same ref OBJECTS — only .current changes.
    // Without interactionScopeKey in deps, this effect never re-ran on layout switch.
    // The new canvas kept its HTML default 300×150 backing store while CSS stretched
    // it to fill 100%×100%, causing dpr = 300/realWidth ≈ 0.5 → everything distorted.
    // Fix: include interactionScopeKey in deps + eagerly reset isReadyRef so the
    // render loop is blocked until syncCanvasSize succeeds on the new canvas/container.
    isReadyRef.current = false;

    if (!canvas || !container) return;

    // Critical: Canvas internal size must match CSS display size
    const syncCanvasSize = (): boolean => {
      const rect = container.getBoundingClientRect();
      
      // GUARD: Don't initialize if container hasn't been laid out yet
      if (rect.width < 10 || rect.height < 10) {
        isReadyRef.current = false;
        return false;
      }

      const displayWidth = Math.floor(rect.width);
      const displayHeight = Math.floor(rect.height);
      const dpr = Math.min(MAX_CANVAS_DPR, Math.max(1, window.devicePixelRatio || 1));
      const backingWidth = Math.max(1, Math.round(displayWidth * dpr));
      const backingHeight = Math.max(1, Math.round(displayHeight * dpr));

      // Only resize if dimensions actually changed
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

    syncCanvasSize();

    const resizeObserver = new ResizeObserver(() => {
      syncCanvasSize();
    });
    
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      // Reset ready state so that if the canvas remounts (key change), the render
      // loop is blocked until the new syncCanvasSize runs successfully.
      isReadyRef.current = false;
    };
  }, [canvasRef, containerRef, interactionScopeKey]);

  // ============================================================================
  // 2. RENDER LOOP (Orchestrated by MasterRenderLoop)
  // ============================================================================
  const render = useCallback((_time: number, _meta: RenderFrameMeta) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || !isReadyRef.current) return;

    const canvasRect = canvas.getBoundingClientRect();
    const logicalWidth = Math.max(1, canvasRect.width);
    const logicalHeight = Math.max(1, canvasRect.height);
    const dpr = canvas.width / logicalWidth || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const particles = particlesRef.current;
    let hasActiveParticles = false;
    for (let i = 0; i < particles.length; i++) {
      if (particles[i].active) {
        hasActiveParticles = true;
        break;
      }
    }

    if (!isDirtyRef.current && !hasActiveParticles) {
      return;
    }

    isDirtyRef.current = false;
    const currentMode = modeRef.current;
    const currentChartData = chartDataRef.current;

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
      chart: echarts.ECharts,
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

        ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.9)';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, compactWidth, compactHeight, 3);
        ctx.fill();
        ctx.stroke();

        const labelColor = '#94a3b8';
        const valColor = '#f8fafc';
        const statColor = '#fb923c';
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
        tooltip.style.background = 'rgb(8, 13, 32)';
        tooltip.style.borderColor = 'rgba(96, 165, 250, 0.45)';
        tooltip.style.boxShadow = '0 16px 34px rgba(0, 0, 0, 0.46)';
        tooltip.style.lineHeight = '1';

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
      const scale = getOverlayScale(w, h);
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

    ctx.clearRect(0, 0, logicalWidth, logicalHeight);

    // ============================================================================
    // [TENOR 2026] MOTEUR PHYSIQUE DES PARTICULES (Indépendant de la souris)
    // ============================================================================
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (!p.active) continue;

      // Intégration d'Euler (Physique)
      p.vy += GRAVITY;
      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.vAngle;
      p.life--;

      if (p.life <= 0) {
        p.active = false;
        continue;
      }

      // Rendu de la particule
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      // Opacité dégressive pour une disparition en douceur
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.font = `${p.size}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.emoji, 0, 0);
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
        const pulseSize = 15 + Math.sin(Date.now() / 200) * 3;
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
        // Décalage pour que l'étoile de la baguette soit sur la pointe du curseur natif
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
