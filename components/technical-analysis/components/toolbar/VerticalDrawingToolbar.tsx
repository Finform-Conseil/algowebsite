"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createPortal } from "react-dom";
import clsx from "clsx";

import {
  selectUiState,
  setCursorMode,
  toggleLockedAll,
  toggleAreDrawingsHidden
} from "../../store/technicalAnalysisSlice";
import { useFloatingMenu } from "../../hooks/useFloatingMenu";
import { DRAWING_TOOLS_CONFIG } from "../../config/DrawingToolsConfig";
import {
  TOOL_CATEGORIES,
  FIB_TOOLS_SET,
  TREND_TOOL_CATEGORIES
} from "../../config/TechnicalAnalysisConstants";
import { AllToolType, CursorModeType } from "../../config/TechnicalAnalysisTypes";
import { ToolPortal } from "../common/ToolPortal";
import {
  TrendCategoryIcon,
  FibCategoryIcon,
  PatternsCategoryIcon,
  ForecastingCategoryIcon,
  HorizontalLineIcon,
} from "../common/ToolIcons";
import s from "../../style.module.css";

// --- CONSTANTS ---
const ACTIVE_BLUE = "#2962ff";
const ACTIVE_BG = "rgba(41, 98, 255, 0.1)";
const varAccentGold = "#ff9f04";

// --- HELPERS ---
const getActiveOptionStyle = (isActive: boolean): React.CSSProperties => ({
  color: isActive ? ACTIVE_BLUE : "inherit",
  backgroundColor: isActive ? ACTIVE_BG : "transparent",
});

const cloneIconWithActiveState = (
  icon: React.ReactNode,
  isActive: boolean,
): React.ReactNode => {
  if (!React.isValidElement(icon)) return icon;
  const activeColor = isActive ? ACTIVE_BLUE : "inherit";

  if (icon.type === "i") {
    return React.cloneElement(
      icon as React.ReactElement<{ style?: React.CSSProperties; className?: string; }>,
      { style: { ...(icon.props as { style?: React.CSSProperties }).style, color: activeColor } },
    );
  }
  if (icon.type === "svg") {
    return React.cloneElement(
      icon as React.ReactElement<{ style?: React.CSSProperties }>,
      { style: { ...(icon.props as { style?: React.CSSProperties }).style, color: activeColor } },
    );
  }
  return React.cloneElement(
    icon as React.ReactElement<{ style?: React.CSSProperties }>,
    { style: { ...(icon.props as { style?: React.CSSProperties }).style, color: activeColor } },
  );
};

interface VerticalDrawingToolbarProps {
  activeTool: AllToolType | null;
  setActiveTool: (tool: AllToolType | null) => void;
  mainContainerRef: React.RefObject<HTMLDivElement>;
  verticalToolbarRef?: React.RefObject<HTMLDivElement | null>;
  handleClearAllDrawings: () => void;
}

type ToolCategoryMemory = {
  trend: AllToolType | null;
  fib: AllToolType | null;
  chartPatterns: AllToolType | null;
  forecasting: AllToolType | null;
};

export const VerticalDrawingToolbar: React.FC<VerticalDrawingToolbarProps> = ({
  activeTool,
  setActiveTool,
  mainContainerRef,
  verticalToolbarRef,
  handleClearAllDrawings
}) => {
  const dispatch = useDispatch();
  const uiState = useSelector(selectUiState);
  const cursorDropdownRef = useRef<HTMLButtonElement>(null);

  // --- FLOATING MENUS ---
  const {
    isOpen: isTrendDropdownOpen,
    setIsOpen: setIsTrendDropdownOpen,
    pos: trendDropdownPos,
    anchorRef: trendDropdownRef,
    toggle: toggleTrendMenu,
  } = useFloatingMenu(mainContainerRef);

  const {
    isOpen: isFibDropdownOpen,
    setIsOpen: setIsFibDropdownOpen,
    pos: fibDropdownPos,
    anchorRef: fibDropdownRef,
    toggle: toggleFibMenu,
  } = useFloatingMenu(mainContainerRef);

  const [trendSearchQuery, setTrendSearchQuery] = useState("");
  const [trendDropdownView, setTrendDropdownView] = useState<"categories" | "drawing_tools" | "channels" | "pitchforks">("categories");

  const [fibSearchQuery, setFibSearchQuery] = useState("");
  const [fibDropdownView, setFibDropdownView] = useState<"categories" | "fibonacci" | "gann">("categories");

  const {
    isOpen: isChartPatternsDropdownOpen,
    setIsOpen: setIsChartPatternsDropdownOpen,
    pos: chartPatternsDropdownPos,
    anchorRef: chartPatternsDropdownRef,
    toggle: toggleChartPatternsMenu,
  } = useFloatingMenu(mainContainerRef);

  const [chartPatternsSearchQuery, setChartPatternsSearchQuery] = useState("");
  const [chartPatternsDropdownView, setChartPatternsDropdownView] = useState<"categories" | "patterns" | "elliott" | "cycles">("categories");

  const {
    isOpen: isForecastingDropdownOpen,
    setIsOpen: setIsForecastingDropdownOpen,
    pos: forecastingDropdownPos,
    anchorRef: forecastingDropdownRef,
    toggle: toggleForecastingMenu,
  } = useFloatingMenu(mainContainerRef);

  const [forecastingSearchQuery, setForecastingSearchQuery] = useState("");
  const [forecastingDropdownView, setForecastingDropdownView] = useState<"categories" | "forecasting" | "volume">("categories");
  const [lastSelectedToolByCategory, setLastSelectedToolByCategory] = useState<ToolCategoryMemory>({
    trend: null,
    fib: null,
    chartPatterns: null,
    forecasting: null,
  });

  const [isCursorDropdownOpen, setIsCursorDropdownOpen] = useState(false);
  const [cursorDropdownPos, setCursorDropdownPos] = useState({ top: 0, left: 0 });

  const getToolMemoryBucket = useCallback((toolId: AllToolType): keyof ToolCategoryMemory | null => {
    if (!toolId) return null;

    const tool = DRAWING_TOOLS_CONFIG.find((item) => item.id === toolId);
    if (!tool) return null;

    if (FIB_TOOLS_SET.has(toolId)) return "fib";
    if ((TREND_TOOL_CATEGORIES as readonly string[]).includes(tool.category)) return "trend";
    if (
      tool.category === TOOL_CATEGORIES.CHART_PATTERNS ||
      tool.category === TOOL_CATEGORIES.ELLIOTT_WAVES ||
      tool.category === TOOL_CATEGORIES.CYCLES
    ) {
      return "chartPatterns";
    }
    if (tool.category === TOOL_CATEGORIES.FORECASTING || tool.category === TOOL_CATEGORIES.VOLUME_BASED) {
      return "forecasting";
    }

    return null;
  }, []);

  const activeToolCategory = useMemo(() => {
    if (!activeTool) return "";
    return DRAWING_TOOLS_CONFIG.find((t) => t.id === activeTool)?.category || "";
  }, [activeTool]);

  const isTrendToolActive = useMemo(() => {
    if (!activeTool) return false;
    if (FIB_TOOLS_SET.has(activeTool)) return false;
    return (TREND_TOOL_CATEGORIES as readonly string[]).includes(activeToolCategory);
  }, [activeTool, activeToolCategory]);

  const isFibToolActive = useMemo(() => {
    return activeTool ? FIB_TOOLS_SET.has(activeTool) : false;
  }, [activeTool]);

  const isChartPatternsToolActive = useMemo(() => {
    return (
      activeToolCategory === TOOL_CATEGORIES.CHART_PATTERNS ||
      activeToolCategory === TOOL_CATEGORIES.ELLIOTT_WAVES ||
      activeToolCategory === TOOL_CATEGORIES.CYCLES
    );
  }, [activeToolCategory]);

  const isForecastingToolActive = useMemo(() => {
    if (!activeTool) return false;
    return DRAWING_TOOLS_CONFIG.some((t) => t.id === activeTool && (t.category === TOOL_CATEGORIES.FORECASTING || t.category === TOOL_CATEGORIES.VOLUME_BASED));
  }, [activeTool]);

  const isCursorActive = isCursorDropdownOpen || (activeTool === null && !isTrendDropdownOpen && !isFibDropdownOpen && !isChartPatternsDropdownOpen && !isForecastingDropdownOpen && !isTrendToolActive && !isFibToolActive && !isChartPatternsToolActive && !isForecastingToolActive);

  // [TENOR 2026] Tool memory is now handled strictly via event handlers (handleSelectDrawingTool)
  // to prevent cascading renders and satisfy react-hooks/exhaustive-deps logic.


  // [TENOR 2026] Dynamic Tool Counts to prevent obsolete hardcoded values
  const drawingCounts = useMemo(() => ({
    lines: DRAWING_TOOLS_CONFIG.filter(t => t.category === TOOL_CATEGORIES.LINES_MEASURES).length,
    channels: DRAWING_TOOLS_CONFIG.filter(t => t.category === TOOL_CATEGORIES.CHANNELS).length,
    pitchforks: DRAWING_TOOLS_CONFIG.filter(t => t.category === TOOL_CATEGORIES.PITCHFORKS).length,
    fibonacci: DRAWING_TOOLS_CONFIG.filter(t => (t.category === TOOL_CATEGORIES.FIBONACCI || t.category === TOOL_CATEGORIES.PITCHFORKS) && !t.id.includes("gann") && !FIB_TOOLS_SET.has(t.id)).length, // Correction logic for Fib/Gann counts
    fibPure: DRAWING_TOOLS_CONFIG.filter(t => t.category === TOOL_CATEGORIES.FIBONACCI && !t.id.includes("gann")).length,
    gann: DRAWING_TOOLS_CONFIG.filter(t => t.id.includes("gann")).length,
    patterns: DRAWING_TOOLS_CONFIG.filter(t => t.category === TOOL_CATEGORIES.CHART_PATTERNS).length,
    elliott: DRAWING_TOOLS_CONFIG.filter(t => t.category === TOOL_CATEGORIES.ELLIOTT_WAVES).length,
    cycles: DRAWING_TOOLS_CONFIG.filter(t => t.category === TOOL_CATEGORIES.CYCLES).length,
    forecasting: DRAWING_TOOLS_CONFIG.filter(t => t.category === TOOL_CATEGORIES.FORECASTING).length,
    volume: DRAWING_TOOLS_CONFIG.filter(t => t.category === TOOL_CATEGORIES.VOLUME_BASED).length,
  }), []);

  const filteredTools = useMemo(() => {
    if (!trendSearchQuery.trim()) {
      return DRAWING_TOOLS_CONFIG.filter((t) => (TREND_TOOL_CATEGORIES as readonly string[]).includes(t.category));
    }
    const query = trendSearchQuery.toLowerCase();
    return DRAWING_TOOLS_CONFIG.filter(
      (t) =>
        (TREND_TOOL_CATEGORIES as readonly string[]).includes(t.category) &&
        ((t.label?.toLowerCase() || "").includes(query) || t.id.toLowerCase().includes(query)),
    );
  }, [trendSearchQuery]);

  const toggleTrendDropdown = useCallback((e: React.MouseEvent) => {
    if (!isTrendDropdownOpen) {
      setTrendDropdownView("categories");
      setIsFibDropdownOpen(false);
      setIsChartPatternsDropdownOpen(false);
      setIsForecastingDropdownOpen(false);
    }
    toggleTrendMenu(e);
  }, [isTrendDropdownOpen, toggleTrendMenu, setIsFibDropdownOpen, setIsChartPatternsDropdownOpen, setIsForecastingDropdownOpen]);

  const toggleFibDropdown = useCallback((e: React.MouseEvent) => {
    if (!isFibDropdownOpen) {
      setFibDropdownView("categories");
      setIsTrendDropdownOpen(false);
      setIsChartPatternsDropdownOpen(false);
      setIsForecastingDropdownOpen(false);
    }
    toggleFibMenu(e);
  }, [isFibDropdownOpen, toggleFibMenu, setIsTrendDropdownOpen, setIsChartPatternsDropdownOpen, setIsForecastingDropdownOpen]);

  const toggleChartPatternsDropdown = useCallback((e: React.MouseEvent) => {
    if (!isChartPatternsDropdownOpen) {
      setChartPatternsDropdownView("categories");
      setIsTrendDropdownOpen(false);
      setIsFibDropdownOpen(false);
      setIsForecastingDropdownOpen(false);
    }
    toggleChartPatternsMenu(e);
  }, [isChartPatternsDropdownOpen, toggleChartPatternsMenu, setIsTrendDropdownOpen, setIsFibDropdownOpen, setIsForecastingDropdownOpen]);

  const toggleForecastingDropdown = useCallback((e: React.MouseEvent) => {
    if (!isForecastingDropdownOpen) {
      setForecastingDropdownView("categories");
      setIsTrendDropdownOpen(false);
      setIsFibDropdownOpen(false);
      setIsChartPatternsDropdownOpen(false);
    }
    toggleForecastingMenu(e);
  }, [isForecastingDropdownOpen, toggleForecastingMenu, setIsTrendDropdownOpen, setIsFibDropdownOpen, setIsChartPatternsDropdownOpen]);

  const handleSelectDrawingTool = useCallback((toolId: AllToolType) => {
    const bucket = getToolMemoryBucket(toolId);
    if (bucket) {
      setLastSelectedToolByCategory((prev) => ({ ...prev, [bucket]: toolId }));
    }
    setActiveTool(toolId);
    dispatch(setCursorMode("cross"));
    setIsTrendDropdownOpen(false);
    setIsFibDropdownOpen(false);
    setIsChartPatternsDropdownOpen(false);
    setIsForecastingDropdownOpen(false);
    setFibDropdownView("categories");
    setForecastingDropdownView("categories");
  }, [dispatch, getToolMemoryBucket, setActiveTool, setIsTrendDropdownOpen, setIsFibDropdownOpen, setIsChartPatternsDropdownOpen, setIsForecastingDropdownOpen]);

  const toggleCursorDropdown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isCursorDropdownOpen) {
      setIsCursorDropdownOpen(false);
    } else {
      if (cursorDropdownRef.current) {
        const rect = cursorDropdownRef.current.getBoundingClientRect();
        setCursorDropdownPos({ top: rect.top, left: rect.right + 15 });
        setIsCursorDropdownOpen(true);
      }
    }
  }, [isCursorDropdownOpen]);

  const handleSelectCursorMode = useCallback((mode: CursorModeType) => {
    dispatch(setCursorMode(mode));
    setActiveTool(null);
    setIsCursorDropdownOpen(false);
  }, [dispatch, setActiveTool, setIsCursorDropdownOpen]);

  const reactivateRememberedTool = useCallback((toolId: AllToolType | null) => {
    if (!toolId) return;

    setActiveTool(toolId);
    dispatch(setCursorMode("cross"));
    setIsTrendDropdownOpen(false);
    setIsFibDropdownOpen(false);
    setIsChartPatternsDropdownOpen(false);
    setIsForecastingDropdownOpen(false);
    setTrendDropdownView("categories");
    setFibDropdownView("categories");
    setChartPatternsDropdownView("categories");
    setForecastingDropdownView("categories");
  }, [dispatch, setActiveTool, setIsTrendDropdownOpen, setIsFibDropdownOpen, setIsChartPatternsDropdownOpen, setIsForecastingDropdownOpen]);

  const handleTrendButtonClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (!lastSelectedToolByCategory.trend) {
      toggleTrendDropdown(event);
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    reactivateRememberedTool(lastSelectedToolByCategory.trend);
  }, [lastSelectedToolByCategory.trend, reactivateRememberedTool, toggleTrendDropdown]);

  const handleFibButtonClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (!lastSelectedToolByCategory.fib) {
      toggleFibDropdown(event);
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    reactivateRememberedTool(lastSelectedToolByCategory.fib);
  }, [lastSelectedToolByCategory.fib, reactivateRememberedTool, toggleFibDropdown]);

  const handleChartPatternsButtonClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (!lastSelectedToolByCategory.chartPatterns) {
      toggleChartPatternsDropdown(event);
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    reactivateRememberedTool(lastSelectedToolByCategory.chartPatterns);
  }, [lastSelectedToolByCategory.chartPatterns, reactivateRememberedTool, toggleChartPatternsDropdown]);

  const handleForecastingButtonClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (!lastSelectedToolByCategory.forecasting) {
      toggleForecastingDropdown(event);
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    reactivateRememberedTool(lastSelectedToolByCategory.forecasting);
  }, [lastSelectedToolByCategory.forecasting, reactivateRememberedTool, toggleForecastingDropdown]);

  const renderSplitDropdownTrigger = useCallback((onOpen: (event: React.MouseEvent) => void, isOpen: boolean) => (
    <span
      role="button"
      aria-label="Ouvrir la liste des outils"
      tabIndex={0}
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onOpen(event);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          onOpen(event as unknown as React.MouseEvent);
        }
      }}
      style={{
        position: "absolute",
        right: 0,
        bottom: 0,
        width: 18,
        height: 18,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "flex-end",
        paddingRight: 2,
        paddingBottom: 1,
        cursor: "pointer",
        zIndex: 2,
      }}
    >
      <i
        className="bi bi-caret-down-fill"
        style={{
          fontSize: "0.5rem",
          color: isOpen ? ACTIVE_BLUE : "rgba(160, 174, 192, 0.9)",
          lineHeight: 1,
        }}
      ></i>
    </span>
  ), []);

  const handleGlobalLockToggle = () => {
    dispatch(toggleLockedAll());
  };

  const handleVisibilityToggle = () => {
    dispatch(toggleAreDrawingsHidden());
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (cursorDropdownRef.current && !cursorDropdownRef.current.contains(target)) {
        setIsCursorDropdownOpen(false);
      }
      if (trendDropdownRef.current && !trendDropdownRef.current.contains(target) && !target.closest(".gp-cursor-dropdown-portal")) {
        setIsTrendDropdownOpen(false);
      }
      if (fibDropdownRef.current && !fibDropdownRef.current.contains(target) && !target.closest(".gp-cursor-dropdown-portal")) {
        setIsFibDropdownOpen(false);
      }
      if (chartPatternsDropdownRef.current && !chartPatternsDropdownRef.current.contains(target) && !target.closest(".gp-cursor-dropdown-portal")) {
        setIsChartPatternsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsFibDropdownOpen, setIsTrendDropdownOpen, setIsChartPatternsDropdownOpen, fibDropdownRef, trendDropdownRef, chartPatternsDropdownRef]);

  const TOOL_ICON_MAP: Record<
    string,
    {
      type: "bootstrap" | "svg" | "custom";
      icon: string | React.ReactNode;
      rotate?: string;
      color?: string;
    }
  > = {
    // === LINES & MEASURES (15 tools) ===
    line: { type: "bootstrap", icon: "bi-slash-lg" },
    horizontal_line: {
      type: "custom",
      icon: <HorizontalLineIcon />,
    },
    vertical_line: {
      type: "bootstrap",
      icon: "bi-dash-lg",
      rotate: "90deg",
    },
    arrow: {
      type: "bootstrap",
      icon: "bi-arrow-up-right",
    },
    trend_angle: {
      type: "bootstrap",
      icon: "bi-caret-up",
    },
    ray: { type: "bootstrap", icon: "bi-arrow-right" },
    x_line: {
      type: "bootstrap",
      icon: "bi-arrows-expand",
    },
    horizontal_ray: {
      type: "bootstrap",
      icon: "bi-arrow-right-short",
    },
    polyline: { type: "bootstrap", icon: "bi-share" },
    path: { type: "bootstrap", icon: "bi-bezier2" },
    curve: { type: "bootstrap", icon: "bi-bezier" },
    crosshair: { type: "bootstrap", icon: "bi-plus-lg" },
    pitchfork: {
      type: "custom",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 28 28"
          width="16"
          height="16"
        >
          <g fill="currentColor" fillRule="nonzero">
            <path d="M7.275 21.432l12.579-12.579-.707-.707-12.579 12.579z"></path>
            <path d="M6.69 13.397l7.913 7.913.707-.707-7.913-7.913zM7.149 10.558l7.058-7.058-.707-.707-7.058 7.058z"></path>
            <path d="M18.149 21.558l7.058-7.058-.707-.707-7.058 7.058z"></path>
            <path d="M5.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM5.5 13c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM16.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
          </g>
        </svg>
      ),
    },
    arrow_marker: {
      type: "bootstrap",
      icon: "bi-arrow-up",
    },
    projection: {
      type: "bootstrap",
      icon: "bi-graph-up-arrow",
    },
    date_range: {
      type: "bootstrap",
      icon: "bi-calendar-range",
    },
    price_range: {
      type: "bootstrap",
      icon: "bi-arrows-vertical",
    },
    date_price_range: {
      type: "bootstrap",
      icon: "bi-bounding-box",
    },

    // === CHANNELS (4 tools) ===
    parallel_channel: {
      type: "bootstrap",
      icon: "bi-distribute-vertical",
    },
    regression_trend: { type: "svg", icon: "regression" },
    disjoint_channel: {
      type: "bootstrap",
      icon: "bi-bezier2",
    },
    flat_top_bottom: { type: "svg", icon: "flat_top_bottom" },

    // === PITCHFORKS (4 tools) ===
    schiff_pitchfork: {
      type: "custom",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 28 28"
          width="16"
          height="16"
        >
          <g fill="currentColor" fillRule="nonzero">
            <path d="M10.275 20.432l11.579-11.579-.707-.707-11.579 11.579z"></path>
            <path d="M8.336 13.043l8.621 8.621.707-.707-8.621-8.621zM9.149 10.558l7.058-7.058-.707-.707-7.058 7.058z"></path>
            <path d="M20.149 21.558l7.058-7.058-.707-.707-7.058 7.058z"></path>
            <path d="M6.5 23h10v-1h-10z"></path>
            <path d="M4.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM7.5 13c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM18.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
          </g>
        </svg>
      ),
    },
    modified_schiff_pitchfork: {
      type: "custom",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 28 28"
          width="16"
          height="16"
        >
          <g fill="currentColor" fillRule="nonzero">
            <path d="M7.854 22.854l14-14-.707-.707-14 14z"></path>
            <path d="M8.336 13.043l8.621 8.621.707-.707-8.621-8.621zM9.149 10.558l7.058-7.058-.707-.707-7.058 7.058z"></path>
            <path d="M20.149 21.558l7.058-7.058-.707-.707-7.058 7.058z"></path>
            <path d="M5.5 23h11v-1h-11z"></path>
            <path d="M7.5 13c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM18.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM3.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
          </g>
        </svg>
      ),
    },
    fib_channel: {
      type: "custom",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 28 28"
          width="16"
          height="16"
        >
          <g fill="currentColor" fillRule="nonzero">
            <path d="M7.463 12.026l13.537-7.167-.468-.884-13.537 7.167z"></path>
            <path d="M22.708 16.824l-17.884 9.468.468.884 17.884-9.468z"></path>
            <path d="M22.708 9.824l-15.839 8.386.468.884 15.839-8.386z"></path>
            <path d="M5.5 14c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM5.5 21c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM22.5 5c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
          </g>
        </svg>
      ),
    },
    inside_pitchfork: {
      type: "custom",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 28 28"
          width="16"
          height="16"
        >
          <g fill="currentColor" fillRule="nonzero">
            <path d="M10.275 22.432l11.579-11.579-.707-.707-11.579 11.579z"></path>
            <path d="M9.854 20.854l14-14-.707-.707-14 14z"></path>
            <path d="M8.336 13.043l8.621 8.621.707-.707-8.621-8.621zM9.149 10.558l7.058-7.058-.707-.707-7.058 7.058z"></path>
            <path d="M20.149 21.558l7.058-7.058-.707-.707-7.058 7.058z"></path>
            <path d="M7.5 24h6v-1h-6z"></path>
            <path d="M5.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM7.5 13c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM18.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
          </g>
        </svg>
      ),
    },
  };

  const renderTrendToolIcon = (toolId: AllToolType | null, isActive: boolean) => {
    if (!toolId) {
      return <TrendCategoryIcon />;
    }
    const iconConfig = TOOL_ICON_MAP[toolId];
    if (!iconConfig) {
      const tool = DRAWING_TOOLS_CONFIG.find((item) => item.id === toolId);
      if (tool?.icon) {
        return cloneIconWithActiveState(tool.icon, isActive);
      }
      return (
        <i
          className="bi bi-pencil-fill"
          style={{
            fontSize: "1.2rem",
            color: isActive ? ACTIVE_BLUE : "inherit",
          }}
        ></i>
      );
    }

    const activeColor = iconConfig.color || (isActive ? ACTIVE_BLUE : "inherit");

    if (iconConfig.type === "bootstrap") {
      return (
        <i
          className={`bi ${iconConfig.icon}`}
          style={{
            fontSize: "1.2rem",
            transform: iconConfig.rotate ? `rotate(${iconConfig.rotate})` : undefined,
            color: activeColor,
          }}
        ></i>
      );
    }
    if (iconConfig.type === "svg") {
      if (iconConfig.icon === "regression") {
        return (
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" style={{ color: activeColor }}>
            <path d="M2 11L14 5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="2" cy="11" r="1.5" fill="white" stroke="currentColor" />
            <circle cx="14" cy="5" r="1.5" fill="white" stroke="currentColor" />
            <path d="M2 8L14 2M2 14L14 8" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          </svg>
        );
      }
      if (iconConfig.icon === "flat_top_bottom") {
        return (
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" style={{ color: activeColor }}>
            <path d="M14 5L2 12H14" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
            <circle cx="2" cy="12" r="1.5" fill="white" stroke="currentColor" />
            <circle cx="14" cy="5" r="1.5" fill="white" stroke="currentColor" />
            <circle cx="14" cy="12" r="1.5" fill="white" stroke="currentColor" />
          </svg>
        );
      }
    }
    if (iconConfig.type === "custom") {
      return cloneIconWithActiveState(iconConfig.icon, isActive);
    }
    return <i className="bi bi-pencil-fill" style={{ fontSize: "1.2rem", color: activeColor }}></i>;
  };

  const renderCategoryToolIcon = (
    toolId: AllToolType | null,
    isActive: boolean,
    fallbackIcon: React.ReactNode,
  ) => {
    if (!toolId) return fallbackIcon;

    const tool = DRAWING_TOOLS_CONFIG.find((item) => item.id === toolId);
    if (!tool?.icon) return fallbackIcon;

    return cloneIconWithActiveState(tool.icon, isActive);
  };

  return (
    <aside
      ref={verticalToolbarRef}
      className={clsx(
        s["gp-vertical-toolbar"],
        "gp-vertical-toolbar",
        "gsap-target-vertical-toolbar",
        "animated-element",
      )}
    >
      <div className={s["gp-toolbar-scroll-container"]}>
        {/* --- CURSOR MODE SELECTOR --- */}
        <button
          ref={cursorDropdownRef}
          className={clsx(
            s["gp-toolbar-btn"],
            "gp-toolbar-btn",
            s["gp-toolbar-btn-split"],
            "gp-toolbar-btn-split",
            s["hover-lift"],
            "hover-lift",
            isCursorActive && s["active"],
          )}
          title={`Mode de curseur : ${uiState.cursorMode}`}
          onClick={toggleCursorDropdown}
        >
          {uiState.cursorMode.includes("cross") && (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke={isCursorActive ? ACTIVE_BLUE : "currentColor"}
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5V3M12 21v-2M5 12H3M21 12h-2M12 19v-4M12 9V5M19 12h-4M9 12H5"></path>
              <rect
                x="11"
                y="11"
                width="2"
                height="2"
                fill={isCursorActive ? ACTIVE_BLUE : "currentColor"}
                opacity={uiState.cursorMode === "cross-tooltip" ? 0.5 : 1}
              />
            </svg>
          )}
          {uiState.cursorMode === "dot" && (
            <i
              className="bi bi-circle-fill"
              style={{
                fontSize: "0.5rem",
                color: isCursorActive ? ACTIVE_BLUE : "inherit",
              }}
            ></i>
          )}
          {uiState.cursorMode.includes("arrow") && (
            <i
              className="bi bi-cursor-fill"
              style={{
                color: isCursorActive ? ACTIVE_BLUE : "inherit",
              }}
            ></i>
          )}
          {uiState.cursorMode === "demonstration" && (
            <i
              className="bi bi-hand-index-thumb-fill"
              style={{ color: varAccentGold }}
            ></i>
          )}
          {/* [TENOR 2026] UI Integration for Magic and Eraser modes */}
          {uiState.cursorMode === "magic" && (
            <i
              className="bi bi-magic"
              style={{ color: isCursorActive ? ACTIVE_BLUE : "inherit" }}
            ></i>
          )}
          {uiState.cursorMode === "eraser" && (
            <i
              className="bi bi-eraser-fill"
              style={{ color: isCursorActive ? ACTIVE_BLUE : "inherit" }}
            ></i>
          )}
        </button>

        {isCursorDropdownOpen &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              className="gp-cursor-dropdown-portal"
              style={{
                position: "fixed",
                top: cursorDropdownPos.top,
                left: cursorDropdownPos.left,
              }}
            >
              {[
                {
                  id: "cross",
                  label: "Croisée",
                  icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="1.5"><path d="M12 5V3M12 21v-2M5 12H3M21 12h-2M12 19v-4M12 9V5M19 12h-4M9 12H5"></path></svg>
                },
                {
                  id: "cross-tooltip",
                  label: "Croisée + Info",
                  icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="1.5"><path d="M12 5V3M12 21v-2M5 12H3M21 12h-2M12 19v-4M12 9V5M19 12h-4M9 12H5"></path></svg>
                },
                {
                  id: "dot",
                  label: "Point",
                  icon: <i className="bi bi-circle-fill" style={{ fontSize: "0.45rem" }}></i>
                },
                {
                  id: "arrow",
                  label: "Flèche",
                  icon: <i className="bi bi-cursor-fill"></i>
                },
                {
                  id: "arrow-tooltip",
                  label: "Flèche + Info",
                  icon: <i className="bi bi-cursor-fill"></i>
                },
                {
                  id: "demonstration",
                  label: "Présentation",
                  icon: <i className="bi bi-hand-index-thumb-fill" style={{ color: varAccentGold }}></i>
                },
                // [TENOR 2026] TradingView Parity: Magic Wand and Eraser
                {
                  id: "magic",
                  label: "Magic",
                  icon: <i className="bi bi-magic" style={{ color: varAccentGold }}></i>
                },
                {
                  id: "eraser",
                  label: "Eraser",
                  icon: <i className="bi bi-eraser-fill"></i>
                },
              ].map((mode) => (
                <div
                  key={mode.id}
                  className={s["gp-cursor-option"]}
                  style={getActiveOptionStyle(uiState.cursorMode === mode.id)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectCursorMode(mode.id as CursorModeType);
                  }}
                >
                  <div className={s["icon-container"]}>{mode.icon}</div>
                  <span className={s["gp-cursor-label"]}>{mode.label}</span>
                </div>
              ))}
            </div>,
            document.body,
          )}

        {/* --- TREND TOOLS SELECTOR --- */}
        <button
          ref={trendDropdownRef as React.RefObject<HTMLButtonElement>}
          className={clsx(
            s["gp-toolbar-btn"],
            "gp-toolbar-btn",
            s["gp-toolbar-btn-split"],
            "gp-toolbar-btn-split",
            s["hover-lift"],
            "hover-lift",
            (isTrendDropdownOpen || (!isFibDropdownOpen && isTrendToolActive)) ? s["active"] : "",
          )}
          title="Lignes de Tendances & Outils de Mesure"
          onClick={handleTrendButtonClick}
        >
          {renderTrendToolIcon(isTrendToolActive ? activeTool : lastSelectedToolByCategory.trend, isTrendToolActive)}
          {renderSplitDropdownTrigger(toggleTrendDropdown, isTrendDropdownOpen)}
        </button>

        <ToolPortal
          isOpen={isTrendDropdownOpen}
          pos={trendDropdownPos}
          searchQuery={trendSearchQuery}
          onSearchChange={setTrendSearchQuery}
          onClose={() => setIsTrendDropdownOpen(false)}
          placeholder="Rechercher un outil..."
        >
          {trendSearchQuery.trim() ? (
            <div style={{ padding: "4px 0" }}>
              {filteredTools.length > 0 ? (
                filteredTools.map((tool) => {
                  const isActive = activeTool === tool.id;
                  return (
                    <div
                      key={`trend-${tool.id}`}
                      className={s["gp-cursor-option"]}
                      style={getActiveOptionStyle(isActive)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectDrawingTool(tool.id as AllToolType);
                        setTrendSearchQuery("");
                        setIsTrendDropdownOpen(false);
                      }}
                    >
                      <div className={s["icon-container"]}>{cloneIconWithActiveState(tool.icon, isActive)}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                        <span className={s["gp-cursor-label"]}>{tool.label || ""}</span>
                        <span style={{ fontSize: "10px", color: "#787b86" }}>{tool.category}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: "20px", textAlign: "center", color: "#787b86", fontSize: "12px" }}>Aucun outil trouvé</div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
              {trendDropdownView === "categories" && (
                <>
                  {(
                    [
                      { id: "drawing_tools", label: "Lines & Measures", count: drawingCounts.lines },
                      { id: "channels", label: "Channels", count: drawingCounts.channels },
                      { id: "pitchforks", label: "Pitchforks", count: drawingCounts.pitchforks },
                    ] as const
                  ).map((cat) => (
                    <div
                      key={cat.id}
                      className={clsx(s["gp-cursor-option"])}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setTrendDropdownView(cat.id);
                      }}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: "10px", height: "32px" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ background: ACTIVE_BLUE, color: "white", fontSize: "11px", fontWeight: 600, padding: "2px 6px", borderRadius: "3px", minWidth: "24px", textAlign: "center" }}>{cat.count}</span>
                        <span className={clsx(s["gp-cursor-label"])} style={{ fontWeight: 500 }}>{cat.label}</span>
                      </div>
                      <i className="bi bi-chevron-right" style={{ fontSize: "0.8rem", color: "#787b86" }}></i>
                    </div>
                  ))}
                </>
              )}

              {["channels", "pitchforks", "drawing_tools"].includes(trendDropdownView) && (
                <>
                  <div style={{ padding: "8px 12px 6px 12px", fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.4)", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", marginBottom: "4px", userSelect: "none" }}>
                    <span>{trendDropdownView === "drawing_tools" ? "Lines & Measures" : trendDropdownView.toUpperCase()}</span>
                    <div
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setTrendDropdownView("categories");
                      }}
                      style={{ cursor: "pointer" }}
                      className={s["back-icon-hover"]}
                    >
                      <i className="bi bi-chevron-left" style={{ fontSize: "12px" }}></i>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2px" }}>
                    {DRAWING_TOOLS_CONFIG.filter((t) =>
                      trendDropdownView === "drawing_tools" ? t.category === "Lines & Measures" :
                        trendDropdownView === "channels" ? (t.category === "Channels" || t.id === "regression_trend") :
                          t.category === "Pitchforks"
                    ).map((tool) => {
                      const isActive = activeTool === tool.id;
                      return (
                        <div
                          key={tool.id}
                          className={s["gp-cursor-option"]}
                          style={getActiveOptionStyle(isActive)}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectDrawingTool(tool.id as AllToolType);
                            setIsTrendDropdownOpen(false);
                          }}>
                          <div className={s["icon-container"]}>{cloneIconWithActiveState(tool.icon, isActive)}</div>
                          <span className={s["gp-cursor-label"]}>{tool.label || ""}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </ToolPortal>

        {/* --- FIBONACCI TOOLS SELECTOR --- */}
        <button
          ref={fibDropdownRef as React.RefObject<HTMLButtonElement>}
          className={clsx(
            s["gp-toolbar-btn"],
            "gp-toolbar-btn",
            s["gp-toolbar-btn-split"],
            "gp-toolbar-btn-split",
            s["hover-lift"],
            "hover-lift",
            (isFibDropdownOpen || (!isTrendDropdownOpen && isFibToolActive)) ? s["active"] : "",
          )}
          title="Fibonacci Tools"
          onClick={handleFibButtonClick}
        >
          {renderCategoryToolIcon(isFibToolActive ? activeTool : lastSelectedToolByCategory.fib, isFibToolActive, <FibCategoryIcon />)}
          {renderSplitDropdownTrigger(toggleFibDropdown, isFibDropdownOpen)}
        </button>

        <ToolPortal
          isOpen={isFibDropdownOpen}
          pos={fibDropdownPos}
          searchQuery={fibSearchQuery}
          onSearchChange={setFibSearchQuery}
          onClose={() => setIsFibDropdownOpen(false)}
          placeholder="Rechercher un outil Fibonacci..."
        >
          {fibDropdownView === "categories" && (
            <>
              <div style={{ padding: "8px 12px 6px 12px", fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.4)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", marginBottom: "4px", userSelect: "none" }}>FIBONACCI & GANN</div>
              {(
                [
                  { id: "fibonacci", label: "Fibonacci", count: drawingCounts.fibPure },
                  { id: "gann", label: "Gann", count: drawingCounts.gann },
                ] as const
              ).map((cat) => (
                <div
                  key={cat.id}
                  className={clsx(s["gp-cursor-option"])}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setFibDropdownView(cat.id);
                  }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", cursor: "pointer" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ background: ACTIVE_BLUE, color: "white", fontSize: "11px", fontWeight: 600, padding: "2px 6px", borderRadius: "3px", minWidth: "24px", textAlign: "center" }}>{cat.count}</span>
                    <span className={s["gp-cursor-label"]}>{cat.label}</span>
                  </div>
                  <i className="bi bi-chevron-right" style={{ fontSize: "0.8rem", color: "#787b86" }}></i>
                </div>
              ))}
            </>
          )}

          {["fibonacci", "gann"].includes(fibDropdownView) && (
            <>
              <div style={{ padding: "8px 12px 6px 12px", fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.4)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", marginBottom: "4px", userSelect: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>{fibDropdownView.toUpperCase()}</span>
                <div
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setFibDropdownView("categories");
                  }}
                  style={{ cursor: "pointer", color: "rgba(255, 255, 255, 0.6)", fontSize: "11px", padding: "2px 6px", borderRadius: "3px", background: "rgba(255, 255, 255, 0.05)" }}
                >← Retour</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2px" }}>
                {DRAWING_TOOLS_CONFIG.filter((t) =>
                  fibDropdownView === "fibonacci" ? (t.category === TOOL_CATEGORIES.FIBONACCI && !t.id.includes("gann")) :
                    t.id.includes("gann")
                ).map((tool) => {
                  const isActive = activeTool === tool.id;
                  return (
                    <div
                      key={tool.id}
                      className={s["gp-cursor-option"]}
                      style={getActiveOptionStyle(isActive)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectDrawingTool(tool.id as AllToolType);
                        setIsFibDropdownOpen(false);
                      }}>
                      <div className={s["icon-container"]}>{tool.icon}</div>
                      <span className={s["gp-cursor-label"]}>{tool.label}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </ToolPortal>

        <button
          ref={chartPatternsDropdownRef as React.RefObject<HTMLButtonElement>}
          className={clsx(
            s["gp-toolbar-btn"],
            "gp-toolbar-btn",
            s["gp-toolbar-btn-split"],
            "gp-toolbar-btn-split",
            s["hover-lift"],
            "hover-lift",
            (isChartPatternsDropdownOpen || (!isTrendDropdownOpen && !isFibDropdownOpen && isChartPatternsToolActive)) ? s["active"] : "",
          )}
          title="CHART PATTERNS"
          onClick={handleChartPatternsButtonClick}
        >
          {renderCategoryToolIcon(
            isChartPatternsToolActive ? activeTool : lastSelectedToolByCategory.chartPatterns,
            isChartPatternsToolActive,
            <PatternsCategoryIcon />,
          )}
          {renderSplitDropdownTrigger(toggleChartPatternsDropdown, isChartPatternsDropdownOpen)}
        </button>

        <ToolPortal
          isOpen={isChartPatternsDropdownOpen}
          pos={chartPatternsDropdownPos}
          searchQuery={chartPatternsSearchQuery}
          onSearchChange={setChartPatternsSearchQuery}
          onClose={() => setIsChartPatternsDropdownOpen(false)}
          placeholder="Rechercher un Chart Pattern..."
        >
          {chartPatternsDropdownView === "categories" && (
            <>
              <div style={{ padding: "8px 12px 6px 12px", fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.4)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", marginBottom: "4px", userSelect: "none" }}>CHART PATTERNS</div>
              {(
                [
                  { id: "patterns", label: "Patterns", count: drawingCounts.patterns },
                  { id: "elliott", label: "Elliott Waves", count: drawingCounts.elliott },
                  { id: "cycles", label: "Cycles", count: drawingCounts.cycles },
                ] as const
              ).map((cat) => (
                <div
                  key={cat.id}
                  className={clsx(s["gp-cursor-option"])}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setChartPatternsDropdownView(cat.id);
                  }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", cursor: "pointer" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ background: ACTIVE_BLUE, color: "white", fontSize: "11px", fontWeight: 600, padding: "2px 6px", borderRadius: "3px", minWidth: "24px", textAlign: "center" }}>{cat.count}</span>
                    <span className={s["gp-cursor-label"]}>{cat.label}</span>
                  </div>
                  <i className="bi bi-chevron-right" style={{ fontSize: "0.8rem", color: "#787b86" }}></i>
                </div>
              ))}
            </>
          )}

          {["patterns", "elliott", "cycles"].includes(chartPatternsDropdownView) && (
            <>
              <div style={{ padding: "8px 12px 6px 12px", fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.4)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", marginBottom: "4px", userSelect: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>{chartPatternsDropdownView === "patterns" ? "CHART PATTERNS" : chartPatternsDropdownView.toUpperCase()}</span>
                <div
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setChartPatternsDropdownView("categories");
                  }}
                  style={{ cursor: "pointer", color: "rgba(255, 255, 255, 0.6)", fontSize: "11px", padding: "2px 6px", borderRadius: "3px", background: "rgba(255, 255, 255, 0.05)" }}
                >← Retour</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2px", maxHeight: "400px", overflowY: "auto" }}>
                {DRAWING_TOOLS_CONFIG.filter((t) => {
                  const searchMatch = chartPatternsSearchQuery.trim() === "" ||
                    (t.label?.toLowerCase() || "").includes(chartPatternsSearchQuery.toLowerCase()) ||
                    t.id.toLowerCase().includes(chartPatternsSearchQuery.toLowerCase());
                  if (!searchMatch) return false;

                  if (chartPatternsDropdownView === "patterns") return t.category === TOOL_CATEGORIES.CHART_PATTERNS;
                  if (chartPatternsDropdownView === "elliott") return t.category === TOOL_CATEGORIES.ELLIOTT_WAVES;
                  if (chartPatternsDropdownView === "cycles") return t.category === TOOL_CATEGORIES.CYCLES;
                  return false;
                }).map((tool) => {
                  const isActive = activeTool === tool.id;
                  return (
                    <div
                      key={tool.id}
                      className={s["gp-cursor-option"]}
                      style={getActiveOptionStyle(isActive)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectDrawingTool(tool.id as AllToolType);
                        setIsChartPatternsDropdownOpen(false);
                      }}>
                      <div className={s["icon-container"]}>{tool.icon}</div>
                      <span className={s["gp-cursor-label"]}>{tool.label}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </ToolPortal>

        <button
          ref={forecastingDropdownRef as React.RefObject<HTMLButtonElement>}
          className={clsx(
            s["gp-toolbar-btn"],
            s["gp-toolbar-btn-split"],
            "hover-lift",
            (isForecastingDropdownOpen || (!isTrendDropdownOpen && !isFibDropdownOpen && !isChartPatternsDropdownOpen && isForecastingToolActive)) ? s["active"] : "",
          )}
          title="FORECASTING"
          onClick={handleForecastingButtonClick}
        >
          {renderCategoryToolIcon(
            isForecastingToolActive ? activeTool : lastSelectedToolByCategory.forecasting,
            isForecastingToolActive,
            <ForecastingCategoryIcon />,
          )}
          {renderSplitDropdownTrigger(toggleForecastingDropdown, isForecastingDropdownOpen)}
        </button>

        <ToolPortal
          isOpen={isForecastingDropdownOpen}
          pos={forecastingDropdownPos}
          searchQuery={forecastingSearchQuery}
          onSearchChange={setForecastingSearchQuery}
          onClose={() => setIsForecastingDropdownOpen(false)}
          placeholder="Rechercher un outil Forecasting..."
        >
          {forecastingDropdownView === "categories" && (
            <>
              <div style={{ padding: "8px 12px 6px 12px", fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.4)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", marginBottom: "4px", userSelect: "none" }}>FORECASTING & VOLUME</div>
              {(
                [
                  { id: "forecasting", label: "Forecasting", count: drawingCounts.forecasting },
                  { id: "volume", label: "Volume-Based", count: drawingCounts.volume },
                ] as const
              ).map((cat) => (
                <div
                  key={cat.id}
                  className={clsx(s["gp-cursor-option"])}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setForecastingDropdownView(cat.id);
                  }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", cursor: "pointer" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ background: ACTIVE_BLUE, color: "white", fontSize: "11px", fontWeight: 600, padding: "2px 6px", borderRadius: "3px", minWidth: "24px", textAlign: "center" }}>{cat.count}</span>
                    <span className={s["gp-cursor-label"]}>{cat.label}</span>
                  </div>
                  <i className="bi bi-chevron-right" style={{ fontSize: "0.8rem", color: "#787b86" }}></i>
                </div>
              ))}
            </>
          )}

          {["forecasting", "volume"].includes(forecastingDropdownView) && (
            <>
              <div style={{ padding: "8px 12px 6px 12px", fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.4)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", marginBottom: "4px", userSelect: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>{forecastingDropdownView === "forecasting" ? "FORECASTING" : "VOLUME-BASED"}</span>
                <div
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setForecastingDropdownView("categories");
                  }}
                  style={{ cursor: "pointer", color: "rgba(255, 255, 255, 0.6)", fontSize: "11px", padding: "2px 6px", borderRadius: "3px", background: "rgba(255, 255, 255, 0.05)" }}
                >← Retour</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2px" }}>
                {DRAWING_TOOLS_CONFIG.filter((t) => {
                  const searchMatch = forecastingSearchQuery.trim() === "" ||
                    (t.label?.toLowerCase() || "").includes(forecastingSearchQuery.toLowerCase()) ||
                    t.id.toLowerCase().includes(forecastingSearchQuery.toLowerCase());
                  if (!searchMatch) return false;

                  if (forecastingDropdownView === "forecasting") return t.category === TOOL_CATEGORIES.FORECASTING;
                  if (forecastingDropdownView === "volume") return t.category === TOOL_CATEGORIES.VOLUME_BASED;
                  return false;
                }).map((tool) => {
                  const isActive = activeTool === tool.id;
                  return (
                    <div
                      key={tool.id}
                      className={s["gp-cursor-option"]}
                      style={getActiveOptionStyle(isActive)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectDrawingTool(tool.id as AllToolType);
                        setIsForecastingDropdownOpen(false);
                      }}>
                      <div className={s["icon-container"]}>{tool.icon}</div>
                      <span className={s["gp-cursor-label"]}>{tool.label}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </ToolPortal>

        <button className={clsx(s["gp-toolbar-btn"], "hover-lift")} title="Texte"><i className="bi bi-fonts"></i></button>
        <button className={clsx(s["gp-toolbar-btn"], "hover-lift")} title="Icônes"><i className="bi bi-emoji-smile"></i></button>
        <div className={s["gp-toolbar-divider"]}></div>
        <button className={clsx(s["gp-toolbar-btn"], "hover-lift")} title="Règle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21L21 3l-2-2L1 19l2 2zM6 12v2M9 9v2m3-3v2m3-3v2"></path></svg></button>
        <button className={clsx(s["gp-toolbar-btn"], "hover-lift")} title="Zoom"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35M11 8v6M8 11h6"></path></svg></button>
      </div>

      <div className={s["gp-toolbar-footer"]}>
        <div className={s["gp-toolbar-divider"]}></div>
        <button className={clsx(s["gp-toolbar-btn"], "hover-lift")} title="Aimant"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-magnet" viewBox="0 0 16 16"><path d="M8 1a7 7 0 0 0-7 7v3h4V8a3 3 0 0 1 6 0v3h4V8a7 7 0 0 0-7-7m7 11h-4v3h4zM5 12H1v3h4zM0 8a8 8 0 1 1 16 0v8h-6V8a2 2 0 1 0-4 0v8H0z" /></svg></button>
        <button className={clsx(s["gp-toolbar-btn"], "hover-lift")} title="Mode dessin"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325" /></svg></button>
        <button className={clsx(s["gp-toolbar-btn"], "hover-lift", uiState.isLockedAll && s["active"])} onClick={handleGlobalLockToggle} title="Verrouiller les dessins"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-unlock2" style={{ color: uiState.isLockedAll ? ACTIVE_BLUE : "inherit" }} viewBox="0 0 16 16"><path fillRule="evenodd" d="M8 0c1.07 0 2.041.42 2.759 1.104l.14.14.062.08a.5.5 0 0 1-.71.675l-.076-.066-.216-.205A3 3 0 0 0 5 4v2h6.5A2.5 2.5 0 0 1 14 8.5v5a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 2 13.5v-5a2.5 2.5 0 0 1 2-2.45V4a4 4 0 0 1 4-4M4.5 7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7z" /></svg></button>
        <button className={clsx(s["gp-toolbar-btn"], "hover-lift", uiState.areDrawingsHidden && s["active"])} onClick={handleVisibilityToggle} title="Visibilité des dessins"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" style={{ color: uiState.areDrawingsHidden ? ACTIVE_BLUE : "inherit" }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>
        <div className={s["gp-toolbar-divider"]}></div>
        <button className={clsx(s["gp-toolbar-btn"], "hover-lift")} onClick={handleClearAllDrawings} title="Supprimer les dessins"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"></path></svg></button>
      </div>
    </aside >
  );
};
