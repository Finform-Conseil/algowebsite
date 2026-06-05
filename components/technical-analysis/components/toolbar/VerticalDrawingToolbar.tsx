"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import clsx from "clsx";

import {
  setCursorMode,
  toggleLockedAll,
  toggleAreDrawingsHidden
} from "../../store/technicalAnalysisSlice";
import { selectUiState } from "../../store/selectors";
import type { AllToolType } from "../../config/drawing/drawingToolTypes";
import type { CursorModeType } from "../../config/state/uiStateTypes";
import {
  FibCategoryIcon,
  ForecastingCategoryIcon,
  PatternsCategoryIcon,
} from "../common/icons/drawing/categories";
import { CursorModeSelector } from "./drawing/CursorModeSelector";
import {
  ChartPatternsToolDropdown,
  FibToolDropdown,
  ForecastingToolDropdown,
  TrendToolDropdown,
} from "./drawing/DrawingToolDropdown";
import { DrawingToolbarFooter, DrawingToolbarUtilityActions } from "./drawing/DrawingToolbarFooter";
import { getDrawingToolCounts } from "./drawing/drawingToolCounts";
import {
  createEmptyToolCategoryMemory,
  getActiveToolCategory,
  getToolMemoryBucket,
  isChartPatternsToolActiveForCategory,
  isFibToolActiveForTool,
  isForecastingToolActiveForTool,
  isTrendToolActiveForCategory,
  type ToolCategoryMemory,
} from "./drawing/drawingToolMemory";
import { useDrawingToolbarMenuState } from "./drawing/drawingToolbarMenuState";
import { ACTIVE_BLUE } from "./drawing/drawingToolbarTheme";
import {
  renderCategoryToolIcon,
  renderTrendToolIcon,
} from "./drawing/toolIconCatalog";

interface VerticalDrawingToolbarProps {
  activeTool: AllToolType | null;
  setActiveTool: (tool: AllToolType | null) => void;
  mainContainerRef: React.RefObject<HTMLDivElement>;
  verticalToolbarRef?: React.RefObject<HTMLDivElement>;
  handleClearAllDrawings: () => void;
  isLoading?: boolean;
}

const TOOLBAR_SKELETON_MAIN_ITEMS = [0, 1, 2, 3, 4, 5, 6] as const;
const TOOLBAR_SKELETON_FOOTER_ITEMS = [0, 1, 2, 3, 4] as const;

const ToolbarSkeletonButton = ({ emphasis = false }: { emphasis?: boolean }) => (
  <span
    className="is-loading-skeleton"
    style={{
      display: "block",
      width: "var(--gp-toolbar-btn-size)",
      height: "var(--gp-toolbar-btn-size)",
      borderRadius: "var(--gp-radius-sm)",
      flexShrink: 0,
      opacity: emphasis ? 0.95 : 0.72,
    }}
  />
);

const VerticalDrawingToolbarSkeleton = ({ verticalToolbarRef }: Pick<VerticalDrawingToolbarProps, "verticalToolbarRef">) => (
  <aside
    ref={verticalToolbarRef}
    className={clsx(
      "gp-vertical-toolbar",
      "gsap-target-vertical-toolbar",
      "animated-element",
    )}
    aria-busy="true"
    aria-label="Chargement des outils de dessin"
  >
    <div className="gp-toolbar-scroll-container" aria-hidden="true">
      <ToolbarSkeletonButton emphasis />
      {TOOLBAR_SKELETON_MAIN_ITEMS.slice(0, 4).map((item) => (
        <ToolbarSkeletonButton key={"main-a-" + item} />
      ))}
      <div className="gp-toolbar-divider" />
      {TOOLBAR_SKELETON_MAIN_ITEMS.slice(4).map((item) => (
        <ToolbarSkeletonButton key={"main-b-" + item} />
      ))}
    </div>

    <div className="gp-toolbar-footer" aria-hidden="true">
      <div className="gp-toolbar-divider" />
      {TOOLBAR_SKELETON_FOOTER_ITEMS.map((item) => (
        <ToolbarSkeletonButton key={"footer-" + item} />
      ))}
    </div>
  </aside>
)

export const VerticalDrawingToolbar: React.FC<VerticalDrawingToolbarProps> = ({
  activeTool,
  setActiveTool,
  mainContainerRef,
  verticalToolbarRef,
  handleClearAllDrawings,
  isLoading = false
}) => {
  const dispatch = useDispatch();
  const uiState = useSelector(selectUiState);
  const cursorDropdownRef = useRef<HTMLButtonElement>(null);

  const toolbarMenus = useDrawingToolbarMenuState(mainContainerRef);
  const {
    isOpen: isTrendDropdownOpen,
    setIsOpen: setIsTrendDropdownOpen,
    pos: trendDropdownPos,
    anchorRef: trendDropdownRef,
    searchQuery: trendSearchQuery,
    setSearchQuery: setTrendSearchQuery,
    view: trendDropdownView,
    setView: setTrendDropdownView,
    toggle: toggleTrendDropdown,
  } = toolbarMenus.trend;
  const {
    isOpen: isFibDropdownOpen,
    setIsOpen: setIsFibDropdownOpen,
    pos: fibDropdownPos,
    anchorRef: fibDropdownRef,
    searchQuery: fibSearchQuery,
    setSearchQuery: setFibSearchQuery,
    view: fibDropdownView,
    setView: setFibDropdownView,
    toggle: toggleFibDropdown,
  } = toolbarMenus.fib;
  const {
    isOpen: isChartPatternsDropdownOpen,
    setIsOpen: setIsChartPatternsDropdownOpen,
    pos: chartPatternsDropdownPos,
    anchorRef: chartPatternsDropdownRef,
    searchQuery: chartPatternsSearchQuery,
    setSearchQuery: setChartPatternsSearchQuery,
    view: chartPatternsDropdownView,
    setView: setChartPatternsDropdownView,
    toggle: toggleChartPatternsDropdown,
  } = toolbarMenus.chartPatterns;
  const {
    isOpen: isForecastingDropdownOpen,
    setIsOpen: setIsForecastingDropdownOpen,
    pos: forecastingDropdownPos,
    anchorRef: forecastingDropdownRef,
    searchQuery: forecastingSearchQuery,
    setSearchQuery: setForecastingSearchQuery,
    view: forecastingDropdownView,
    setView: setForecastingDropdownView,
    toggle: toggleForecastingDropdown,
  } = toolbarMenus.forecasting;
  const { closeAllDropdowns } = toolbarMenus;
  const [lastSelectedToolByCategory, setLastSelectedToolByCategory] = useState<ToolCategoryMemory>(createEmptyToolCategoryMemory);

  const [isCursorDropdownOpen, setIsCursorDropdownOpen] = useState(false);
  const [cursorDropdownPos, setCursorDropdownPos] = useState({ top: 0, left: 0 });

  const activeToolCategory = useMemo(() => getActiveToolCategory(activeTool), [activeTool]);

  const isTrendToolActive = useMemo(() => {
    return isTrendToolActiveForCategory(activeTool, activeToolCategory);
  }, [activeTool, activeToolCategory]);

  const isFibToolActive = useMemo(() => {
    return isFibToolActiveForTool(activeTool);
  }, [activeTool]);

  const isChartPatternsToolActive = useMemo(() => {
    return isChartPatternsToolActiveForCategory(activeToolCategory);
  }, [activeToolCategory]);

  const isForecastingToolActive = useMemo(() => {
    return isForecastingToolActiveForTool(activeTool);
  }, [activeTool]);

  const isCursorActive = isCursorDropdownOpen || (activeTool === null && !isTrendDropdownOpen && !isFibDropdownOpen && !isChartPatternsDropdownOpen && !isForecastingDropdownOpen && !isTrendToolActive && !isFibToolActive && !isChartPatternsToolActive && !isForecastingToolActive);

  // [TENOR 2026] Tool memory is now handled strictly via event handlers (handleSelectDrawingTool)
  // to prevent cascading renders and satisfy react-hooks/exhaustive-deps logic.


  const drawingCounts = useMemo(getDrawingToolCounts, []);

  const handleSelectDrawingTool = useCallback((toolId: AllToolType) => {
    const bucket = getToolMemoryBucket(toolId);
    if (bucket) {
      setLastSelectedToolByCategory((prev) => ({ ...prev, [bucket]: toolId }));
    }
    setActiveTool(toolId);
    dispatch(setCursorMode("cross"));
    closeAllDropdowns();
    setFibDropdownView("categories");
    setForecastingDropdownView("categories");
  }, [closeAllDropdowns, dispatch, setActiveTool, setFibDropdownView, setForecastingDropdownView]);

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
    closeAllDropdowns();
    setTrendDropdownView("categories");
    setFibDropdownView("categories");
    setChartPatternsDropdownView("categories");
    setForecastingDropdownView("categories");
  }, [
    closeAllDropdowns,
    dispatch,
    setActiveTool,
    setTrendDropdownView,
    setFibDropdownView,
    setChartPatternsDropdownView,
    setForecastingDropdownView,
  ]);

  const isSplitTriggerClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return event.clientX >= rect.right - 24 && event.clientY >= rect.bottom - 24;
  }, []);

  const handleTrendButtonClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (isSplitTriggerClick(event) || !lastSelectedToolByCategory.trend) {
      toggleTrendDropdown(event);
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    reactivateRememberedTool(lastSelectedToolByCategory.trend);
  }, [isSplitTriggerClick, lastSelectedToolByCategory.trend, reactivateRememberedTool, toggleTrendDropdown]);

  const handleFibButtonClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (isSplitTriggerClick(event) || !lastSelectedToolByCategory.fib) {
      toggleFibDropdown(event);
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    reactivateRememberedTool(lastSelectedToolByCategory.fib);
  }, [isSplitTriggerClick, lastSelectedToolByCategory.fib, reactivateRememberedTool, toggleFibDropdown]);

  const handleChartPatternsButtonClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (isSplitTriggerClick(event) || !lastSelectedToolByCategory.chartPatterns) {
      toggleChartPatternsDropdown(event);
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    reactivateRememberedTool(lastSelectedToolByCategory.chartPatterns);
  }, [isSplitTriggerClick, lastSelectedToolByCategory.chartPatterns, reactivateRememberedTool, toggleChartPatternsDropdown]);

  const handleForecastingButtonClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (isSplitTriggerClick(event) || !lastSelectedToolByCategory.forecasting) {
      toggleForecastingDropdown(event);
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    reactivateRememberedTool(lastSelectedToolByCategory.forecasting);
  }, [isSplitTriggerClick, lastSelectedToolByCategory.forecasting, reactivateRememberedTool, toggleForecastingDropdown]);

  const renderSplitDropdownTrigger = useCallback((isOpen: boolean) => (
    <span className="gp-toolbar-split-trigger" aria-hidden="true">
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
      if (forecastingDropdownRef.current && !forecastingDropdownRef.current.contains(target) && !target.closest(".gp-cursor-dropdown-portal")) {
        setIsForecastingDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [
    setIsFibDropdownOpen,
    setIsTrendDropdownOpen,
    setIsChartPatternsDropdownOpen,
    setIsForecastingDropdownOpen,
    fibDropdownRef,
    trendDropdownRef,
    chartPatternsDropdownRef,
    forecastingDropdownRef,
  ]);

  if (isLoading) {
    return <VerticalDrawingToolbarSkeleton verticalToolbarRef={verticalToolbarRef} />;
  }

  return (
    <aside
      ref={verticalToolbarRef}
      className={clsx(
        "gp-vertical-toolbar",
        "gsap-target-vertical-toolbar",
        "animated-element",
      )}
    >
      <div className={"gp-toolbar-scroll-container"}>
        <CursorModeSelector
          cursorMode={uiState.cursorMode}
          isActive={isCursorActive}
          isOpen={isCursorDropdownOpen}
          position={cursorDropdownPos}
          buttonRef={cursorDropdownRef}
          onToggle={toggleCursorDropdown}
          onSelectMode={handleSelectCursorMode}
        />

        {/* --- TREND TOOLS SELECTOR --- */}
        <button
          ref={trendDropdownRef as React.RefObject<HTMLButtonElement>}
          className={clsx(
            "gp-toolbar-btn",
            "gp-toolbar-btn-split",
            "hover-lift",
            (isTrendDropdownOpen || (!isFibDropdownOpen && isTrendToolActive)) ? "active" : "",
          )}
          title="Lignes de tendance et outils de mesure"
          onClick={handleTrendButtonClick}
        >
          {renderTrendToolIcon(isTrendToolActive ? activeTool : lastSelectedToolByCategory.trend, isTrendToolActive)}
          {renderSplitDropdownTrigger(isTrendDropdownOpen)}
        </button>


        <TrendToolDropdown
          counts={drawingCounts}
          isOpen={isTrendDropdownOpen}
          pos={trendDropdownPos}
          searchQuery={trendSearchQuery}
          onSearchChange={setTrendSearchQuery}
          onClose={() => setIsTrendDropdownOpen(false)}
          view={trendDropdownView}
          onViewChange={setTrendDropdownView}
          activeTool={activeTool}
          onSelectTool={handleSelectDrawingTool}
        />

        {/* --- FIBONACCI TOOLS SELECTOR --- */}
        <button
          ref={fibDropdownRef as React.RefObject<HTMLButtonElement>}
          className={clsx(
            "gp-toolbar-btn",
            "gp-toolbar-btn-split",
            "hover-lift",
            (isFibDropdownOpen || (!isTrendDropdownOpen && isFibToolActive)) ? "active" : "",
          )}
          title="Outils Fibonacci et Gann"
          onClick={handleFibButtonClick}
        >
          {renderCategoryToolIcon(isFibToolActive ? activeTool : lastSelectedToolByCategory.fib, isFibToolActive, <FibCategoryIcon />)}
          {renderSplitDropdownTrigger(isFibDropdownOpen)}
        </button>


        <FibToolDropdown
          counts={drawingCounts}
          isOpen={isFibDropdownOpen}
          pos={fibDropdownPos}
          searchQuery={fibSearchQuery}
          onSearchChange={setFibSearchQuery}
          onClose={() => setIsFibDropdownOpen(false)}
          view={fibDropdownView}
          onViewChange={setFibDropdownView}
          activeTool={activeTool}
          onSelectTool={handleSelectDrawingTool}
        />

        <button
          ref={chartPatternsDropdownRef as React.RefObject<HTMLButtonElement>}
          className={clsx(
            "gp-toolbar-btn",
            "gp-toolbar-btn-split",
            "hover-lift",
            (isChartPatternsDropdownOpen || (!isTrendDropdownOpen && !isFibDropdownOpen && isChartPatternsToolActive)) ? "active" : "",
          )}
          title="Figures chartistes"
          onClick={handleChartPatternsButtonClick}
        >
          {renderCategoryToolIcon(
            isChartPatternsToolActive ? activeTool : lastSelectedToolByCategory.chartPatterns,
            isChartPatternsToolActive,
            <PatternsCategoryIcon />,
          )}
          {renderSplitDropdownTrigger(isChartPatternsDropdownOpen)}
        </button>


        <ChartPatternsToolDropdown
          counts={drawingCounts}
          isOpen={isChartPatternsDropdownOpen}
          pos={chartPatternsDropdownPos}
          searchQuery={chartPatternsSearchQuery}
          onSearchChange={setChartPatternsSearchQuery}
          onClose={() => setIsChartPatternsDropdownOpen(false)}
          view={chartPatternsDropdownView}
          onViewChange={setChartPatternsDropdownView}
          activeTool={activeTool}
          onSelectTool={handleSelectDrawingTool}
        />

        <button
          ref={forecastingDropdownRef as React.RefObject<HTMLButtonElement>}
          className={clsx(
            "gp-toolbar-btn",
            "gp-toolbar-btn-split",
            "hover-lift",
            (isForecastingDropdownOpen || (!isTrendDropdownOpen && !isFibDropdownOpen && !isChartPatternsDropdownOpen && isForecastingToolActive)) ? "active" : "",
          )}
          title="Prévisions et profils de volume"
          onClick={handleForecastingButtonClick}
        >
          {renderCategoryToolIcon(
            isForecastingToolActive ? activeTool : lastSelectedToolByCategory.forecasting,
            isForecastingToolActive,
            <ForecastingCategoryIcon />,
          )}
          {renderSplitDropdownTrigger(isForecastingDropdownOpen)}
        </button>


        <ForecastingToolDropdown
          counts={drawingCounts}
          isOpen={isForecastingDropdownOpen}
          pos={forecastingDropdownPos}
          searchQuery={forecastingSearchQuery}
          onSearchChange={setForecastingSearchQuery}
          onClose={() => setIsForecastingDropdownOpen(false)}
          view={forecastingDropdownView}
          onViewChange={setForecastingDropdownView}
          activeTool={activeTool}
          onSelectTool={handleSelectDrawingTool}
        />

        <DrawingToolbarUtilityActions
          activeTool={activeTool}
          onSelectTool={handleSelectDrawingTool}
        />
      </div>

      <DrawingToolbarFooter
        activeTool={activeTool}
        isLockedAll={uiState.isLockedAll}
        areDrawingsHidden={uiState.areDrawingsHidden}
        onSelectTool={handleSelectDrawingTool}
        onGlobalLockToggle={handleGlobalLockToggle}
        onVisibilityToggle={handleVisibilityToggle}
        onClearAllDrawings={handleClearAllDrawings}
      />
    </aside >
  );
};
