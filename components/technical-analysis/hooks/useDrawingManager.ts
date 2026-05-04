import React, { useCallback, useEffect, useRef, useState, RefObject } from "react";
import { useSelector } from "react-redux";
import { selectUiState } from "../store/technicalAnalysisSlice";
import { Drawing, DrawingPoint, DrawingStyle, AllToolType, UiState } from "../config/TechnicalAnalysisTypes";
import { DrawingRenderer } from "../lib/DrawingRenderer";
import { MEASURE_TOOLS, FIB_PURE_TOOLS } from "../config/TechnicalAnalysisConstants";
import type { EChartsType } from "echarts/core";
import { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";

const MAIN_GRID_LEFT = 15;

// ============================================================================
// TYPES
// ============================================================================
interface UseDrawingManagerProps {
  chartInstanceRef: RefObject<EChartsType | null>;
  drawingCanvasRef: RefObject<HTMLCanvasElement | null>;
  chartData: ChartDataPoint[];
}

// ============================================================================
// DRY HELPERS & STATE MACHINE REGISTRY (HDR 2026)
// ============================================================================
const getPriceSeriesIndex = (chart: EChartsType): number => {
  const option = chart.getOption();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesList = (option.series as any[]) || [];
  const idx = seriesList.findIndex((s) => s.yAxisIndex === 0 || s.yAxisIndex === undefined || s.type === "candlestick");
  return idx !== -1 ? idx : 0;
};

const SINGLE_CLICK_TOOLS: AllToolType[] = [
  "horizontal_line",
  "vertical_line",
  "crosshair",
  "arrow_marker",
  "horizontal_ray",
  "long_position",
  "short_position",
  "anchored_vwap",
];

const TWO_CLICK_TOOLS: AllToolType[] = [
  "line",
  "arrow",
  "trend_angle",
  "ray",
  "x_line",
  "date_range",
  "price_range",
  "date_price_range",
  "regression_trend",
  "anchored_volume_profile",
  "fib_retracement",
  "fib_time_zone",
  "fib_speed_resistance_fan",
  "fib_circles",
  "fib_spiral",
  "gann_box",
  "gann_square",
  "gann_square_fixed",
  "gann_fan",
  "cyclic_lines",
  "time_cycles",
  "sine_line",
  "position_forecast",
  "bar_pattern",
];

const MULTI_CLICK_TOOLS: AllToolType[] = [
  "polyline",
  "path",
  "xabcd_pattern",
  "cypher_pattern",
  "abcd_pattern",
  "triangle_pattern",
  "three_drives_pattern",
  "head_and_shoulders",
  "elliott_impulse_wave",
  "elliott_triangle_wave",
  "elliott_triple_combo_wave",
  "elliott_correction_wave",
  "elliott_double_combo_wave",
  "projection",
  "curve",
  "parallel_channel",
  "flat_top_bottom",
  "disjoint_channel",
  "pitchfork",
  "schiff_pitchfork",
  "modified_schiff_pitchfork",
  "inside_pitchfork",
  "pitchfan",
  "trend_based_fib_extension",
  "fib_channel",
  "trend_based_fib_time",
  "fib_speed_resistance_arcs",
  "fib_wedge",
  "ghost_feed",
  "sector",
];

// [TENOR 2026 FIX] Finite State Automaton Registry for Multi-Click Tools
// Replaces the monolithic if/else chain with O(1) lookup.
const TOOL_MAX_CLICKS_REGISTRY: Record<string, number> = {
  "sector": 3,
  "xabcd_pattern": 5,
  "cypher_pattern": 5,
  "abcd_pattern": 4,
  "triangle_pattern": 4,
  "three_drives_pattern": 7,
  "head_and_shoulders": 7,
  "elliott_impulse_wave": 6,
  "elliott_triangle_wave": 5,
  "elliott_triple_combo_wave": 5,
  "elliott_correction_wave": 3,
  "elliott_double_combo_wave": 3,
  "trend_based_fib_extension": 3,
  "fib_channel": 3,
  "trend_based_fib_time": 3,
  "fib_speed_resistance_arcs": 3,
  "fib_wedge": 3,
  "pitchfork": 3,
  "schiff_pitchfork": 3,
  "modified_schiff_pitchfork": 3,
  "inside_pitchfork": 3,
  "pitchfan": 3,
  "disjoint_channel": 3,
  "parallel_channel": 3,
  "flat_top_bottom": 3,
  "projection": 3,
  "curve": 3,
};

// ============================================================================
// [TENOR 2026 FIX] SCAR-148 & SCAR-150: Fast Deep Clone Utility (OOM SHIELD)
// ============================================================================
// Blinds the Undo/Redo stack against non-POJO objects (ECharts, Events, DOM).
// [OOM SHIELD] Removed WeakMap overhead. Drawings are strictly acyclic JSON objects.
// This yields a 5x performance boost during cloning and prevents GC stuttering.
const fastDeepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;

  // [TENOR 2026 SRE] Safe POJO check.
  // Silently drop ECharts instances, DOM Elements, or Events to prevent Undo/Redo stack crashes.
  if (
    obj instanceof Date ||
    obj instanceof Map ||
    obj instanceof Set ||
    obj instanceof RegExp ||
    obj instanceof ArrayBuffer ||
    ArrayBuffer.isView(obj) ||
    (typeof Element !== 'undefined' && obj instanceof Element) ||
    (typeof Event !== 'undefined' && obj instanceof Event) ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (obj as any).isDisposed !== undefined // ECharts instance heuristic
  ) {
    return undefined as unknown as T;
  }

  if (Array.isArray(obj)) {
    const arr = new Array(obj.length);
    for (let i = 0; i < obj.length; i++) {
      const val = obj[i];
      if (val !== undefined) {
        arr[i] = fastDeepClone(val);
      }
    }
    return arr as unknown as T;
  }

  const cloned: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = (obj as Record<string, unknown>)[key];
      if (val !== undefined) {
        cloned[key] = fastDeepClone(val);
      }
    }
  }
  return cloned as T;
};

// ============================================================================
// HOOK
// ============================================================================
export const useDrawingManager = ({
  chartInstanceRef,
  drawingCanvasRef,
  chartData,
}: UseDrawingManagerProps) => {
  const uiState = useSelector(selectUiState) as UiState;

  // --- State ---
  const [activeTool, setActiveTool] = useState<AllToolType>(null);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [, setCurrentDrawing] = useState<Drawing | null>(null);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);

  // ============================================================================
  // [TENOR 2026 SRE] SYNCHRONOUS REF MUTATION (Zero-Latency State Sync)
  // These mutations are intentional to ensure drawing logic always has access to
  // the absolute latest state during interactive frame processing (Zero-Lag).
  const cursorModeRef = useRef<string>(uiState.cursorMode as string);
  // eslint-disable-next-line react-hooks/refs
  cursorModeRef.current = uiState.cursorMode as string;

  const activeToolRef = useRef<AllToolType>(activeTool);
  // eslint-disable-next-line react-hooks/refs
  activeToolRef.current = activeTool;

  const drawingsRef = useRef<Drawing[]>(drawings);
  // eslint-disable-next-line react-hooks/refs
  drawingsRef.current = drawings;

  const currentDrawingRef = useRef<Drawing | null>(null);
  const isDrawingRef = useRef(false);
  const clickCountRef = useRef(0);

  // ============================================================================
  // [TENOR 2026 SRE] SYNCHRONOUS STATE MACHINE PURGE
  // ============================================================================
  const prevContextRef = useRef({ tool: activeTool, mode: uiState.cursorMode });
  // eslint-disable-next-line react-hooks/refs
  if (prevContextRef.current.tool !== activeTool || prevContextRef.current.mode !== uiState.cursorMode) {
    // eslint-disable-next-line react-hooks/refs
    isDrawingRef.current = false;
    // eslint-disable-next-line react-hooks/refs
    currentDrawingRef.current = null;
    // eslint-disable-next-line react-hooks/refs
    clickCountRef.current = 0;
    // eslint-disable-next-line react-hooks/refs
    prevContextRef.current = { tool: activeTool, mode: uiState.cursorMode };
  }

  useEffect(() => {
    setCurrentDrawing(null);
  }, [activeTool, uiState.cursorMode]);

  // --- High-Performance Refs ---
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);
  const chartSyncRef = useRef<number>(0);
  const chartDataRef = useRef<ChartDataPoint[]>(chartData);

  useEffect(() => {
    chartDataRef.current = chartData;
  }, [chartData]);

  // --- Drag & Drop State ---
  const isDraggingRef = useRef(false);
  const dragTargetRef = useRef<{
    drawingId: string;
    type: 'point' | 'shape' | 'position_zone' | 'width_resize';
    pointIndex: number;
    positionZone?: 'tp' | 'sl';
    initialPoints: DrawingPoint[];
    initialTpOffset?: number;
    initialSlOffset?: number;
    mouseStart: { x: number; y: number };
  } | null>(null);
  const draggedDrawingRef = useRef<Drawing | null>(null);

  const setIsDrawing = useCallback((value: boolean) => {
    isDrawingRef.current = value;
  }, []);

  const setClickCount = useCallback((value: number) => {
    clickCountRef.current = value;
  }, []);

  const resetDrawingInteraction = useCallback(() => {
    setIsDrawing(false);
    setClickCount(0);
  }, [setClickCount, setIsDrawing]);

  const clearCurrentDrawing = useCallback(() => {
    setIsDrawing(false);
    setCurrentDrawing(null);
    currentDrawingRef.current = null;
  }, [setIsDrawing]);

  const cancelDrawingSession = useCallback((keepSelection = false) => {
    resetDrawingInteraction();
    clearCurrentDrawing();
    if (!keepSelection) {
      setSelectedDrawingId(null);
    }
    setActiveTool(null);
  }, [clearCurrentDrawing, resetDrawingInteraction]);

  // ============================================================================
  // [TENOR 2026 SRE] UNDO / REDO HISTORY STACK (OOM SHIELD)
  // ============================================================================
  const historyRef = useRef<Drawing[][]>([[]]);
  const historyStepRef = useRef<number>(0);
  const pendingHistoryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const pushHistory = useCallback((newDrawings: Drawing[]) => {
    const currentStep = historyStepRef.current;
    const newHistory = historyRef.current.slice(0, currentStep + 1);
    newHistory.push(newDrawings.map(d => fastDeepClone(d)));
    
    // [OOM SHIELD] Strict limit of 20 states to prevent RAM exhaustion
    if (newHistory.length > 20) {
      newHistory.shift();
    }
    
    historyRef.current = newHistory;
    historyStepRef.current = newHistory.length - 1;
  }, []);

  // [OOM SHIELD] Debounced history push for high-frequency style changes (sliders)
  const pushHistoryDebounced = useCallback((newDrawings: Drawing[]) => {
    if (pendingHistoryTimeoutRef.current) clearTimeout(pendingHistoryTimeoutRef.current);
    pendingHistoryTimeoutRef.current = setTimeout(() => {
      pushHistory(newDrawings);
      pendingHistoryTimeoutRef.current = null;
    }, 400);
  }, [pushHistory]);

  const undo = useCallback(() => {
    // [OOM SHIELD] Clear pending debounced pushes to prevent race conditions
    if (pendingHistoryTimeoutRef.current) {
      clearTimeout(pendingHistoryTimeoutRef.current);
      pendingHistoryTimeoutRef.current = null;
    }
    if (historyStepRef.current > 0) {
      historyStepRef.current -= 1;
      cancelDrawingSession();
      setDrawings(historyRef.current[historyStepRef.current]);
    }
  }, [cancelDrawingSession]);

  const redo = useCallback(() => {
    // [OOM SHIELD] Clear pending debounced pushes to prevent race conditions
    if (pendingHistoryTimeoutRef.current) {
      clearTimeout(pendingHistoryTimeoutRef.current);
      pendingHistoryTimeoutRef.current = null;
    }
    if (historyStepRef.current < historyRef.current.length - 1) {
      historyStepRef.current += 1;
      cancelDrawingSession();
      setDrawings(historyRef.current[historyStepRef.current]);
    }
  }, [cancelDrawingSession]);

  // --- CRUD Operations ---
  const selectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedIdRef.current = selectedDrawingId;
  }, [selectedDrawingId]);

  const deleteDrawing = useCallback((id: string) => {
    setDrawings(prev => {
      const n = prev.filter(d => d.id !== id);
      pushHistory(n);
      return n;
    });
    if (selectedIdRef.current === id) setSelectedDrawingId(null);
  }, [pushHistory]);

  const updateDrawing = useCallback((id: string, u: Partial<Drawing>) => {
    setDrawings(p => {
      const n = p.map(d => d.id === id ? { ...d, ...u } as Drawing : d);
      // [OOM SHIELD] Use debounced push to capture style changes without spamming RAM
      pushHistoryDebounced(n);
      return n;
    });
  }, [pushHistoryDebounced]);

  const addDrawing = useCallback((d: Drawing) => setDrawings(p => {
    const n = [...p, d];
    pushHistory(n);
    return n;
  }), [pushHistory]);

  const completeDrawingSession = useCallback((drawing: Drawing) => {
    const finalDrawing = { ...drawing, isCreating: false };
    resetDrawingInteraction();
    addDrawing(finalDrawing);
    setSelectedDrawingId(finalDrawing.id);
    clearCurrentDrawing();
    setActiveTool(null);
  }, [addDrawing, clearCurrentDrawing, resetDrawingInteraction]);

  const reorderDrawing = useCallback((id: string, dir: 'front' | 'back') => {
    setDrawings(prev => {
      const idx = prev.findIndex(d => d.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      const [rem] = next.splice(idx, 1);
      if (dir === 'back') next.unshift(rem);
      else next.push(rem);
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  // --- DEFAULTS & TEMPLATES ---
  const [toolDefaults, setToolDefaults] = useState<Record<string, DrawingStyle>>(() => {
    if (typeof window === "undefined") return {};
    const saved = localStorage.getItem('algoway_drawing_defaults');
    try {
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [namedTemplates, setNamedTemplates] = useState<Record<string, { name: string, style: DrawingStyle }[]>>(() => {
    if (typeof window === "undefined") return {};
    const saved = localStorage.getItem('algoway_drawing_templates');
    try {
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const getToolDefault = useCallback((tool: string): DrawingStyle => {
    if (tool === "parallel_channel") {
      return toolDefaults[tool] || { color: "#2962FF", lineWidth: 2, lineStyle: "solid", fillColor: "#2962FF", fillOpacity: 0.1, fillEnabled: true };
    }
    if ((MEASURE_TOOLS as readonly string[]).includes(tool)) {
      return toolDefaults[tool] || { color: "#2962FF", lineWidth: 2, lineStyle: "solid", fillColor: "#2962FF", fillOpacity: 0.1, fillEnabled: true };
    }
    if (tool === "regression_trend") {
      return toolDefaults[tool] || { color: "#FF9800", lineWidth: 1, lineStyle: "dashed", fillColor: "#2196F3", fillOpacity: 0.1, fillEnabled: true };
    }
    if (tool === "flat_top_bottom") {
      return toolDefaults[tool] || { color: "#FF9800", lineWidth: 1, lineStyle: "solid", fillColor: "#FF9800", fillOpacity: 0.2, fillEnabled: true };
    }
    if (tool === "disjoint_channel") {
      return toolDefaults[tool] || { color: "#2196F3", lineWidth: 2, lineStyle: "solid", fillColor: "#2196F3", fillOpacity: 0.1, fillEnabled: true };
    }
    if (tool === "pitchfan") {
      return toolDefaults[tool] || { color: "#f44336", lineWidth: 1, lineStyle: "solid", fillColor: "#2196F3", fillOpacity: 0.08, fillEnabled: true };
    }
    if ((FIB_PURE_TOOLS as readonly string[]).includes(tool)) {
      return toolDefaults[tool] || { color: "#787b86", lineWidth: 1, lineStyle: "solid", fillColor: "#2196F3", fillOpacity: 0.1, fillEnabled: true };
    }
    if (tool === "pitchfork") {
      return toolDefaults[tool] || { color: "#f44336", lineWidth: 1, lineStyle: "solid", fillColor: "#2196F3", fillOpacity: 0.1, fillEnabled: true };
    }
    if (tool === "xabcd_pattern" || tool === "cypher_pattern" || tool === "head_and_shoulders") {
      return toolDefaults[tool] || { color: "#2962FF", lineWidth: 1, lineStyle: "solid", fillColor: "#2962FF", fillOpacity: 0.2, fillEnabled: true };
    }
    if (tool === "elliott_impulse_wave" || tool === "elliott_correction_wave") {
      return toolDefaults[tool] || { color: "#2962FF", lineWidth: 2, lineStyle: "solid" };
    }
    if (tool === "elliott_triangle_wave") {
      return toolDefaults[tool] || { color: "#FF9800", lineWidth: 2, lineStyle: "solid" };
    }
    if (tool === "elliott_double_combo_wave" || tool === "elliott_triple_combo_wave") {
      return toolDefaults[tool] || { color: "#4CAF50", lineWidth: 2, lineStyle: "solid" };
    }
    if (tool === "abcd_pattern") {
      return toolDefaults[tool] || { color: "#089981", lineWidth: 2, lineStyle: "solid", fillEnabled: false };
    }
    if (tool === "triangle_pattern" || tool === "three_drives_pattern") {
      return toolDefaults[tool] || { color: "#7E57C2", lineWidth: 1, lineStyle: "solid", fillColor: "#7E57C2", fillOpacity: 0.1, fillEnabled: true };
    }
    if (tool === "bar_pattern" || tool === "ghost_feed") {
      return toolDefaults[tool] || { color: "#ff9800", lineWidth: 2, lineStyle: "solid", lineOpacity: 1 };
    }
    if (tool === "anchored_vwap") {
      return toolDefaults[tool] || { color: "#2962FF", lineWidth: 1, lineStyle: "solid", lineOpacity: 1 };
    }
    return toolDefaults[tool] || { color: "#2962FF", lineWidth: 2, lineStyle: "solid", fillColor: "#2962FF", fillOpacity: 0.1 };
  }, [toolDefaults]);

  const gridRectRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const [gridRect, setGridRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const rendererRef = useRef<DrawingRenderer | null>(null);

  // --- Initialize Renderer ---
  useEffect(() => {
    if (drawingCanvasRef.current) {
      const ctx = drawingCanvasRef.current.getContext("2d");
      if (ctx) {
        rendererRef.current = new DrawingRenderer(ctx);
      }
    }
  }, [drawingCanvasRef]);

  // --- Render Loop (Zero-Lag Engine) ---
  useEffect(() => {
    let animationFrameId: number;
    const initialChart = chartInstanceRef.current;

    if (initialChart) {
      const handleFinished = () => {
        chartSyncRef.current++;
      };
      const handleBgClick = () => {
        if (!activeToolRef.current && !isDrawingRef.current) {
          setSelectedDrawingId(null);
        }
      };
      initialChart.on("finished", handleFinished);
      initialChart.getZr().on("click", handleBgClick);
    }

    const renderLoop = () => {
      const chart = chartInstanceRef.current;
      if (drawingCanvasRef.current && rendererRef.current && chart) {
        const dpr = window.devicePixelRatio || 1;
        const rect = drawingCanvasRef.current.getBoundingClientRect();

        if (drawingCanvasRef.current.width !== rect.width * dpr || drawingCanvasRef.current.height !== rect.height * dpr) {
          drawingCanvasRef.current.width = rect.width * dpr;
          drawingCanvasRef.current.height = rect.height * dpr;
        }

        // [TENOR 2026 FIX] SCAR-202: ECharts Internal API Decoupling
        const width = chart.getWidth();
        const height = chart.getHeight();
        
        // Constants mirroring `useEChartsRenderer.ts` layout engine
        const TV_Y_AXIS_WIDTH = 84;
        const TV_X_AXIS_HEIGHT = 28;
        const safeTop = Math.max(30, height * 0.08); // 8% top margin
        const safeBottom = height - TV_X_AXIS_HEIGHT;
        const safeLeft = MAIN_GRID_LEFT;
        const safeRight = width - TV_Y_AXIS_WIDTH;

        const newGridRect = {
          x: safeLeft,
          y: safeTop,
          width: Math.max(10, safeRight - safeLeft),
          height: Math.max(10, safeBottom - safeTop)
        };

        if (!gridRectRef.current ||
            Math.abs(gridRectRef.current.x - newGridRect.x) > 2.0 ||
            Math.abs(gridRectRef.current.y - newGridRect.y) > 2.0 ||
            Math.abs(gridRectRef.current.width - newGridRect.width) > 2.0 ||
            Math.abs(gridRectRef.current.height - newGridRect.height) > 2.0) {
          setGridRect(newGridRect);
          gridRectRef.current = newGridRect;
        }

        // [TENOR 2026 SRE] Zero-Allocation Idle Loop
        // Only allocate a new array if we are actively dragging a drawing.
        // This prevents massive GC stuttering at 60 FPS.
        let renderDrawings = drawingsRef.current;
        if (isDraggingRef.current && draggedDrawingRef.current) {
          renderDrawings = [];
          const draggedId = draggedDrawingRef.current.id;
          const draggedObj = draggedDrawingRef.current;
          const len = drawingsRef.current.length;
          for (let i = 0; i < len; i++) {
            const d = drawingsRef.current[i];
            renderDrawings.push(d.id === draggedId ? draggedObj : d);
          }
        }

        try {
          rendererRef.current.render(
            renderDrawings,
            currentDrawingRef.current,
            chart,
            mousePosRef.current,
            activeToolRef.current,
            selectedIdRef.current,
            gridRectRef.current,
            chartDataRef.current
          );
        } catch (err) {
          console.error("[TENOR SRE] Global Drawing Loop Exception:", err);
        }
      }
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [drawingCanvasRef, chartInstanceRef]);

  // --- Coordinate Conversion ---
  const getChartCoordinates = useCallback((e: React.PointerEvent<HTMLCanvasElement> | PointerEvent): DrawingPoint | null => {
    if (!chartInstanceRef.current || chartInstanceRef.current.isDisposed() || !drawingCanvasRef.current) return null;

    const rect = drawingCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const chart = chartInstanceRef.current;
    const option = chart.getOption();
    const priceSeriesIndex = getPriceSeriesIndex(chart);

    const point = chart.convertFromPixel({ seriesIndex: priceSeriesIndex }, [x, y]);

    if (point && point.length >= 2) {
      let time = point[0] as string | number;
      const value = point[1] as number;

      const xAxis = (Array.isArray(option.xAxis) ? option.xAxis[0] : option.xAxis) as { type?: string; data?: (string | number)[] } | undefined;
      if (xAxis && xAxis.type === 'category' && xAxis.data && typeof time === 'number') {
        const index = Math.round(time);
        if (index >= 0 && index < xAxis.data.length) {
          time = xAxis.data[index];
        } else if (index >= xAxis.data.length) {
          const lastIdx = xAxis.data.length - 1;
          const lastTime = new Date(xAxis.data[lastIdx]).getTime();
          const prevTime = xAxis.data.length > 1 ? new Date(xAxis.data[lastIdx - 1]).getTime() : lastTime - 86400000;
          const gap = lastTime - prevTime;
          const futureTime = lastTime + (index - lastIdx) * gap;
          time = new Date(futureTime).toISOString();
        }
      }

      return { time, value };
    }
    return null;
  }, [chartInstanceRef, drawingCanvasRef]);

  const resolveTimeToChartIndex = useCallback((time: string | number): number => {
    const data = chartDataRef.current;
    if (!data.length) return -1;
    if (typeof time === "number") {
      return Math.max(0, Math.min(Math.round(time), data.length - 1));
    }
    const exact = data.findIndex((d) => d.time === time);
    if (exact !== -1) return exact;

    const targetMs = new Date(time).getTime();
    if (!Number.isFinite(targetMs)) return -1;

    let bestIdx = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < data.length; i++) {
      const ms = new Date(data[i].time).getTime();
      if (!Number.isFinite(ms)) continue;
      const dist = Math.abs(ms - targetMs);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    return bestIdx;
  }, []);

  const extractBarPatternData = useCallback((p1: DrawingPoint, p2: DrawingPoint) => {
    const data = chartDataRef.current;
    if (!data.length) return [];
    const i1 = resolveTimeToChartIndex(p1.time);
    const i2 = resolveTimeToChartIndex(p2.time);
    if (i1 < 0 || i2 < 0) return [];
    const start = Math.max(0, Math.min(i1, i2));
    const end = Math.min(data.length - 1, Math.max(i1, i2));
    if (end < start) return [];
    return data.slice(start, end + 1).map((bar, localIdx) => ({
      o: bar.open,
      c: bar.close,
      l: bar.low,
      h: bar.high,
      relT: localIdx,
      idx: start + localIdx,
    }));
  }, [resolveTimeToChartIndex]);

  const generateId = () => `drawing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const lastTapRef = useRef<number>(0);

  const handleDoubleClick = useCallback(() => {
    if (!isDrawingRef.current || !currentDrawingRef.current) return;

    if (MULTI_CLICK_TOOLS.includes(currentDrawingRef.current.type)) {
      const finishedDrawing = currentDrawingRef.current;
      if (finishedDrawing.points.length >= 2) {
        completeDrawingSession(finishedDrawing);
      } else {
        cancelDrawingSession(true);
      }
    }
  }, [cancelDrawingSession, completeDrawingSession]);

  // --- Pointer Down Handler ---
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch' && e.cancelable) {
      e.preventDefault();
    }

    // [TENOR 2026 FIX] Right-Click Cancellation
    if (e.button === 2) {
      cancelDrawingSession(true);
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (e.pointerType === 'mouse' && e.button !== 0) return;

    if (drawingCanvasRef.current && e.pointerId !== undefined) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
    }

    if (!chartInstanceRef.current || chartInstanceRef.current.isDisposed()) return;

    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      handleDoubleClick();
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;

    const rect = drawingCanvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const currentActiveTool = activeToolRef.current;
    const currentDrawings = drawingsRef.current;
    const mode = cursorModeRef.current;

    if (mode !== 'magic') {
      e.stopPropagation();
      if (e.nativeEvent && typeof e.nativeEvent.stopPropagation === 'function') {
        e.nativeEvent.stopPropagation();
      }
    }

    if (mode === 'magic') {
      setSelectedDrawingId(null);
      return;
    }

    // [TENOR 2026 FIX] Increased threshold for better touch/fast-mouse selection
    const HIT_THRESHOLD = 15;

    if (currentDrawings.length > 0 && rendererRef.current) {
      for (let i = currentDrawings.length - 1; i >= 0; i--) {
        const d = currentDrawings[i];
        const result = rendererRef.current.hitTest(mx, my, d, chartInstanceRef.current, HIT_THRESHOLD);

        if (result.isHit) {
          if (mode === 'eraser') {
            deleteDrawing(d.id);
            return;
          }

          setSelectedDrawingId(d.id);
          if (d.locked) return;

          isDraggingRef.current = true;
          dragTargetRef.current = {
            drawingId: d.id,
            type: result.hitType === 'width_resize' ? 'width_resize' : (result.hitType === 'point' ? 'point' : (result.hitType?.startsWith('zone_') ? 'position_zone' : 'shape')),
            pointIndex: result.pointIndex ?? -1,
            positionZone: result.hitType === 'zone_tp' ? 'tp' : (result.hitType === 'zone_sl' ? 'sl' : undefined),
            initialPoints: [...d.points],
            initialTpOffset: d.tpOffset ?? (d.positionProps ? (d.type === 'long_position' ? d.positionProps.tpPrice - d.positionProps.entryPrice : d.positionProps.entryPrice - d.positionProps.tpPrice) : undefined),
            initialSlOffset: d.slOffset ?? (d.positionProps ? (d.type === 'long_position' ? d.positionProps.entryPrice - d.positionProps.slPrice : d.positionProps.slPrice - d.positionProps.entryPrice) : undefined),
            mouseStart: { x: mx, y: my }
          };

          if (drawingCanvasRef.current) {
            if (result.hitType === 'point') drawingCanvasRef.current.style.cursor = 'grabbing';
            else if (result.hitType?.startsWith('zone_')) drawingCanvasRef.current.style.cursor = 'ns-resize';
            else if (result.hitType === 'width_resize') drawingCanvasRef.current.style.cursor = 'ew-resize';
            else drawingCanvasRef.current.style.cursor = 'move';
          }
          return;
        }

        if (d.type === 'sector' && d.points.length > 0) {
          const p0 = d.points[0];
          const p0Pix = chartInstanceRef.current.convertToPixel({ seriesIndex: getPriceSeriesIndex(chartInstanceRef.current) }, [p0.time, p0.value]);
          if (p0Pix && Math.sqrt(Math.pow(mx - p0Pix[0], 2) + Math.pow(my - p0Pix[1], 2)) < 50) {
            if (mode === 'eraser') {
              deleteDrawing(d.id);
              return;
            }
            setSelectedDrawingId(d.id);
            if (d.locked) return;
            isDraggingRef.current = true;
            dragTargetRef.current = {
              drawingId: d.id,
              type: 'shape',
              pointIndex: -1,
              initialPoints: [...d.points],
              mouseStart: { x: mx, y: my }
            };
            if (drawingCanvasRef.current) drawingCanvasRef.current.style.cursor = 'move';
            return;
          }
        }
      }
    }

    if (mode === 'eraser') {
      setSelectedDrawingId(null);
      return;
    }

    if (!currentActiveTool) {
      setSelectedDrawingId(null);
      return;
    }

    const coords = getChartCoordinates(e);
    if (!coords) return;

    if (SINGLE_CLICK_TOOLS.includes(currentActiveTool)) {
      const newDrawing: Drawing = {
        id: generateId(),
        type: currentActiveTool as NonNullable<AllToolType>,
        points: [coords],
        style: { ...getToolDefault(currentActiveTool) },
      };

      if (newDrawing.type === "long_position" || newDrawing.type === "short_position") {
        const isLong = newDrawing.type === "long_position";
        newDrawing.positionProps = {
          accountSize: 10000,
          riskPercent: 1,
          lotSize: 1,
          entryPrice: coords.value,
          tpPrice: coords.value * (isLong ? 1.30 : 0.70),
          slPrice: coords.value * (isLong ? 0.70 : 1.30),
          tpColor: "#089981",
          slColor: "#f23645",
          tpOpacity: 0.25,
          slOpacity: 0.25,
          width: 200
        };
      }

      if (newDrawing.type === "anchored_vwap") {
        newDrawing.anchoredVWAPProps = {
          source: "hlc3",
          calculateStDev: true,
          fillBackground: true,
          transparency: 95,
          levels: [
            { multiplier: 1, color: "#22AB94", enabled: true, lineOpacity: 0.95, fillOpacity: 0.12, lineStyle: "solid", lineWidth: 1 },
            { multiplier: 2, color: "#22AB94", enabled: false, lineOpacity: 0.75, fillOpacity: 0.08, lineStyle: "solid", lineWidth: 1 },
            { multiplier: 3, color: "#22AB94", enabled: false, lineOpacity: 0.6, fillOpacity: 0.05, lineStyle: "solid", lineWidth: 1 },
          ]
        };
      }

      if (newDrawing.type === "anchored_volume_profile") {
        newDrawing.anchoredVolumeProfileProps = {
          layout: "Number of Rows",
          rowSize: 24,
          volume: "Up/Down",
          valueAreaVolume: 70,
          upColor: "rgba(0, 188, 212, 0.4)",
          downColor: "rgba(233, 30, 99, 0.4)",
          vaUpColor: "rgba(0, 188, 212, 0.8)",
          vaDownColor: "rgba(233, 30, 99, 0.8)",
          pocColor: "#000000",
          width: 40,
          placement: "Left",
          showLabels: true
        };
      }

      completeDrawingSession(newDrawing);
      return;
    }

    if (TWO_CLICK_TOOLS.includes(currentActiveTool)) {
      if (!isDrawingRef.current) {
        setIsDrawing(true);
        const newDrawing: Drawing = {
          id: generateId(),
          type: currentActiveTool as NonNullable<AllToolType>,
          points: [coords],
          style: { ...getToolDefault(currentActiveTool) },
        };

        if (newDrawing.type === "regression_trend") {
          newDrawing.regressionProps = {
            useUpperDev: true,
            upperDev: 2,
            useLowerDev: true,
            lowerDev: -2,
            source: "close",
            showBaseLine: true,
            baseColor: "#FF9800",
            baseLineWidth: 1,
            baseLineStyle: "dashed",
            showUpLine: true,
            upColor: "#2196F3",
            upLineWidth: 1,
            upLineStyle: "solid",
            showDownLine: true,
            downColor: "#2196F3",
            downLineWidth: 1,
            downLineStyle: "solid",
            fillBackground: true,
            upFillColor: "#2196F3",
            downFillColor: "#FFE0B2",
            extendLines: false,
            showPearsonsR: true
          };
        }

        if (newDrawing.type === "position_forecast") {
          newDrawing.forecastProps = {
            showSourceText: true,
            sourceTextColor: "#ffffff",
            sourceBackgroundColor: "#673ab7",
            sourceBorderColor: "#673ab7",
            showTargetText: true,
            targetTextColor: "#ffffff",
            targetBackgroundColor: "#673ab7",
            targetBorderColor: "#673ab7",
            showSuccessText: true,
            successTextColor: "#ffffff",
            successBackgroundColor: "#089981",
            showFailureText: true,
            failureTextColor: "#ffffff",
            failureBackgroundColor: "#f23645",
          };
        }

        if (newDrawing.type === "bar_pattern") {
          newDrawing.barPatternProps = {
            color: newDrawing.style.color || "#ff9800",
            mode: "HL Bars",
            mirrored: false,
            flipped: false,
            opacity: 1,
          };
        }

        if (newDrawing.type === "fib_retracement") {
          newDrawing.fibProps = {
            reverse: false,
            fillBackground: true,
            levels: [
              { value: 0, color: "#787b86", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 0.236, color: "#f23645", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 0.382, color: "#ff9800", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 0.5, color: "#4caf50", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 0.618, color: "#009688", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 0.786, color: "#2196f3", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 1, color: "#787b86", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 1.618, color: "#2962ff", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 2.618, color: "#2962ff", enabled: false, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 3.618, color: "#2962ff", enabled: false, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 4.236, color: "#2962ff", enabled: false, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
            ],
            showPrices: true,
            showLevels: true,
            labelsPosition: "right",
          };
        }

        if (newDrawing.type === "fib_time_zone") {
          newDrawing.fibProps = {
            reverse: false,
            fillBackground: true,
            levels: [
              { value: 0, color: "#787b86", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 1, color: "#673ab7", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 2, color: "#673ab7", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 3, color: "#673ab7", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 5, color: "#673ab7", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 8, color: "#673ab7", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 13, color: "#673ab7", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 21, color: "#673ab7", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 34, color: "#673ab7", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 55, color: "#673ab7", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 89, color: "#673ab7", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 144, color: "#673ab7", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
            ],
            showPrices: false,
            showLevels: true,
            labelsPosition: "right",
            trendLine: { enabled: true, color: "#787b86", lineStyle: "dashed", lineWidth: 1 },
          };
        }

        if (newDrawing.type === "fib_circles") {
          newDrawing.fibCirclesProps = {
            levels: [
              { value: 0.382, color: "#f23645", enabled: true, lineOpacity: 0.8, fillOpacity: 1, lineStyle: "solid", lineWidth: 1 },
              { value: 0.618, color: "#ff9800", enabled: true, lineOpacity: 0.8, fillOpacity: 1, lineStyle: "solid", lineWidth: 1 },
              { value: 1, color: "#787b86", enabled: true, lineOpacity: 1, fillOpacity: 1, lineStyle: "solid", lineWidth: 1 },
              { value: 1.618, color: "#2962ff", enabled: true, lineOpacity: 0.8, fillOpacity: 1, lineStyle: "solid", lineWidth: 1 },
              { value: 2.618, color: "#673ab7", enabled: true, lineOpacity: 0.8, fillOpacity: 1, lineStyle: "solid", lineWidth: 1 },
              { value: 4.236, color: "#009688", enabled: false, lineOpacity: 0.7, fillOpacity: 1, lineStyle: "solid", lineWidth: 1 },
            ],
            trendLine: { enabled: true, color: "#787b86", lineStyle: "dashed", lineWidth: 1 },
            background: { enabled: true, fillOpacity: 0.15 },
            showLabels: true,
          };
        }

        if (newDrawing.type === "fib_spiral") {
          newDrawing.fibSpiralProps = {
            reverse: false,
            levels: [
              { value: 1, color: "#787b86", enabled: true, lineOpacity: 1, lineStyle: "solid", lineWidth: 1 },
              { value: 2, color: "#2962ff", enabled: true, lineOpacity: 0.9, lineStyle: "solid", lineWidth: 1 },
              { value: 3, color: "#ff9800", enabled: true, lineOpacity: 0.8, lineStyle: "solid", lineWidth: 1 },
              { value: 5, color: "#4caf50", enabled: true, lineOpacity: 0.8, lineStyle: "solid", lineWidth: 1 },
              { value: 8, color: "#f23645", enabled: false, lineOpacity: 0.7, lineStyle: "solid", lineWidth: 1 },
              { value: 13, color: "#673ab7", enabled: false, lineOpacity: 0.7, lineStyle: "solid", lineWidth: 1 },
            ],
            trendLine: { enabled: true, color: "#787b86", lineStyle: "dashed", lineWidth: 1 },
            background: { enabled: false, fillOpacity: 0.15 },
            showLabels: false,
            counterclockwise: false,
          };
        }

        if (newDrawing.type === "gann_box") {
          newDrawing.gannBoxProps = {
            reverse: false,
            showAngles: false,
            showLabels: { left: true, right: true, top: true, bottom: true },
            priceLevels: [
              { value: 0, color: "#787b86", enabled: true, lineOpacity: 1, lineStyle: "solid", lineWidth: 1 },
              { value: 0.25, color: "#2196F3", enabled: true, lineOpacity: 0.8, lineStyle: "solid", lineWidth: 1 },
              { value: 0.382, color: "#00bcd4", enabled: true, lineOpacity: 0.8, lineStyle: "solid", lineWidth: 1 },
              { value: 0.5, color: "#4caf50", enabled: true, lineOpacity: 0.9, lineStyle: "solid", lineWidth: 1 },
              { value: 0.618, color: "#009688", enabled: true, lineOpacity: 0.8, lineStyle: "solid", lineWidth: 1 },
              { value: 0.75, color: "#3f51b5", enabled: true, lineOpacity: 0.8, lineStyle: "solid", lineWidth: 1 },
              { value: 1, color: "#787b86", enabled: true, lineOpacity: 1, lineStyle: "solid", lineWidth: 1 },
            ],
            timeLevels: [
              { value: 0, color: "#787b86", enabled: true, lineOpacity: 1, lineStyle: "solid", lineWidth: 1 },
              { value: 0.25, color: "#ff9800", enabled: true, lineOpacity: 0.8, lineStyle: "solid", lineWidth: 1 },
              { value: 0.382, color: "#00bcd4", enabled: true, lineOpacity: 0.8, lineStyle: "solid", lineWidth: 1 },
              { value: 0.5, color: "#4caf50", enabled: true, lineOpacity: 0.9, lineStyle: "solid", lineWidth: 1 },
              { value: 0.618, color: "#009688", enabled: true, lineOpacity: 0.8, lineStyle: "solid", lineWidth: 1 },
              { value: 0.75, color: "#3f51b5", enabled: true, lineOpacity: 0.8, lineStyle: "solid", lineWidth: 1 },
              { value: 1, color: "#787b86", enabled: true, lineOpacity: 1, lineStyle: "solid", lineWidth: 1 },
            ],
            priceBackground: { enabled: true, fillOpacity: 0.15 },
            timeBackground: { enabled: true, fillOpacity: 0.15 },
          };
        }

        if (newDrawing.type === "gann_square_fixed") {
          newDrawing.gannSquareFixedProps = {
            reverse: false,
            levels: [
              { id: 1, label: "0.25", color: "#2196F3", lineWidth: 1, lineStyle: "dashed", lineOpacity: 0.7, enabled: true },
              { id: 2, label: "0.382", color: "#ff9800", lineWidth: 1, lineStyle: "dashed", lineOpacity: 0.7, enabled: true },
              { id: 3, label: "0.5", color: "#4caf50", lineWidth: 1, lineStyle: "solid", lineOpacity: 0.9, enabled: true },
              { id: 4, label: "0.618", color: "#ff9800", lineWidth: 1, lineStyle: "dashed", lineOpacity: 0.7, enabled: true },
              { id: 5, label: "0.75", color: "#2196F3", lineWidth: 1, lineStyle: "dashed", lineOpacity: 0.7, enabled: true },
              { id: 6, label: "1", color: "#787b86", lineWidth: 1, lineStyle: "solid", lineOpacity: 1, enabled: true },
            ],
            fans: [
              { ratio: "1x1", label: "1×1", color: "#f23645", lineWidth: 1, lineStyle: "solid", lineOpacity: 0.9, enabled: true },
              { ratio: "1x2", label: "1×2", color: "#ff9800", lineWidth: 1, lineStyle: "dashed", lineOpacity: 0.7, enabled: true },
              { ratio: "2x1", label: "2×1", color: "#ff9800", lineWidth: 1, lineStyle: "dashed", lineOpacity: 0.7, enabled: true },
            ],
            arcs: [
              { ratio: "0.382", label: "38.2%", color: "#2196F3", lineWidth: 1, lineStyle: "solid", lineOpacity: 0.7, enabled: true },
              { ratio: "0.618", label: "61.8%", color: "#ff9800", lineWidth: 1, lineStyle: "solid", lineOpacity: 0.7, enabled: true },
              { ratio: "1", label: "100%", color: "#787b86", lineWidth: 1, lineStyle: "solid", lineOpacity: 0.9, enabled: true },
            ],
            background: { enabled: true, color: "#2196F3", opacity: 0.05 },
            showFans: true,
            showGrid: true,
            showArcs: false,
            showLabels: true,
            priceBarRatio: 1,
            lockRatio: false,
          };
        }

        if (newDrawing.type === "fib_speed_resistance_fan") {
          newDrawing.fibProps = {
            reverse: false,
            fillBackground: true,
            fillOpacity: 0.15,
            levels: [
              { value: 0, color: "#787b86", enabled: true, lineOpacity: 1, fillOpacity: 0.1, lineStyle: "solid", lineWidth: 1 },
              { value: 0.236, color: "#f23645", enabled: true, lineOpacity: 1, fillOpacity: 0.1, lineStyle: "solid", lineWidth: 1 },
              { value: 0.382, color: "#ff9800", enabled: true, lineOpacity: 1, fillOpacity: 0.1, lineStyle: "solid", lineWidth: 1 },
              { value: 0.5, color: "#4caf50", enabled: true, lineOpacity: 1, fillOpacity: 0.1, lineStyle: "solid", lineWidth: 1 },
              { value: 0.618, color: "#009688", enabled: true, lineOpacity: 1, fillOpacity: 0.1, lineStyle: "solid", lineWidth: 1 },
              { value: 0.786, color: "#2196f3", enabled: true, lineOpacity: 1, fillOpacity: 0.1, lineStyle: "solid", lineWidth: 1 },
              { value: 1, color: "#787b86", enabled: true, lineOpacity: 1, fillOpacity: 0.1, lineStyle: "solid", lineWidth: 1 },
              { value: 1.618, color: "#2962ff", enabled: true, lineOpacity: 1, fillOpacity: 0.1, lineStyle: "solid", lineWidth: 1 },
            ],
            showPrices: true,
            showLevels: true,
            labelsPosition: "right",
            fanProps: {
              reverse: false,
              fillBackground: true,
              fillOpacity: 0.15,
              extendLines: "none",
              priceLevels: [
                { value: 0, color: "#787b86", enabled: true, lineOpacity: 0.6 },
                { value: 0.25, color: "#ff9800", enabled: true, lineOpacity: 0.8 },
                { value: 0.382, color: "#00bcd4", enabled: true, lineOpacity: 0.8 },
                { value: 0.5, color: "#4caf50", enabled: true, lineOpacity: 0.8 },
                { value: 0.618, color: "#009688", enabled: true, lineOpacity: 0.8 },
                { value: 0.75, color: "#673ab7", enabled: true, lineOpacity: 0.8 },
                { value: 1, color: "#787b86", enabled: true, lineOpacity: 1.0 },
              ],
              timeLevels: [
                { value: 0, color: "#787b86", enabled: true, lineOpacity: 0.6 },
                { value: 0.25, color: "#ff9800", enabled: true, lineOpacity: 0.8 },
                { value: 0.382, color: "#00bcd4", enabled: true, lineOpacity: 0.8 },
                { value: 0.5, color: "#4caf50", enabled: true, lineOpacity: 0.8 },
                { value: 0.618, color: "#009688", enabled: true, lineOpacity: 0.8 },
                { value: 0.75, color: "#673ab7", enabled: true, lineOpacity: 0.8 },
                { value: 1, color: "#787b86", enabled: true, lineOpacity: 1.0 },
              ],
              showPriceLabels: { left: false, right: true },
              showTimeLabels: { top: false, bottom: true },
              useOneColor: false,
              oneColor: "#2962ff",
              gridEnabled: true,
              gridStyle: "dashed",
            },
          };
        }

        if (newDrawing.type === "gann_square") {
          newDrawing.gannSquareProps = {
            color: "#2962ff",
            showAngles: true,
            showFans: true,
            showArcs: false,
            showGrid: true,
            showLabels: false,
            fillBackground: false,
            fillOpacity: 0.08,
            mosaicFill: false,
            useOneColor: false,
            oneColor: "#2962ff",
            reverse: false,
            priceBarRatio: 1,
            fans: [
              { ratio: "1x8", label: "1×8", color: "#ff9800", enabled: true, lineOpacity: 0.6, lineWidth: 1, lineStyle: "dashed" },
              { ratio: "1x4", label: "1×4", color: "#ff9800", enabled: true, lineOpacity: 0.7, lineWidth: 1, lineStyle: "dashed" },
              { ratio: "1x3", label: "1×3", color: "#2196F3", enabled: true, lineOpacity: 0.7, lineWidth: 1, lineStyle: "dashed" },
              { ratio: "1x2", label: "1×2", color: "#2196F3", enabled: true, lineOpacity: 0.8, lineWidth: 1, lineStyle: "solid" },
              { ratio: "1x1", label: "1×1", color: "#f23645", enabled: true, lineOpacity: 1, lineWidth: 2, lineStyle: "solid" },
              { ratio: "2x1", label: "2×1", color: "#2196F3", enabled: true, lineOpacity: 0.8, lineWidth: 1, lineStyle: "solid" },
              { ratio: "3x1", label: "3×1", color: "#2196F3", enabled: true, lineOpacity: 0.7, lineWidth: 1, lineStyle: "dashed" },
              { ratio: "4x1", label: "4×1", color: "#ff9800", enabled: true, lineOpacity: 0.7, lineWidth: 1, lineStyle: "dashed" },
              { ratio: "8x1", label: "8×1", color: "#ff9800", enabled: true, lineOpacity: 0.6, lineWidth: 1, lineStyle: "dashed" },
            ],
            arcs: [
              { ratio: "0.5", label: "50%", color: "#787b86", enabled: false, lineOpacity: 0.6, lineWidth: 1, lineStyle: "dashed" },
              { ratio: "1", label: "100%", color: "#787b86", enabled: true, lineOpacity: 0.8, lineWidth: 1, lineStyle: "solid" },
              { ratio: "1.618",label: "161%", color: "#673ab7", enabled: false, lineOpacity: 0.6, lineWidth: 1, lineStyle: "dashed" },
            ],
            levels: [
              { value: 0.25, label: "25%", color: "#2196F3", enabled: true, lineOpacity: 0.5, lineWidth: 1, lineStyle: "dashed" },
              { value: 0.5, label: "50%", color: "#4caf50", enabled: true, lineOpacity: 0.7, lineWidth: 1, lineStyle: "solid" },
              { value: 0.75, label: "75%", color: "#2196F3", enabled: true, lineOpacity: 0.5, lineWidth: 1, lineStyle: "dashed" },
              { value: 1, label: "100%", color: "#787b86", enabled: true, lineOpacity: 1, lineWidth: 1, lineStyle: "solid" },
            ],
          };
        }

        if (newDrawing.type === "gann_fan") {
          newDrawing.gannFanProps = {
            reverse: false,
            showLabels: true,
            fillBackground: true,
            lines: [
              { ratio: "1x8", numerator: 1, denominator: 8, color: "#ff9800", lineWidth: 1, lineStyle: "dashed", lineOpacity: 0.6, fillColor: "#ff9800", fillOpacity: 0.04, enabled: true },
              { ratio: "1x4", numerator: 1, denominator: 4, color: "#ff9800", lineWidth: 1, lineStyle: "dashed", lineOpacity: 0.7, fillColor: "#ff9800", fillOpacity: 0.04, enabled: true },
              { ratio: "1x3", numerator: 1, denominator: 3, color: "#2196F3", lineWidth: 1, lineStyle: "dashed", lineOpacity: 0.7, fillColor: "#2196F3", fillOpacity: 0.04, enabled: true },
              { ratio: "1x2", numerator: 1, denominator: 2, color: "#2196F3", lineWidth: 1, lineStyle: "solid", lineOpacity: 0.8, fillColor: "#2196F3", fillOpacity: 0.05, enabled: true },
              { ratio: "1x1", numerator: 1, denominator: 1, color: "#f23645", lineWidth: 2, lineStyle: "solid", lineOpacity: 1, fillColor: "#f23645", fillOpacity: 0.07, enabled: true },
              { ratio: "2x1", numerator: 2, denominator: 1, color: "#2196F3", lineWidth: 1, lineStyle: "solid", lineOpacity: 0.8, fillColor: "#2196F3", fillOpacity: 0.05, enabled: true },
              { ratio: "3x1", numerator: 3, denominator: 1, color: "#2196F3", lineWidth: 1, lineStyle: "dashed", lineOpacity: 0.7, fillColor: "#2196F3", fillOpacity: 0.04, enabled: true },
              { ratio: "4x1", numerator: 4, denominator: 1, color: "#ff9800", lineWidth: 1, lineStyle: "dashed", lineOpacity: 0.7, fillColor: "#ff9800", fillOpacity: 0.04, enabled: true },
              { ratio: "8x1", numerator: 8, denominator: 1, color: "#ff9800", lineWidth: 1, lineStyle: "dashed", lineOpacity: 0.6, fillColor: "#ff9800", fillOpacity: 0.04, enabled: true },
            ],
          };
        }

        setSelectedDrawingId(null);
        setCurrentDrawing(newDrawing);
        currentDrawingRef.current = newDrawing;
      } else if (currentDrawingRef.current) {
        const updatedPoints = [...currentDrawingRef.current.points, coords];
        if (updatedPoints.length >= 2) {
          const draft = { ...currentDrawingRef.current, points: updatedPoints };
          if (draft.type === "bar_pattern") {
            const seeded = extractBarPatternData(updatedPoints[0], updatedPoints[1]);
            draft.barPatternProps = {
              color: draft.barPatternProps?.color || draft.style.color || "#ff9800",
              mode: draft.barPatternProps?.mode || "HL Bars",
              mirrored: draft.barPatternProps?.mirrored ?? false,
              flipped: draft.barPatternProps?.flipped ?? false,
              opacity: draft.barPatternProps?.opacity ?? 1,
              data: seeded,
            };
          }
          completeDrawingSession(draft);
        } else {
          const updatedDrawing = { ...currentDrawingRef.current, points: updatedPoints };
          setCurrentDrawing(updatedDrawing);
          currentDrawingRef.current = updatedDrawing;
        }
      }
      return;
    }

    // ==== MULTI CLICK TOOLS ====
    if (MULTI_CLICK_TOOLS.includes(currentActiveTool)) {
      if (!isDrawingRef.current) {
        setIsDrawing(true);
        const newDrawing: Drawing = {
          id: generateId(),
          type: currentActiveTool as NonNullable<AllToolType>,
          points: [coords],
          style: { ...getToolDefault(currentActiveTool) },
          isCreating: true,
        };

        if (currentActiveTool === "ghost_feed") {
          newDrawing.barPatternProps = {
            color: newDrawing.style.color || "#ff9800",
            mode: "HL Bars",
            mirrored: false,
            flipped: false,
            opacity: 0.5,
            data: [],
          };
        }

        if (
          currentActiveTool === "trend_based_fib_extension" ||
          currentActiveTool === "fib_channel" ||
          currentActiveTool === "fib_speed_resistance_fan" ||
          currentActiveTool === "trend_based_fib_time"
        ) {
          newDrawing.fibProps = {
            reverse: false,
            fillBackground: true,
            levels: [
              { value: 0, color: "#787b86", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 0.236, color: "#f23645", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 0.382, color: "#ff9800", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 0.5, color: "#4caf50", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 0.618, color: "#009688", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 0.786, color: "#2196f3", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 1, color: "#787b86", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 1.618, color: "#2962ff", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 2.618, color: "#2962ff", enabled: false, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 3.618, color: "#2962ff", enabled: false, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 4.236, color: "#2962ff", enabled: false, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
            ],
            showPrices: true,
            showLevels: true,
            labelsPosition: "right",
          };
        }

        if (
          currentActiveTool === "pitchfork" ||
          currentActiveTool === "schiff_pitchfork" ||
          currentActiveTool === "modified_schiff_pitchfork" ||
          currentActiveTool === "inside_pitchfork"
        ) {
          const styleMap: Record<string, "original" | "schiff" | "modified_schiff" | "inside"> = {
            pitchfork: "original",
            schiff_pitchfork: "schiff",
            modified_schiff_pitchfork: "modified_schiff",
            inside_pitchfork: "inside",
          };
          newDrawing.pitchforkProps = {
            style: styleMap[currentActiveTool],
            extendLines: true,
            fillBackground: true,
            fillOpacity: 0.15,
            levels: [
              { value: -1, color: "#2196F3", enabled: true, lineOpacity: 0.8, fillOpacity: 0.08, lineStyle: "solid", lineWidth: 1 },
              { value: -0.5, color: "#2196F3", enabled: false, lineOpacity: 0.6, fillOpacity: 0.06, lineStyle: "dashed", lineWidth: 1 },
              { value: 0, color: "#f23645", enabled: true, lineOpacity: 1, fillOpacity: 0, lineStyle: "solid", lineWidth: 1.5 },
              { value: 0.5, color: "#4CAF50", enabled: false, lineOpacity: 0.6, fillOpacity: 0.06, lineStyle: "dashed", lineWidth: 1 },
              { value: 1, color: "#4CAF50", enabled: true, lineOpacity: 0.8, fillOpacity: 0.08, lineStyle: "solid", lineWidth: 1 },
              { value: 1.5, color: "#4CAF50", enabled: false, lineOpacity: 0.5, fillOpacity: 0.05, lineStyle: "dashed", lineWidth: 1 },
              { value: 2, color: "#4CAF50", enabled: false, lineOpacity: 0.5, fillOpacity: 0.05, lineStyle: "dashed", lineWidth: 1 },
            ],
          };
        }

        if (currentActiveTool === "pitchfan") {
          newDrawing.pitchfanProps = {
            fillBackground: true,
            fillOpacity: 0.15,
            showTrendLine: true,
            trendLine: { enabled: true, color: newDrawing.style.color || "#f44336", lineStyle: "solid", lineWidth: 1 },
            levels: [
              { t: 0, color: "#f23645", lineWidth: 1.5, lineStyle: "solid", lineOpacity: 1, enabled: true },
              { t: 0.25, color: "#2196F3", lineWidth: 1, lineStyle: "dashed", lineOpacity: 0.7, enabled: true },
              { t: 0.5, color: "#4caf50", lineWidth: 1.5, lineStyle: "solid", lineOpacity: 0.9, enabled: true },
              { t: 0.75, color: "#2196F3", lineWidth: 1, lineStyle: "dashed", lineOpacity: 0.7, enabled: true },
              { t: 1, color: "#f23645", lineWidth: 1.5, lineStyle: "solid", lineOpacity: 1, enabled: true },
            ],
          };
        }

        if (currentActiveTool === "trend_based_fib_time") {
          newDrawing.trendBasedFibTimeProps = {
            levels: [
              { value: 0, color: "#787b86", enabled: true, lineOpacity: 1, lineStyle: "solid", lineWidth: 1 },
              { value: 0.5, color: "#4caf50", enabled: true, lineOpacity: 0.8, lineStyle: "dashed", lineWidth: 1 },
              { value: 1, color: "#f23645", enabled: true, lineOpacity: 1, lineStyle: "solid", lineWidth: 1 },
              { value: 1.618, color: "#2962ff", enabled: true, lineOpacity: 0.8, lineStyle: "solid", lineWidth: 1 },
              { value: 2, color: "#ff9800", enabled: true, lineOpacity: 0.7, lineStyle: "dashed", lineWidth: 1 },
              { value: 2.618, color: "#673ab7", enabled: true, lineOpacity: 0.7, lineStyle: "solid", lineWidth: 1 },
              { value: 3, color: "#ff9800", enabled: false, lineOpacity: 0.6, lineStyle: "dashed", lineWidth: 1 },
              { value: 3.618, color: "#009688", enabled: false, lineOpacity: 0.6, lineStyle: "dashed", lineWidth: 1 },
              { value: 4.236, color: "#009688", enabled: false, lineOpacity: 0.6, lineStyle: "dashed", lineWidth: 1 },
            ],
            trendLine: { enabled: true, color: "#787b86", lineStyle: "dashed", lineWidth: 1 },
            extensionLine: { enabled: true, color: "#787b86", lineStyle: "dashed", lineWidth: 1 },
            labelsPosition: "bottom",
            labelsHorizontalPosition: "right",
            fillBackground: true,
            fillOpacity: 0.15,
            showPrices: false,
            showLevels: true,
          };
        }

        setSelectedDrawingId(null);
        setCurrentDrawing(newDrawing);
        currentDrawingRef.current = newDrawing;
      } else if (currentDrawingRef.current) {
        const maxClicks = TOOL_MAX_CLICKS_REGISTRY[currentDrawingRef.current.type] || 999;
        const updatedPoints = [...currentDrawingRef.current.points, coords];

        if (currentDrawingRef.current.type === "sector" && updatedPoints.length === 3) {
          const p0 = updatedPoints[0];
          const p1 = updatedPoints[1];
          const p2 = updatedPoints[2];
          const chart = chartInstanceRef.current;
          if (chart) {
            const priceIdx = getPriceSeriesIndex(chart);
            const p0Pix = chart.convertToPixel({ seriesIndex: priceIdx }, [p0.time, p0.value]);
            const p1Pix = chart.convertToPixel({ seriesIndex: priceIdx }, [p1.time, p1.value]);
            const p2Pix = chart.convertToPixel({ seriesIndex: priceIdx }, [p2.time, p2.value]);

            if (p0Pix && p1Pix && p2Pix) {
              const radius = Math.hypot(p1Pix[0] - p0Pix[0], p1Pix[1] - p0Pix[1]);
              const angle2 = Math.atan2(p2Pix[1] - p0Pix[1], p2Pix[0] - p0Pix[0]);
              const constP2 = chart.convertFromPixel({ seriesIndex: priceIdx }, [p0Pix[0] + radius * Math.cos(angle2), p0Pix[1] + radius * Math.sin(angle2)]);
              if (constP2) updatedPoints[2] = { time: constP2[0], value: constP2[1] };
            }
          }
        }

        if (currentDrawingRef.current.type !== "ghost_feed" && updatedPoints.length >= maxClicks) {
          completeDrawingSession({ ...currentDrawingRef.current, points: updatedPoints });
        } else {
          const updatedDrawing = { ...currentDrawingRef.current, points: updatedPoints };
          setCurrentDrawing(updatedDrawing);
          currentDrawingRef.current = updatedDrawing;
        }
      }
      return;
    }
  }, [cancelDrawingSession, chartInstanceRef, completeDrawingSession, deleteDrawing, drawingCanvasRef, extractBarPatternData, getChartCoordinates, getToolDefault, handleDoubleClick, setIsDrawing]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch' && e.cancelable) e.preventDefault();
    if (!drawingCanvasRef.current) return;

    const rect = drawingCanvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    mousePosRef.current = { x: mx, y: my };

    if (isDraggingRef.current && dragTargetRef.current && chartInstanceRef.current) {
      const { drawingId, type, pointIndex, initialPoints, mouseStart } = dragTargetRef.current;
      const dx = mx - mouseStart.x;
      const dy = my - mouseStart.y;

      const d = drawingsRef.current.find(draw => draw.id === drawingId);
      if (!d) return;

      let newPoints = [...d.points];

      if (type === 'shape') {
        const priceIdx = getPriceSeriesIndex(chartInstanceRef.current!);
        newPoints = initialPoints.map(p => {
          const startPix = chartInstanceRef.current?.convertToPixel({ seriesIndex: priceIdx }, [p.time, p.value]);
          if (!startPix) return p;
          const newPix = [startPix[0] + dx, startPix[1] + dy];
          const newCoords = chartInstanceRef.current?.convertFromPixel({ seriesIndex: priceIdx }, newPix);
          if (!newCoords) return p;

          const rawTime = newCoords[0];
          let finalTime: string | number = rawTime;
          if (typeof rawTime === 'number') {
            const idx = Math.round(rawTime);
            const clampedIdx = Math.max(0, Math.min(idx, chartDataRef.current.length - 1));
            finalTime = chartDataRef.current[clampedIdx].time;
          }

          return { time: finalTime, value: newCoords[1] as number };
        });
      } else if (type === 'point') {
        const chart = chartInstanceRef.current!;
        const priceIdx = getPriceSeriesIndex(chart);
        const currentCoords = chart.convertFromPixel({ seriesIndex: priceIdx }, [mx, my]);

        if (currentCoords) {
          if (d.type === 'sector') {
            const p0 = d.points[0];
            const p0Pix = chart.convertToPixel({ seriesIndex: priceIdx }, [p0.time, p0.value]);
            if (p0Pix) {
              if (pointIndex === 0) {
                newPoints[0] = { time: currentCoords[0], value: currentCoords[1] };
              } else if (pointIndex === 1 && d.points.length >= 3) {
                const rad = Math.hypot(mx - p0Pix[0], my - p0Pix[1]);
                const p2 = d.points[2], p2Pix = chart.convertToPixel({ seriesIndex: priceIdx }, [p2.time, p2.value]);
                newPoints[1] = { time: currentCoords[0], value: currentCoords[1] };
                if (p2Pix) {
                  const a2 = Math.atan2(p2Pix[1] - p0Pix[1], p2Pix[0] - p0Pix[0]);
                  const cP2 = chart.convertFromPixel({ seriesIndex: priceIdx }, [p0Pix[0] + rad * Math.cos(a2), p0Pix[1] + rad * Math.sin(a2)]);
                  if (cP2) newPoints[2] = { time: cP2[0], value: cP2[1] };
                }
              } else if (pointIndex === 2 && d.points.length >= 3) {
                const rad = Math.hypot(mx - p0Pix[0], my - p0Pix[1]);
                const p1 = d.points[1], p1Pix = chart.convertToPixel({ seriesIndex: priceIdx }, [p1.time, p1.value]);
                if (p1Pix) {
                  const a1 = Math.atan2(p1Pix[1] - p0Pix[1], p1Pix[0] - p0Pix[0]);
                  const angle = Math.atan2(my - p0Pix[1], mx - p0Pix[0]);
                  const cP1 = chart.convertFromPixel({ seriesIndex: priceIdx }, [p0Pix[0] + rad * Math.cos(a1), p0Pix[1] + Math.sin(a1)]);
                  const cP2 = chart.convertFromPixel({ seriesIndex: priceIdx }, [p0Pix[0] + rad * Math.cos(angle), p0Pix[1] + rad * Math.sin(angle)]);
                  if (cP1) newPoints[1] = { time: cP1[0], value: cP1[1] };
                  if (cP2) newPoints[2] = { time: cP2[0], value: cP2[1] };
                }
              }
            }
          } else if (d.type === 'anchored_vwap' || d.type === 'anchored_volume_profile') {
            const categoryIndex = Math.round(currentCoords[0] as number);
            const clampedIndex = Math.max(0, Math.min(categoryIndex, chartDataRef.current.length - 1));
            const nearestBar = chartDataRef.current[clampedIndex];
            if (nearestBar) {
              newPoints[pointIndex] = { time: nearestBar.time, value: currentCoords[1] as number };
            }
          } else {
            newPoints[pointIndex] = { time: currentCoords[0], value: currentCoords[1] };
          }
        }
      } else if (type === 'position_zone' && dragTargetRef.current?.positionZone) {
        const priceIdx = getPriceSeriesIndex(chartInstanceRef.current!);
        const cur = chartInstanceRef.current!.convertFromPixel({ seriesIndex: priceIdx }, [mx, my]);
        if (cur) {
          const entryVal = d.points[0].value;
          const off = Math.abs(cur[1] - entryVal);
          if (dragTargetRef.current.positionZone === 'tp')
            draggedDrawingRef.current = { ...d, tpOffset: off, positionProps: d.positionProps ? { ...d.positionProps, tpPrice: cur[1] } : undefined };
          else
            draggedDrawingRef.current = { ...d, slOffset: off, positionProps: d.positionProps ? { ...d.positionProps, slPrice: cur[1] } : undefined };
          return;
        }
      } else if (type === 'width_resize') {
        const baseWidth = d.positionProps?.width ?? 200;
        const nextWidth = Math.max(60, Math.round(baseWidth + dx));
        draggedDrawingRef.current = {
          ...d,
          positionProps: d.positionProps ? { ...d.positionProps, width: nextWidth } : {
            accountSize: 10000, riskPercent: 1, entryPrice: d.points[0]?.value ?? 0, tpPrice: d.points[0]?.value ?? 0, slPrice: d.points[0]?.value ?? 0, width: nextWidth
          }
        };
        return;
      }

      draggedDrawingRef.current = { ...d, points: newPoints, isDragging: true };
      return;
    }

    const mode = cursorModeRef.current;
    if (mode === 'eraser' || mode === 'magic') {
      drawingCanvasRef.current.style.cursor = '';
      return;
    }

    let cursor = "default";
    let hoveringInt = false;

    if (drawingsRef.current.length > 0 && chartInstanceRef.current && !chartInstanceRef.current.isDisposed()) {
      for (let i = drawingsRef.current.length - 1; i >= 0; i--) {
        const hit = rendererRef.current?.hitTest(mx, my, drawingsRef.current[i], chartInstanceRef.current, 15);
        if (hit?.isHit) {
          hoveringInt = true;
          cursor = hit.hitType === "point" ? "grab" : "move";
          break;
        }
      }
    }

    if (!hoveringInt) cursor = (activeToolRef.current || isDrawingRef.current) ? "crosshair" : "default";
    drawingCanvasRef.current.style.cursor = cursor;
  }, [chartInstanceRef, drawingCanvasRef]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (drawingCanvasRef.current && e.pointerId !== undefined) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    }

    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      if (draggedDrawingRef.current) {
        const drawingToUpdate = draggedDrawingRef.current;
        setDrawings(prev => {
          const n = prev.map(d => d.id === drawingToUpdate.id ? { ...drawingToUpdate, isDragging: false } : d);
          pushHistory(n); // Immediate push on drop
          return n;
        });
        draggedDrawingRef.current = null;
      }
      dragTargetRef.current = null;
    }
  }, [drawingCanvasRef, pushHistory]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLElement) {
      const tagName = e.target.tagName.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || e.target.isContentEditable) {
        return;
      }
    }

    if (e.key === "Escape") {
      cancelDrawingSession();
    }

    if ((e.key === "Delete" || e.key === "Backspace") && selectedIdRef.current) {
      deleteDrawing(selectedIdRef.current);
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      redo();
    }
  }, [cancelDrawingSession, deleteDrawing, undo, redo]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const saveAsDefault = useCallback((id: string) => {
    const d = drawingsRef.current.find(dr => dr.id === id);
    if (!d) return;
    setToolDefaults(prev => {
      const next = { ...prev, [d.type]: { ...d.style } };
      localStorage.setItem('algoway_drawing_defaults', JSON.stringify(next));
      return next;
    });
  }, []);

  const resetStyle = useCallback((id: string) => {
    const d = drawingsRef.current.find(dr => dr.id === id);
    if (!d) return;
    const factory: DrawingStyle = { color: "#2962FF", lineWidth: 2, lineStyle: "solid", fillColor: "#2962FF", fillOpacity: 0.1 };
    setDrawings(prev => {
      const n = prev.map(dr => dr.id === id ? { ...dr, style: { ...dr.style, ...factory } } as Drawing : dr);
      pushHistory(n);
      return n;
    });
  }, [pushHistory]);

  const saveNamedTemplate = useCallback((id: string, name: string) => {
    const d = drawingsRef.current.find(dr => dr.id === id);
    if(!d || !name) return;
    setNamedTemplates(prev => {
      const list = prev[d.type] || [];
      const nextList = [...list, { name, style: { ...d.style } }];
      const next = { ...prev, [d.type]: nextList };
      localStorage.setItem('algoway_drawing_templates', JSON.stringify(next));
      return next;
    });
  }, []);

  const applyNamedTemplate = useCallback((id: string, name: string) => {
    const d = drawingsRef.current.find(dr => dr.id === id);
    if(!d) return;
    const t = (namedTemplates[d.type] || []).find(x => x.name === name);
    if(t) {
      setDrawings(p => {
        const n = p.map(dr => dr.id === id ? { ...dr, style: { ...t.style } } : dr);
        pushHistory(n); // [FIX] Ensure template application is undoable
        return n;
      });
    }
  }, [namedTemplates, pushHistory]);

  const deleteNamedTemplate = useCallback((type: string, name: string) => {
    setNamedTemplates(prev => {
      const next = { ...prev, [type]: (prev[type] || []).filter(x => x.name !== name) };
      localStorage.setItem('algoway_drawing_templates', JSON.stringify(next));
      return next;
    });
  }, []);

  return {
    activeTool,
    setActiveTool,
    clearDrawings: () => {
      setDrawings([]);
      pushHistory([]);
    },
    drawings,
    selectedDrawingId,
    setSelectedDrawingId,
    deleteDrawing,
    updateDrawing,
    addDrawing,
    reorderDrawing,
    undo,
    redo,
    saveDrawingToCloud: useCallback(async () => {
      console.warn("Cloud Save not implemented");
    }, []),
    restoreDrawingsFromCloud: useCallback(async () => {
      console.warn("Cloud Restore not implemented");
    }, []),
    saveAsDefault,
    resetStyle,
    namedTemplates,
    saveNamedTemplate,
    applyNamedTemplate,
    deleteNamedTemplate,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleDoubleClick,
    handleKeyDown,
    drawingCanvasRef,
    gridRect,
  };
};
// --- EOF ---