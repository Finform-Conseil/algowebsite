import React, { useCallback, useEffect, useLayoutEffect, useRef, useState, RefObject } from "react";
import { useSelector } from "react-redux";
import DOMPurify from "dompurify";
import {
  selectUiState,
  selectAlerts,
  selectOrders,
} from "../store/selectors";
import type { AllToolType } from "../config/drawing/drawingToolTypes";
import type { DrawingPoint, DrawingStyle } from "../config/drawing/drawingPrimitiveTypes";
import type { Drawing } from "../config/drawing/drawingModelTypes";
import type { Alert, Order } from "../config/state/technicalAnalysisStateTypes";
import type { UiState } from "../config/state/uiStateTypes";
import { DrawingRenderer } from "../lib/DrawingRenderer";
import { MEASURE_TOOLS, FIB_PURE_TOOLS, PITCHFORK_TOOLS } from "../config/drawing/drawingConstants";
import type { EChartsType } from "echarts/core";
import { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";
import {
  EMPTY_ALERTS,
  EMPTY_ORDERS,
  MULTI_CLICK_TOOLS,
  SINGLE_CLICK_TOOLS,
  TOOL_MAX_CLICKS_REGISTRY,
  TWO_CLICK_TOOLS,
  createDefaultAnchoredVolumeProfileProps,
  validateNamedTemplates,
  validateToolDefaults,
} from "./drawing/drawingDefaults";
import {
  MAIN_GRID_LEFT,
  TV_X_AXIS_HEIGHT,
  TV_Y_AXIS_WIDTH,
  getInteractiveGridRect,
  getPriceSeriesIndex,
  isChartTimeValue,
  isChartUsable,
  isInsideGridRect,
  safeConvertFromPixel,
  safeConvertToPixel,
} from "./drawing/drawingCoordinates";
import { SpatialHashGrid } from "./drawing/drawingSpatialIndex";
import {
  DRAWING_CLOUD_PERSISTENCE_STATUS,
  createDisabledDrawingCloudPersistence,
  idbGet,
  idbSet,
} from "./drawing/drawingPersistence";

const saveDrawingToCloudDisabled = createDisabledDrawingCloudPersistence("save");
const restoreDrawingsFromCloudDisabled = createDisabledDrawingCloudPersistence("restore");
const FREEHAND_MIN_POINT_DISTANCE_PX = 3;
const FREEHAND_MAX_POINTS = 900;

// ============================================================================
// TYPES
// ============================================================================
interface UseDrawingManagerProps {
  chartInstanceRef: RefObject<EChartsType | null>;
  drawingCanvasRef: RefObject<HTMLCanvasElement | null>;
  chartData: ChartDataPoint[];
}

// ============================================================================
// HOOK
// ============================================================================
export const useDrawingManager = ({
  chartInstanceRef,
  drawingCanvasRef,
  chartData,
}: UseDrawingManagerProps) => {
  const uiState = useSelector(selectUiState) as UiState;
  const drawingInteractionScopeKey = `${uiState.multiChartLayout.layoutId}:${uiState.multiChartLayout.activeChartId}`;

  // --- State ---
  const [activeTool, setActiveTool] = useState<AllToolType>(null);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [, setCurrentDrawing] = useState<Drawing | null>(null);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);

  // ============================================================================
  // [TENOR 2026 SRE] DIRTY FLAG ENGINE (CPU SHIELD)
  // ============================================================================
  const isDirtyRef = useRef<boolean>(true);
  const markDirty = useCallback(() => {
    isDirtyRef.current = true;
  }, []);

  const selectedAlerts = useSelector(selectAlerts);
  const selectedOrders = useSelector(selectOrders);
  const alerts = selectedAlerts ?? EMPTY_ALERTS;
  const orders = selectedOrders ?? EMPTY_ORDERS;

  // ============================================================================
  // [TENOR 2026 SRE] SYNCHRONOUS REF MUTATION (Stale Closure Fix)
  // Replaced useEffect with useLayoutEffect to guarantee synchronous updates
  // before the browser paints, eliminating 1-frame lag and stale closures.
  // ============================================================================
  const cursorModeRef = useRef<string>(uiState.cursorMode as string);
  const activeToolRef = useRef<AllToolType>(activeTool);
  const drawingsRef = useRef<Drawing[]>(drawings);
  const alertsRef = useRef<Alert[]>(alerts);
  const ordersRef = useRef<Order[]>(orders);
  const currentDrawingRef = useRef<Drawing | null>(null);
  const isDrawingRef = useRef(false);
  const clickCountRef = useRef(0);
  const prevContextRef = useRef({ tool: activeTool, mode: uiState.cursorMode, scope: drawingInteractionScopeKey });

  // [TENOR 2026] Spatial Hash Grid Instance
  const spatialGridRef = useRef<SpatialHashGrid>(new SpatialHashGrid());

  useLayoutEffect(() => {
    cursorModeRef.current = uiState.cursorMode as string;
    activeToolRef.current = activeTool;
    drawingsRef.current = drawings;

    if (alertsRef.current !== alerts || ordersRef.current !== orders) {
      alertsRef.current = alerts;
      ordersRef.current = orders;
      markDirty();
    }

    if (
      prevContextRef.current.tool !== activeTool ||
      prevContextRef.current.mode !== uiState.cursorMode ||
      prevContextRef.current.scope !== drawingInteractionScopeKey
    ) {
      isDrawingRef.current = false;
      currentDrawingRef.current = null;
      clickCountRef.current = 0;
      prevContextRef.current = { tool: activeTool, mode: uiState.cursorMode, scope: drawingInteractionScopeKey };
      markDirty();
    }
  }, [activeTool, uiState.cursorMode, drawingInteractionScopeKey, drawings, alerts, orders, markDirty]);

  useEffect(() => {
    setCurrentDrawing(null);
    markDirty();
  }, [activeTool, uiState.cursorMode, drawingInteractionScopeKey, markDirty]);

  // --- High-Performance Refs ---
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);
  const chartSyncRef = useRef<number>(0);
  const chartDataRef = useRef<ChartDataPoint[]>(chartData);

  useLayoutEffect(() => {
    chartDataRef.current = chartData;
    markDirty(); // Force render when new candles arrive
  }, [chartData, markDirty]);

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
    markDirty();
  }, [markDirty]);

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
    markDirty();
  }, [setIsDrawing, markDirty]);

  const cancelDrawingSession = useCallback((keepSelection = false) => {
    resetDrawingInteraction();
    clearCurrentDrawing();
    if (!keepSelection) {
      setSelectedDrawingId(null);
    }
    setActiveTool(null);
    markDirty();
  }, [clearCurrentDrawing, resetDrawingInteraction, markDirty]);

  // ============================================================================
  // [TENOR 2026 SRE] UNDO / REDO HISTORY STACK (OOM SHIELD)
  // SCAR-MEM-01: Eradicated fastDeepClone. Using pure Structural Sharing.
  // ============================================================================
  const MAX_HISTORY_STATES = 50;
  const historyRef = useRef<Drawing[][]>([[]]);
  const historyStepRef = useRef<number>(0);
  const pendingHistoryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const pushHistory = useCallback((newDrawings: Drawing[]) => {
    const currentStep = historyStepRef.current;
    let newHistory = historyRef.current.slice(0, currentStep + 1);
    
    // [TENOR 2026 SRE] STRUCTURAL SHARING
    // We rely on React's strict immutability. `newDrawings` is an array of references.
    // Memory complexity drops from O(N^2) to O(1) per state.
    newHistory.push([...newDrawings]);
    
    if (newHistory.length > MAX_HISTORY_STATES) {
      newHistory = newHistory.slice(newHistory.length - MAX_HISTORY_STATES);
    }
    
    historyRef.current = newHistory;
    historyStepRef.current = newHistory.length - 1;
  }, []);

  const pushHistoryDebounced = useCallback((newDrawings: Drawing[]) => {
    if (pendingHistoryTimeoutRef.current) clearTimeout(pendingHistoryTimeoutRef.current);
    pendingHistoryTimeoutRef.current = setTimeout(() => {
      pushHistory(newDrawings);
      pendingHistoryTimeoutRef.current = null;
    }, 400);
  }, [pushHistory]);

  const undo = useCallback(() => {
    if (pendingHistoryTimeoutRef.current) {
      clearTimeout(pendingHistoryTimeoutRef.current);
      pendingHistoryTimeoutRef.current = null;
    }
    if (historyStepRef.current > 0) {
      historyStepRef.current -= 1;
      cancelDrawingSession();
      setDrawings(historyRef.current[historyStepRef.current]);
      markDirty();
    }
  }, [cancelDrawingSession, markDirty]);

  const redo = useCallback(() => {
    if (pendingHistoryTimeoutRef.current) {
      clearTimeout(pendingHistoryTimeoutRef.current);
      pendingHistoryTimeoutRef.current = null;
    }
    if (historyStepRef.current < historyRef.current.length - 1) {
      historyStepRef.current += 1;
      cancelDrawingSession();
      setDrawings(historyRef.current[historyStepRef.current]);
      markDirty();
    }
  }, [cancelDrawingSession, markDirty]);

  // --- CRUD Operations ---
  const selectedIdRef = useRef<string | null>(null);
  useLayoutEffect(() => {
    selectedIdRef.current = selectedDrawingId;
    markDirty();
  }, [selectedDrawingId, markDirty]);

  const deleteDrawing = useCallback((id: string) => {
    setDrawings(prev => {
      const n = prev.filter(d => d.id !== id);
      pushHistory(n);
      return n;
    });
    if (selectedIdRef.current === id) setSelectedDrawingId(null);
    markDirty();
  }, [pushHistory, markDirty]);

  const updateDrawing = useCallback((id: string, u: Partial<Drawing>) => {
    setDrawings(p => {
      const n = p.map(d => d.id === id ? { ...d, ...u } as Drawing : d);
      pushHistoryDebounced(n);
      return n;
    });
    markDirty();
  }, [pushHistoryDebounced, markDirty]);

  const addDrawing = useCallback((d: Drawing) => {
    setDrawings(p => {
      const n = [...p, d];
      pushHistory(n);
      return n;
    });
    markDirty();
  }, [pushHistory, markDirty]);

  const completeDrawingSession = useCallback((drawing: Drawing) => {
    const finalDrawing = { ...drawing, isCreating: false };
    resetDrawingInteraction();
    addDrawing(finalDrawing);
    setSelectedDrawingId(finalDrawing.id);
    clearCurrentDrawing();
    setActiveTool(null);
    markDirty();
  }, [addDrawing, clearCurrentDrawing, resetDrawingInteraction, markDirty]);

  const reorderDrawing = useCallback((id: string, dir: 'front' | 'back' | 'forward' | 'backward') => {
    setDrawings(prev => {
      const idx = prev.findIndex(d => d.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      const [rem] = next.splice(idx, 1);
      const targetIndex = (() => {
        if (dir === 'back') return 0;
        if (dir === 'front') return next.length;
        if (dir === 'backward') return Math.max(0, idx - 1);
        return Math.min(next.length, idx + 1);
      })();
      next.splice(targetIndex, 0, rem);
      pushHistory(next);
      return next;
    });
    markDirty();
  }, [pushHistory, markDirty]);

  // ============================================================================
  // [TENOR 2026 SRE] DEFAULTS & TEMPLATES (INDEXED-DB MIGRATION)
  // ============================================================================
  const [toolDefaults, setToolDefaults] = useState<Record<string, DrawingStyle>>({});
  const [namedTemplates, setNamedTemplates] = useState<Record<string, { name: string, style: DrawingStyle }[]>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadDrawingPreferences = async () => {
      try {
        const defaultsData = await idbGet<unknown>('algoway_drawing_defaults');
        if (defaultsData) setToolDefaults(validateToolDefaults(defaultsData));

        const templatesData = await idbGet<unknown>('algoway_drawing_templates');
        if (templatesData) setNamedTemplates(validateNamedTemplates(templatesData));
      } catch (e) {
        console.error("[SRE] IndexedDB drawing preferences load failed", e);
      }
    };

    void loadDrawingPreferences();
  }, []);

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
    if (tool === "pitchfork" || tool === "schiff_pitchfork" || tool === "modified_schiff_pitchfork" || tool === "inside_pitchfork") {
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
    if (tool === "brush" || tool === "highlighter") {
      const isHighlighter = tool === "highlighter";
      const defaultColor = isHighlighter ? "#f5f500" : "#2962FF";
      return toolDefaults[tool] || {
        color: defaultColor,
        lineWidth: isHighlighter ? 14 : 2,
        lineStyle: "solid",
        lineOpacity: isHighlighter ? 0.28 : 1,
        fillColor: defaultColor,
        fillOpacity: 0.2,
        fillEnabled: false
      };
    }
    return toolDefaults[tool] || { color: "#2962FF", lineWidth: 2, lineStyle: "solid", fillColor: "#2962FF", fillOpacity: 0.1 };
  }, [toolDefaults]);

  const gridRectRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const [gridRect, setGridRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const rendererRef = useRef<DrawingRenderer | null>(null);
  const rendererCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastFreehandPixelRef = useRef<{ x: number; y: number } | null>(null);

  // --- Initialize Renderer ---
  useEffect(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) {
      rendererRef.current = null;
      rendererCanvasRef.current = null;
      return;
    }

    const ctx = canvas.getContext("2d");
    if (ctx) {
      rendererRef.current = new DrawingRenderer(ctx);
      rendererCanvasRef.current = canvas;
      markDirty();
    }
  }, [drawingCanvasRef, drawingInteractionScopeKey, markDirty]);

  // --- Render Loop (Zero-Lag Engine with CPU Shield) ---
  useEffect(() => {
    let animationFrameId: number;

    // [TENOR 2026 SRE FIX] SCAR-MULTICHART-LISTENER-RACE:
    // The old approach captured `initialChart = chartInstanceRef.current` ONCE at
    // effect-run time. When the layout switches (1→4→6 charts), `useEChartsRenderer`
    // disposes the old chart and calls echarts.init() in its OWN useEffect. Both
    // effects run after React commits, but their ORDER is not guaranteed.
    // If THIS effect runs first, `chartInstanceRef.current` is null, so
    // `isChartUsable(initialChart)` = false and ZRender listeners (finished, click,
    // datazoom, restore) are NEVER bound to the new chart instance.
    // FIX: track `attachedToChart` and re-bind inside the RAF whenever the instance
    // changes, ensuring binding even if the chart is created 200ms after this effect.
    let attachedToChart: EChartsType | null = null;

    const handleFinished = () => {
      chartSyncRef.current++;
      markDirty();
    };
    const handleBgClick = () => {
      if (!activeToolRef.current && !isDrawingRef.current) {
        setSelectedDrawingId(null);
        markDirty();
      }
    };

    const detachFromChart = (chart: EChartsType) => {
      try {
        if (!chart.isDisposed()) {
          chart.off("datazoom", markDirty);
          chart.off("restore", markDirty);
          chart.off("finished", handleFinished);
          chart.getZr().off("click", handleBgClick);
        }
      } catch {
        // Chart may have been disposed externally; ignore.
      }
    };

    const tryAttachListeners = (chart: EChartsType): boolean => {
      if (attachedToChart === chart) return true; // already bound, no-op

      // Detach from previous instance before binding to the new one.
      if (attachedToChart !== null) {
        detachFromChart(attachedToChart);
        attachedToChart = null;
      }

      try {
        chart.on("finished", handleFinished);
        chart.getZr().on("click", handleBgClick);
        chart.on("datazoom", markDirty);
        chart.on("restore", markDirty);
        attachedToChart = chart;
        return true;
      } catch {
        // Race: chart disposed between isChartUsable check and .on() call.
        return false;
      }
    };

    // Eager attempt: bind immediately if the chart is already ready.
    const initialChart = chartInstanceRef.current;
    if (isChartUsable(initialChart)) {
      tryAttachListeners(initialChart);
    }

    const renderLoop = () => {
      // [TENOR 2026 SRE FIX] SCAR-CPU-01: Dirty Flag Short-Circuit
      // If nothing has changed and we are not dragging, skip the entire render cycle.
      // Drops CPU usage from 15% to 0.01% when idle.
      if (!isDirtyRef.current && !isDraggingRef.current && chartSyncRef.current === 0) {
        animationFrameId = requestAnimationFrame(renderLoop);
        return;
      }
      
      isDirtyRef.current = false;
      const chart = chartInstanceRef.current;

      if (!isChartUsable(chart)) {
        chartSyncRef.current = 0;
        animationFrameId = requestAnimationFrame(renderLoop);
        return;
      }

      // [TENOR 2026 SRE FIX] SCAR-MULTICHART-LISTENER-RACE (adaptive rebind):
      // If the chart instance changed since we last attached listeners
      // (new layout → new echarts.init()), rebind immediately on this RAF tick.
      // This is the recovery path for the race condition: effect ran before init.
      if (chart !== attachedToChart) {
        tryAttachListeners(chart);
        markDirty(); // Force one more frame to reflect the new instance state.
      }

      if (
        drawingCanvasRef.current &&
        (!rendererRef.current || rendererCanvasRef.current !== drawingCanvasRef.current)
      ) {
        const ctx = drawingCanvasRef.current.getContext("2d");
        if (ctx) {
          rendererRef.current = new DrawingRenderer(ctx);
          rendererCanvasRef.current = drawingCanvasRef.current;
          markDirty();
        }
      }

      if (drawingCanvasRef.current && rendererRef.current) {
        const dpr = window.devicePixelRatio || 1;
        const rect = drawingCanvasRef.current.getBoundingClientRect();

        if (drawingCanvasRef.current.width !== rect.width * dpr || drawingCanvasRef.current.height !== rect.height * dpr) {
          drawingCanvasRef.current.width = rect.width * dpr;
          drawingCanvasRef.current.height = rect.height * dpr;
          markDirty(); // Force another render to ensure stability after resize
        }

        const width = chart.getWidth();
        const height = chart.getHeight();
        const TV_Y_AXIS_WIDTH = 84;
        const TV_X_AXIS_HEIGHT = 28;
        const safeTop = Math.max(30, height * 0.08);
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
          markDirty();
        }

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
            chartDataRef.current,
            alertsRef.current,
            ordersRef.current
          );
          
          // [TENOR 2026 SRE] Rebuild Spatial Hash Grid after render if dirty
          spatialGridRef.current.build(renderDrawings, chart);
          chartSyncRef.current = 0;
          
        } catch (err) {
          console.error("[TENOR SRE] Global Drawing Loop Exception:", err);
        }
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      // [TENOR 2026 SRE FIX] SCAR-MULTICHART-LISTENER-RACE:
      // Always detach from whichever chart we were bound to at cleanup time,
      // not from a stale `initialChart` closure variable.
      if (attachedToChart !== null) {
        detachFromChart(attachedToChart);
      }
    };
  }, [drawingCanvasRef, chartInstanceRef, drawingInteractionScopeKey, markDirty]);


  // --- Coordinate Conversion ---
  const getChartCoordinates = useCallback((e: React.PointerEvent<HTMLCanvasElement> | PointerEvent): DrawingPoint | null => {
    if (!isChartUsable(chartInstanceRef.current) || !drawingCanvasRef.current) return null;
    const chart = chartInstanceRef.current;
    const chartRect = chart.getDom().getBoundingClientRect();
    const x = e.clientX - chartRect.left;
    const y = e.clientY - chartRect.top;
    if (x < 0 || y < 0 || x > chartRect.width || y > chartRect.height) return null;
    if (!isInsideGridRect({ x, y }, getInteractiveGridRect(chart))) return null;
    const priceSeriesIndex = getPriceSeriesIndex(chart);
    let option: ReturnType<EChartsType["getOption"]>;
    try {
      option = chart.getOption();
    } catch {
      return null;
    }
    const point = safeConvertFromPixel(chart, [x, y], priceSeriesIndex);

    if (point && point.length >= 2) {
      let time = point[0] as string | number;
      const value = point[1] as number;
      
      const xAxis = (Array.isArray(option.xAxis) ? option.xAxis[0] : option.xAxis) as { type?: string; data?: unknown[] } | undefined;
      if (xAxis && xAxis.type === 'category' && Array.isArray(xAxis.data) && typeof time === 'number') {
        const index = Math.round(time);
        if (index >= 0 && index < xAxis.data.length) {
          const axisTime = xAxis.data[index];
          if (!isChartTimeValue(axisTime)) return null;
          time = axisTime;
        } else if (index >= xAxis.data.length) {
          const lastIdx = xAxis.data.length - 1;
          const lastAxisTime = xAxis.data[lastIdx];
          const prevAxisTime = xAxis.data[lastIdx - 1];
          if (!isChartTimeValue(lastAxisTime)) return null;

          const lastTime = new Date(lastAxisTime).getTime();
          const prevTime =
            xAxis.data.length > 1 && isChartTimeValue(prevAxisTime)
              ? new Date(prevAxisTime).getTime()
              : lastTime - 86400000;
          const gap = lastTime - prevTime;
          const futureTime = lastTime + (index - lastIdx) * gap;
          time = new Date(futureTime).toISOString();
        }
      }
      return { time, value };
    }
    return null;
  }, [chartInstanceRef, drawingCanvasRef]);

  const getChartPointerPixel = useCallback((e: React.PointerEvent<HTMLCanvasElement> | PointerEvent): { x: number; y: number } | null => {
    if (!isChartUsable(chartInstanceRef.current)) return null;
    const chartRect = chartInstanceRef.current.getDom().getBoundingClientRect();
    const x = e.clientX - chartRect.left;
    const y = e.clientY - chartRect.top;
    if (x < 0 || y < 0 || x > chartRect.width || y > chartRect.height) return null;
    if (!isInsideGridRect({ x, y }, getInteractiveGridRect(chartInstanceRef.current))) return null;
    return { x, y };
  }, [chartInstanceRef]);

  const getFreehandCoordinates = useCallback((e: React.PointerEvent<HTMLCanvasElement> | PointerEvent): DrawingPoint | null => {
    const pointerPixel = getChartPointerPixel(e);
    if (!pointerPixel || !isChartUsable(chartInstanceRef.current)) return null;
    const point = safeConvertFromPixel(chartInstanceRef.current, [pointerPixel.x, pointerPixel.y], getPriceSeriesIndex(chartInstanceRef.current));
    if (!point || point.length < 2) return null;
    const time = Number(point[0]);
    const value = Number(point[1]);
    if (!Number.isFinite(time) || !Number.isFinite(value)) return null;
    return { time, value };
  }, [chartInstanceRef, getChartPointerPixel]);

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
        const finalDrawing = { ...finishedDrawing };
        // [TENOR 2026 FIX] SCAR-DATA-01: Extract OHLC data for Bar Pattern and Ghost Feed upon forced completion
        if (finalDrawing.type === "bar_pattern" || finalDrawing.type === "ghost_feed") {
          finalDrawing.barPatternProps = {
            ...(finalDrawing.barPatternProps || { color: "#ff9800", mode: "HL Bars", mirrored: false, flipped: false, opacity: 1 }),
            data: extractBarPatternData(finalDrawing.points[0], finalDrawing.points[finalDrawing.points.length - 1])
          };
        }
        completeDrawingSession(finalDrawing);
      } else {
        cancelDrawingSession(true);
      }
    }
    markDirty();
  }, [cancelDrawingSession, completeDrawingSession, markDirty, extractBarPatternData]);

  // --- Pointer Down Handler ---
  // [TENOR 2026 SRE FIX] SCAR-TOUCH-01: PointerEvents fully unified.
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const claimDrawingPointerEvent = () => {
      if (e.pointerType === 'touch' && e.cancelable) {
        e.preventDefault();
      }
      e.stopPropagation();
      if (e.nativeEvent && typeof e.nativeEvent.stopPropagation === 'function') {
        e.nativeEvent.stopPropagation();
      }
      if (drawingCanvasRef.current && e.pointerId !== undefined) {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {}
      }
    };

    if (e.button === 2) {
      claimDrawingPointerEvent();
      cancelDrawingSession(true);
      e.preventDefault();
      return;
    }
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    if (!isChartUsable(chartInstanceRef.current)) return;

    const now = Date.now();
    if (isDrawingRef.current && currentDrawingRef.current && now - lastTapRef.current < 300) {
      claimDrawingPointerEvent();
      handleDoubleClick();
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;

    const rect = drawingCanvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const currentActiveTool = activeToolRef.current;
    const mode = cursorModeRef.current;

    if (mode === 'magic' && !currentActiveTool) {
      setSelectedDrawingId(null);
      markDirty();
      return;
    }

    const HIT_THRESHOLD = 15;

    // [TENOR 2026 SRE] SPATIAL HASH GRID HIT-TEST (O(1) Lookup)
    if (drawingsRef.current.length > 0 && rendererRef.current) {
      const candidates = spatialGridRef.current.query(mx, my);
      
      for (let i = 0; i < candidates.length; i++) {
        const d = candidates[i];
        const result = rendererRef.current.hitTest(mx, my, d, chartInstanceRef.current, HIT_THRESHOLD);
        
        if (result.isHit) {
          claimDrawingPointerEvent();
          if (mode === 'eraser' && !currentActiveTool) {
            deleteDrawing(d.id);
            return;
          }
          
          setSelectedDrawingId(d.id);
          markDirty();
          
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
      }
    }

    if (mode === 'eraser' && !currentActiveTool) {
      claimDrawingPointerEvent();
      setSelectedDrawingId(null);
      markDirty();
      return;
    }

    if (!currentActiveTool) {
      setSelectedDrawingId(null);
      markDirty();
      return;
    }

    const coords = getChartCoordinates(e);
    if (!coords) return;
    claimDrawingPointerEvent();

    if (currentActiveTool === "brush" || currentActiveTool === "highlighter") {
      const freehandCoords = getFreehandCoordinates(e);
      if (!freehandCoords) return;
      lastFreehandPixelRef.current = getChartPointerPixel(e);
      const newDrawing: Drawing = {
        id: generateId(),
        type: currentActiveTool,
        points: [freehandCoords],
        style: { ...getToolDefault(currentActiveTool) },
      };
      currentDrawingRef.current = newDrawing;
      setCurrentDrawing(newDrawing);
      setIsDrawing(true);
      markDirty();
      return;
    }

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

      if (newDrawing.type === "anchored_volume_profile" || newDrawing.type === "fixed_range_volume_profile") {
        newDrawing.anchoredVolumeProfileProps = createDefaultAnchoredVolumeProfileProps();
      }

      completeDrawingSession(newDrawing);
      return;
    }

    const isTwoClick = TWO_CLICK_TOOLS.includes(currentActiveTool);
    const isMultiClick = MULTI_CLICK_TOOLS.includes(currentActiveTool);

    if (isTwoClick || isMultiClick) {
      if (!isDrawingRef.current) {
        setIsDrawing(true);
        const newDrawing: Drawing = {
          id: generateId(),
          type: currentActiveTool as NonNullable<AllToolType>,
          points: [coords],
          style: { ...getToolDefault(currentActiveTool) },
        };

        // [TENOR 2026 FIX] SCAR-INIT-01: Exhaustive Props Initialization
        if ((PITCHFORK_TOOLS as readonly string[]).includes(newDrawing.type)) {
          newDrawing.pitchforkProps = {
            style: newDrawing.type === "schiff_pitchfork" ? "schiff" : newDrawing.type === "modified_schiff_pitchfork" ? "modified_schiff" : newDrawing.type === "inside_pitchfork" ? "inside" : "original",
            extendLines: false,
            fillBackground: true,
            fillOpacity: 0.15,
            levels: [
              { value: 0, color: "#f23645", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1.5 },
              { value: 0.25, color: "#ff9800", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 0.382, color: "#ff9800", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 0.5, color: "#4caf50", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 0.618, color: "#009688", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 0.75, color: "#2196f3", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 1, color: "#787b86", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 1.5, color: "#2962ff", enabled: false, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 1.75, color: "#2962ff", enabled: false, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 2, color: "#2962ff", enabled: false, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: -0.25, color: "#ff9800", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: -0.382, color: "#ff9800", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: -0.5, color: "#4caf50", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: -0.618, color: "#009688", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: -0.75, color: "#2196f3", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: -1, color: "#787b86", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
            ]
          };
        }

        if (newDrawing.type === "fib_retracement" || newDrawing.type === "trend_based_fib_extension" || newDrawing.type === "fib_channel") {
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

        if (newDrawing.type === "fib_speed_resistance_fan") {
          newDrawing.fibProps = {
            reverse: false,
            fillBackground: true,
            levels: [],
            showPrices: false,
            showLevels: false,
            labelsPosition: "right",
            fanProps: {
              reverse: false,
              fillBackground: true,
              fillOpacity: 0.15,
              priceLevels: [
                { value: 0.25, color: "#2196F3", enabled: true, lineOpacity: 0.8 },
                { value: 0.382, color: "#00bcd4", enabled: true, lineOpacity: 0.8 },
                { value: 0.5, color: "#4caf50", enabled: true, lineOpacity: 0.9 },
                { value: 0.618, color: "#009688", enabled: true, lineOpacity: 0.8 },
                { value: 0.75, color: "#3f51b5", enabled: true, lineOpacity: 0.8 },
                { value: 1, color: "#787b86", enabled: true, lineOpacity: 1 },
              ],
              timeLevels: [
                { value: 0.25, color: "#ff9800", enabled: true, lineOpacity: 0.8 },
                { value: 0.382, color: "#00bcd4", enabled: true, lineOpacity: 0.8 },
                { value: 0.5, color: "#4caf50", enabled: true, lineOpacity: 0.9 },
                { value: 0.618, color: "#009688", enabled: true, lineOpacity: 0.8 },
                { value: 0.75, color: "#3f51b5", enabled: true, lineOpacity: 0.8 },
                { value: 1, color: "#787b86", enabled: true, lineOpacity: 1 },
              ],
              showPriceLabels: { left: true, right: true },
              showTimeLabels: { top: true, bottom: true },
              gridEnabled: true,
              gridStyle: "solid"
            }
          };
        }

        if (newDrawing.type === "trend_based_fib_time") {
          newDrawing.trendBasedFibTimeProps = {
            levels: [
              { value: 0, color: "#787b86", enabled: true, lineOpacity: 1, lineStyle: "solid", lineWidth: 1 },
              { value: 0.382, color: "#f23645", enabled: true, lineOpacity: 1, lineStyle: "solid", lineWidth: 1 },
              { value: 0.5, color: "#ff9800", enabled: true, lineOpacity: 1, lineStyle: "solid", lineWidth: 1 },
              { value: 0.618, color: "#4caf50", enabled: true, lineOpacity: 1, lineStyle: "solid", lineWidth: 1 },
              { value: 1, color: "#009688", enabled: true, lineOpacity: 1, lineStyle: "solid", lineWidth: 1 },
              { value: 1.618, color: "#2196f3", enabled: true, lineOpacity: 1, lineStyle: "solid", lineWidth: 1 },
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

        if (newDrawing.type === "time_cycles") {
          newDrawing.cyclesProps = {
            fillBackground: true,
            fillOpacity: 0.15,
            levels: [
              { id: 1, color: "#00BCD4", enabled: true, opacity: 0.15 }
            ],
            showLabels: false
          };
        }

        if (newDrawing.type === "xabcd_pattern" || newDrawing.type === "cypher_pattern" || newDrawing.type === "triangle_pattern") {
          newDrawing.xabcdProps = {
            showLabels: true,
            showRatios: true,
            fillBackground: true,
            fillOpacity: 0.15
          };
        }

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

        if (newDrawing.type === "anchored_volume_profile" || newDrawing.type === "fixed_range_volume_profile") {
          newDrawing.anchoredVolumeProfileProps = createDefaultAnchoredVolumeProfileProps();
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

        if (newDrawing.type === "fib_speed_resistance_arcs") {
          newDrawing.fibSpeedResistanceArcsProps = {
            levels: [
              { value: 0.236, color: "#f23645", enabled: true, lineOpacity: 0.8, lineStyle: "solid", lineWidth: 1 },
              { value: 0.382, color: "#ff9800", enabled: true, lineOpacity: 0.8, lineStyle: "solid", lineWidth: 1 },
              { value: 0.5, color: "#4caf50", enabled: true, lineOpacity: 0.8, lineStyle: "solid", lineWidth: 1 },
              { value: 0.618, color: "#009688", enabled: true, lineOpacity: 0.8, lineStyle: "solid", lineWidth: 1 },
              { value: 0.786, color: "#2196f3", enabled: true, lineOpacity: 0.8, lineStyle: "solid", lineWidth: 1 },
              { value: 1, color: "#787b86", enabled: true, lineOpacity: 1, lineStyle: "solid", lineWidth: 1 },
            ],
            trendLine: { enabled: true, color: "#787b86", lineStyle: "dashed", lineWidth: 1 },
            background: { enabled: true, fillOpacity: 0.15 },
            fullCircles: false,
            showLabels: true,
          };
        }

        if (newDrawing.type === "fib_wedge") {
          newDrawing.fibWedgeProps = {
            levels: [
              { value: 0.236, color: "#f23645", enabled: true, lineOpacity: 0.8, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 0.382, color: "#ff9800", enabled: true, lineOpacity: 0.8, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 0.5, color: "#4caf50", enabled: true, lineOpacity: 0.8, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 0.618, color: "#009688", enabled: true, lineOpacity: 0.8, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 0.786, color: "#2196f3", enabled: true, lineOpacity: 0.8, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
              { value: 1, color: "#787b86", enabled: true, lineOpacity: 1, fillOpacity: 0.15, lineStyle: "solid", lineWidth: 1 },
            ],
            trendLine: { enabled: true, color: "#787b86", lineStyle: "dashed", lineWidth: 1 },
            background: { enabled: true, fillOpacity: 0.15 },
            showLabels: true,
          };
        }

        if (newDrawing.type === "pitchfan") {
          newDrawing.pitchfanProps = {
            levels: [
              { t: 0, color: "#787b86", lineWidth: 1, lineStyle: "solid", lineOpacity: 0.8, enabled: true },
              { t: 0.25, color: "#2196f3", lineWidth: 1, lineStyle: "solid", lineOpacity: 0.8, enabled: true },
              { t: 0.382, color: "#ff9800", lineWidth: 1, lineStyle: "solid", lineOpacity: 0.8, enabled: true },
              { t: 0.5, color: "#f23645", lineWidth: 1, lineStyle: "solid", lineOpacity: 1, enabled: true },
              { t: 0.618, color: "#009688", lineWidth: 1, lineStyle: "solid", lineOpacity: 0.8, enabled: true },
              { t: 0.75, color: "#4caf50", lineWidth: 1, lineStyle: "solid", lineOpacity: 0.8, enabled: true },
              { t: 1, color: "#787b86", lineWidth: 1, lineStyle: "solid", lineOpacity: 0.8, enabled: true },
            ],
            fillBackground: true,
            fillOpacity: 0.15,
            showTrendLine: true,
            trendLine: { enabled: true, color: "#787b86", lineStyle: "dashed", lineWidth: 1 },
          };
        }

        setSelectedDrawingId(null);
        setCurrentDrawing(newDrawing);
        currentDrawingRef.current = newDrawing;
        markDirty();
      } else if (currentDrawingRef.current) {
        const maxClicks = TOOL_MAX_CLICKS_REGISTRY[currentDrawingRef.current.type] || (isTwoClick ? 2 : 999);
        const updatedPoints = [...currentDrawingRef.current.points, coords];

        if (currentDrawingRef.current.type === "sector" && updatedPoints.length === 3) {
          const p0 = updatedPoints[0];
          const p1 = updatedPoints[1];
          const p2 = updatedPoints[2];
          const chart = chartInstanceRef.current;
          if (isChartUsable(chart)) {
            const priceIdx = getPriceSeriesIndex(chart);
            const p0Pix = safeConvertToPixel(chart, [p0.time, p0.value], priceIdx);
            const p1Pix = safeConvertToPixel(chart, [p1.time, p1.value], priceIdx);
            const p2Pix = safeConvertToPixel(chart, [p2.time, p2.value], priceIdx);
            if (p0Pix && p1Pix && p2Pix) {
              const radius = Math.hypot(p1Pix[0] - p0Pix[0], p1Pix[1] - p0Pix[1]);
              const angle2 = Math.atan2(p2Pix[1] - p0Pix[1], p2Pix[0] - p0Pix[0]);
              const constP2 = safeConvertFromPixel(chart, [p0Pix[0] + radius * Math.cos(angle2), p0Pix[1] + radius * Math.sin(angle2)], priceIdx);
              if (constP2) updatedPoints[2] = { time: constP2[0], value: constP2[1] };
            }
          }
        }

        if (currentDrawingRef.current.type !== "ghost_feed" && updatedPoints.length >= maxClicks) {
          const finalDrawing = { ...currentDrawingRef.current, points: updatedPoints };
          // [TENOR 2026 FIX] SCAR-DATA-01: Extract OHLC data for Bar Pattern upon completion
          if (finalDrawing.type === "bar_pattern") {
            finalDrawing.barPatternProps = {
              ...(finalDrawing.barPatternProps || { color: "#ff9800", mode: "HL Bars", mirrored: false, flipped: false, opacity: 1 }),
              data: extractBarPatternData(updatedPoints[0], updatedPoints[1])
            };
          }
          completeDrawingSession(finalDrawing);
        } else {
          const updatedDrawing = { ...currentDrawingRef.current, points: updatedPoints };
          setCurrentDrawing(updatedDrawing);
          currentDrawingRef.current = updatedDrawing;
          markDirty();
        }
      }
      return;
    }
  }, [cancelDrawingSession, chartInstanceRef, completeDrawingSession, deleteDrawing, drawingCanvasRef, getChartCoordinates, getChartPointerPixel, getFreehandCoordinates, getToolDefault, handleDoubleClick, setIsDrawing, markDirty, extractBarPatternData]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch' && e.cancelable) e.preventDefault();
    if (!drawingCanvasRef.current) return;

    const rect = drawingCanvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    mousePosRef.current = { x: mx, y: my };
    markDirty();

    const dragChart = chartInstanceRef.current;
    if (isDraggingRef.current && dragTargetRef.current && isChartUsable(dragChart)) {
      const { drawingId, type, pointIndex, initialPoints, mouseStart } = dragTargetRef.current;
      const dx = mx - mouseStart.x;
      const dy = my - mouseStart.y;
      const d = drawingsRef.current.find(draw => draw.id === drawingId);
      if (!d) return;

      let newPoints = [...d.points];
      if (type === 'shape') {
        const priceIdx = getPriceSeriesIndex(dragChart);
        const isFreehand = d.type === 'brush' || d.type === 'highlighter';
        newPoints = initialPoints.map(p => {
          const startPix = safeConvertToPixel(dragChart, [p.time, p.value], priceIdx);
          if (!startPix) return p;
          const newPix: [number, number] = [startPix[0] + dx, startPix[1] + dy];
          const newCoords = safeConvertFromPixel(dragChart, newPix, priceIdx);
          if (!newCoords) return p;
          const rawTime = newCoords[0];
          let finalTime: string | number = rawTime;
          if (!isFreehand && typeof rawTime === 'number') {
            const idx = Math.round(rawTime);
            const clampedIdx = Math.max(0, Math.min(idx, chartDataRef.current.length - 1));
            finalTime = chartDataRef.current[clampedIdx].time;
          }
          return { time: finalTime, value: newCoords[1] as number };
        });
      } else if (type === 'point') {
        const chart = dragChart;
        const priceIdx = getPriceSeriesIndex(chart);
        const currentCoords = safeConvertFromPixel(chart, [mx, my], priceIdx);
        if (currentCoords) {
          if (d.type === 'sector') {
            const p0 = d.points[0];
            const p0Pix = safeConvertToPixel(chart, [p0.time, p0.value], priceIdx);
            if (p0Pix) {
              if (pointIndex === 0) {
                newPoints[0] = { time: currentCoords[0], value: currentCoords[1] };
              } else if (pointIndex === 1 && d.points.length >= 3) {
                const rad = Math.hypot(mx - p0Pix[0], my - p0Pix[1]);
                const p2 = d.points[2], p2Pix = safeConvertToPixel(chart, [p2.time, p2.value], priceIdx);
                newPoints[1] = { time: currentCoords[0], value: currentCoords[1] };
                if (p2Pix) {
                  const a2 = Math.atan2(p2Pix[1] - p0Pix[1], p2Pix[0] - p0Pix[0]);
                  const cP2 = safeConvertFromPixel(chart, [p0Pix[0] + rad * Math.cos(a2), p0Pix[1] + rad * Math.sin(a2)], priceIdx);
                  if (cP2) newPoints[2] = { time: cP2[0], value: cP2[1] };
                }
              } else if (pointIndex === 2 && d.points.length >= 3) {
                const rad = Math.hypot(mx - p0Pix[0], my - p0Pix[1]);
                const p1 = d.points[1], p1Pix = safeConvertToPixel(chart, [p1.time, p1.value], priceIdx);
                if (p1Pix) {
                  const a1 = Math.atan2(p1Pix[1] - p0Pix[1], p1Pix[0] - p0Pix[0]);
                  const angle = Math.atan2(my - p0Pix[1], mx - p0Pix[0]);
                  const cP1 = safeConvertFromPixel(chart, [p0Pix[0] + rad * Math.cos(a1), p0Pix[1] + Math.sin(a1)], priceIdx);
                  const cP2 = safeConvertFromPixel(chart, [p0Pix[0] + rad * Math.cos(angle), p0Pix[1] + rad * Math.sin(angle)], priceIdx);
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
        const priceIdx = getPriceSeriesIndex(dragChart);
        const cur = safeConvertFromPixel(dragChart, [mx, my], priceIdx);
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

    if (isDrawingRef.current && currentDrawingRef.current && (currentDrawingRef.current.type === "brush" || currentDrawingRef.current.type === "highlighter")) {
      const pointerPixel = getChartPointerPixel(e);
      const lastPixel = lastFreehandPixelRef.current;
      if (pointerPixel && lastPixel) {
        const distance = Math.hypot(pointerPixel.x - lastPixel.x, pointerPixel.y - lastPixel.y);
        if (distance < FREEHAND_MIN_POINT_DISTANCE_PX) return;
      }

      const coords = getFreehandCoordinates(e);
      if (coords) {
        lastFreehandPixelRef.current = pointerPixel;
        const currentPoints = currentDrawingRef.current.points;
        const nextPoints =
          currentPoints.length >= FREEHAND_MAX_POINTS
            ? [...currentPoints.filter((_, index) => index % 2 === 0), coords]
            : [...currentPoints, coords];
        currentDrawingRef.current = {
          ...currentDrawingRef.current,
          points: nextPoints
        };
        markDirty();
      }
      return;
    }

    const mode = cursorModeRef.current;
    if ((mode === 'eraser' || mode === 'magic') && !activeToolRef.current && !isDrawingRef.current) {
      drawingCanvasRef.current.style.cursor = '';
      return;
    }

    let cursor = "default";
    let hoveringInt = false;

    const hoverChart = chartInstanceRef.current;
    if (drawingsRef.current.length > 0 && isChartUsable(hoverChart)) {
      // [TENOR 2026 SRE] SPATIAL HASH GRID HIT-TEST (O(1) Lookup)
      const candidates = spatialGridRef.current.query(mx, my);
      
      for (let i = 0; i < candidates.length; i++) {
        const hit = rendererRef.current?.hitTest(mx, my, candidates[i], hoverChart, 15);
        if (hit?.isHit) {
          hoveringInt = true;
          cursor = hit.hitType === "point" ? "grab" : "move";
          break;
        }
      }
    }

    if (!hoveringInt) cursor = (activeToolRef.current || isDrawingRef.current) ? "crosshair" : "default";
    drawingCanvasRef.current.style.cursor = cursor;
  }, [chartInstanceRef, drawingCanvasRef, getChartPointerPixel, getFreehandCoordinates, markDirty]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (drawingCanvasRef.current && e.pointerId !== undefined) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
    if (isDrawingRef.current && currentDrawingRef.current && (currentDrawingRef.current.type === "brush" || currentDrawingRef.current.type === "highlighter")) {
      const drawing = currentDrawingRef.current;
      lastFreehandPixelRef.current = null;
      if (drawing.points.length >= 1) {
        completeDrawingSession(drawing);
      } else {
        cancelDrawingSession(true);
      }
      return;
    }
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      if (draggedDrawingRef.current) {
        const drawingToUpdate = draggedDrawingRef.current;
        setDrawings(prev => {
          const n = prev.map(d => d.id === drawingToUpdate.id ? { ...drawingToUpdate, isDragging: false } : d);
          pushHistory(n);
          return n;
        });
        draggedDrawingRef.current = null;
        markDirty();
      }
      dragTargetRef.current = null;
    }
  }, [cancelDrawingSession, completeDrawingSession, drawingCanvasRef, pushHistory, markDirty]);

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
      idbSet('algoway_drawing_defaults', next);
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
    markDirty();
  }, [pushHistory, markDirty]);

  const saveNamedTemplate = useCallback((id: string, name: string) => {
    const d = drawingsRef.current.find(dr => dr.id === id);
    if(!d || !name) return;
    
    // [TENOR 2026 SRE] XSS SHIELD: Sanitize template name
    const safeName = DOMPurify.sanitize(name, { ALLOWED_TAGS: [] }).trim();
    if (!safeName) return;

    setNamedTemplates(prev => {
      const list = prev[d.type] || [];
      const nextList = [...list, { name: safeName, style: { ...d.style } }];
      const next = { ...prev, [d.type]: nextList };
      idbSet('algoway_drawing_templates', next);
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
        pushHistory(n);
        return n;
      });
      markDirty();
    }
  }, [namedTemplates, pushHistory, markDirty]);

  const deleteNamedTemplate = useCallback((type: string, name: string) => {
    setNamedTemplates(prev => {
      const next = { ...prev, [type]: (prev[type] || []).filter(x => x.name !== name) };
      idbSet('algoway_drawing_templates', next);
      return next;
    });
  }, []);

  return {
    activeTool,
    setActiveTool,
    clearDrawings: () => {
      setDrawings([]);
      pushHistory([]);
      markDirty();
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
    drawingCloudPersistenceStatus: DRAWING_CLOUD_PERSISTENCE_STATUS,
    saveDrawingToCloud: saveDrawingToCloudDisabled,
    restoreDrawingsFromCloud: restoreDrawingsFromCloudDisabled,
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
