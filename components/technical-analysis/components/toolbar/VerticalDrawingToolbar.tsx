"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import clsx from "clsx";

import {
  setCursorMode,
  toggleLockedAll,
  toggleAreDrawingsHidden,
  setModalOpen
} from "../../store/technicalAnalysisSlice";
import { selectUiState } from "../../store/selectors";
import type { AllToolType } from "../../config/drawing/drawingToolTypes";
import type { CursorModeType } from "../../config/state/uiStateTypes";
import {
  AnnotationCategoryIcon,
  FibCategoryIcon,
  ForecastingCategoryIcon,
  PatternsCategoryIcon,
} from "../common/icons/drawing/categories";
import { CursorModeSelector } from "./drawing/CursorModeSelector";
import {
  AnnotationToolDropdown,
  ChartPatternsToolDropdown,
  FibToolDropdown,
  ForecastingToolDropdown,
  TrendToolDropdown,
} from "./drawing/DrawingToolDropdown";
import { DrawingToolbarFooter, DrawingToolbarUtilityActions, type DrawingToolbarFooterMenu } from "./drawing/DrawingToolbarFooter";
import { VerticalToolbarScrollAffordance } from "./drawing/VerticalToolbarScrollAffordance";
import { getDrawingToolCounts } from "./drawing/drawingToolCounts";
import {
  createEmptyToolCategoryMemory,
  getActiveToolCategory,
  getToolMemoryBucket,
  isAnnotationToolActiveForTool,
  isBrushToolActiveForTool,
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

type DrawingToolbarAuxMenu = "cursor" | "icons" | DrawingToolbarFooterMenu;

interface VerticalDrawingToolbarProps {
  activeTool: AllToolType | null;
  setActiveTool: (tool: AllToolType | null) => void;
  mainContainerRef: React.RefObject<HTMLDivElement>;
  verticalToolbarRef?: React.RefObject<HTMLDivElement>;
  keepDrawing: boolean;
  onKeepDrawingChange: (enabled: boolean) => void;
  magnetMode: "off" | "weak" | "strong";
  onMagnetModeChange: (mode: "off" | "weak" | "strong") => void;
  onMagnetToggle: () => void;
  snapToIndicators: boolean;
  onSnapToIndicatorsChange: (enabled: boolean) => void;
  indicatorsLocked: boolean;
  onIndicatorsLockedChange: (locked: boolean) => void;
  areIndicatorsHidden: boolean;
  onIndicatorsHiddenChange: (hidden: boolean) => void;
  positionsOrdersHidden: boolean;
  onPositionsOrdersHiddenChange: (hidden: boolean) => void;
  onArmIconDrawing: (symbol: string) => void;
  onSetAllDrawingsLocked: (locked: boolean) => void;
  onSetAllDrawingsHidden: (hidden: boolean) => void;
  onRemoveAllDrawings: (includeLocked?: boolean) => void;
  onRemoveAllIndicators: () => void;
  indicatorCount: number;
  measureModeActive: boolean;
  onMeasureModeToggle: () => void;
  onMeasureModeCancel: () => void;
  zoomInModeActive: boolean;
  onZoomInModeToggle: () => void;
  onZoomInModeCancel: () => void;
  zoomOutVisible: boolean;
  onZoomOut: () => void;
  drawingCount: number;
  isInitialLoading?: boolean;
}

const DRAWING_TOOLBAR_VISIBLE_ITEM_COUNT = 14;

const VerticalDrawingToolbarLoadingOverlay = () => (
  <div
    aria-hidden="true"
    style={{
      position: "absolute",
      inset: 0,
      zIndex: 50,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 4,
      padding: 4,
      pointerEvents: "none",
      background: "var(--gp-bg-toolbar, #0d2136)",
      borderRadius: "var(--gp-radius-md)",
      overflow: "hidden",
    }}
  >
    {Array.from({ length: DRAWING_TOOLBAR_VISIBLE_ITEM_COUNT }, (_, index) => (
      <span
        key={`toolbar-${index}`}
        className="is-loading-skeleton"
        style={{
          display: "block",
          width: "var(--gp-toolbar-btn-size)",
          height: "var(--gp-toolbar-btn-size)",
          borderRadius: "var(--gp-radius-sm)",
          flexShrink: 0,
        }}
      />
    ))}
  </div>
);

export const VerticalDrawingToolbar: React.FC<VerticalDrawingToolbarProps> = ({
  activeTool,
  setActiveTool,
  mainContainerRef,
  verticalToolbarRef,
  keepDrawing,
  onKeepDrawingChange,
  magnetMode,
  onMagnetModeChange,
  onMagnetToggle,
  snapToIndicators,
  onSnapToIndicatorsChange,
  indicatorsLocked,
  onIndicatorsLockedChange,
  areIndicatorsHidden,
  onIndicatorsHiddenChange,
  positionsOrdersHidden,
  onPositionsOrdersHiddenChange,
  onArmIconDrawing,
  onSetAllDrawingsLocked,
  onSetAllDrawingsHidden,
  onRemoveAllDrawings,
  onRemoveAllIndicators,
  indicatorCount,
  measureModeActive,
  onMeasureModeToggle,
  onMeasureModeCancel,
  zoomInModeActive,
  onZoomInModeToggle,
  onZoomInModeCancel,
  zoomOutVisible,
  onZoomOut,
  drawingCount,
  isInitialLoading = false,
}) => {
  const dispatch = useDispatch();
  const uiState = useSelector(selectUiState);
  const cursorDropdownRef = useRef<HTMLButtonElement>(null);
  const [openAuxMenu, setOpenAuxMenu] = useState<DrawingToolbarAuxMenu | null>(null);
  const closeAuxMenus = useCallback(() => setOpenAuxMenu(null), []);

  const toolbarMenus = useDrawingToolbarMenuState(mainContainerRef, closeAuxMenus);
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
  const {
    isOpen: isAnnotationsDropdownOpen,
    setIsOpen: setIsAnnotationsDropdownOpen,
    pos: annotationsDropdownPos,
    anchorRef: annotationsDropdownRef,
    searchQuery: annotationsSearchQuery,
    setSearchQuery: setAnnotationsSearchQuery,
    view: annotationsDropdownView,
    setView: setAnnotationsDropdownView,
    toggle: toggleAnnotationsDropdown,
  } = toolbarMenus.annotations;
  const { closeAllDropdowns } = toolbarMenus;
  const [lastSelectedToolByCategory, setLastSelectedToolByCategory] = useState<ToolCategoryMemory>(createEmptyToolCategoryMemory);

  const isCursorDropdownOpen = openAuxMenu === "cursor";
  const [cursorDropdownPos, setCursorDropdownPos] = useState({ top: 0, left: 0 });

  const setExclusiveAuxMenu = useCallback((menu: DrawingToolbarAuxMenu | null) => {
    if (menu) closeAllDropdowns();
    setOpenAuxMenu(menu);
  }, [closeAllDropdowns]);

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

  const isBrushToolActive = useMemo(() => {
    return isBrushToolActiveForTool(activeTool);
  }, [activeTool]);

  const isDrawingToolActive = isTrendToolActive || isBrushToolActive;

  const isAnnotationToolActive = useMemo(() => {
    return isAnnotationToolActiveForTool(activeTool);
  }, [activeTool]);

  const isCursorActive = isCursorDropdownOpen || (activeTool === null && !isTrendDropdownOpen && !isFibDropdownOpen && !isChartPatternsDropdownOpen && !isForecastingDropdownOpen && !isAnnotationsDropdownOpen && !isDrawingToolActive && !isFibToolActive && !isChartPatternsToolActive && !isForecastingToolActive && !isAnnotationToolActive);

  // [TENOR 2026] Tool memory is now handled strictly via event handlers (handleSelectDrawingTool)
  // to prevent cascading renders and satisfy react-hooks/exhaustive-deps logic.


  const drawingCounts = useMemo(getDrawingToolCounts, []);

  const handleSelectDrawingTool = useCallback((toolId: AllToolType) => {
    onMeasureModeCancel();
    onZoomInModeCancel();
    // [IMAGE NOTE] Selecting the Image tool opens the insertion modal
    // immediately instead of arming the canvas (TradingView contract).
    if (toolId === "image_note") {
      dispatch(setModalOpen({ modal: "imageNote", isOpen: true }));
      closeAllDropdowns();
      closeAuxMenus();
      return;
    }
    const bucket = getToolMemoryBucket(toolId);
    if (bucket) {
      setLastSelectedToolByCategory((prev) => ({
        ...prev,
        [bucket]: toolId,
        ...((bucket === "trend" || bucket === "brush") ? { trend: toolId } : {}),
      }));
    }
    setActiveTool(toolId);
    dispatch(setCursorMode("cross"));
    closeAllDropdowns();
    closeAuxMenus();
    setFibDropdownView("categories");
    setForecastingDropdownView("categories");
    setAnnotationsDropdownView("categories");
  }, [closeAllDropdowns, closeAuxMenus, dispatch, onMeasureModeCancel, onZoomInModeCancel, setActiveTool, setFibDropdownView, setForecastingDropdownView, setAnnotationsDropdownView]);

  const toggleCursorDropdown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isCursorDropdownOpen) {
      setOpenAuxMenu(null);
      return;
    }
    if (cursorDropdownRef.current) {
      const rect = cursorDropdownRef.current.getBoundingClientRect();
      setCursorDropdownPos({ top: rect.top, left: rect.right + 15 });
      setExclusiveAuxMenu("cursor");
    }
  }, [isCursorDropdownOpen, setExclusiveAuxMenu]);

  const handleSelectCursorMode = useCallback((mode: CursorModeType) => {
    onZoomInModeCancel();
    dispatch(setCursorMode(mode));
    setActiveTool(null);
    setOpenAuxMenu(null);
  }, [dispatch, onZoomInModeCancel, setActiveTool]);

  const reactivateRememberedTool = useCallback((toolId: AllToolType | null) => {
    if (!toolId) return;

    setActiveTool(toolId);
    dispatch(setCursorMode("cross"));
    closeAllDropdowns();
    closeAuxMenus();
    setTrendDropdownView("categories");
    setFibDropdownView("categories");
    setChartPatternsDropdownView("categories");
    setForecastingDropdownView("categories");
    setAnnotationsDropdownView("categories");
  }, [
    closeAllDropdowns,
    closeAuxMenus,
    dispatch,
    setActiveTool,
    setTrendDropdownView,
    setFibDropdownView,
    setChartPatternsDropdownView,
    setForecastingDropdownView,
    setAnnotationsDropdownView,
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

  const handleAnnotationButtonClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (isSplitTriggerClick(event) || !lastSelectedToolByCategory.annotations) {
      toggleAnnotationsDropdown(event);
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    reactivateRememberedTool(lastSelectedToolByCategory.annotations);
  }, [isSplitTriggerClick, lastSelectedToolByCategory.annotations, reactivateRememberedTool, toggleAnnotationsDropdown]);

  const renderSplitDropdownTrigger = useCallback((isOpen: boolean) => isInitialLoading ? null : (
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
  ), [isInitialLoading]);

  const handleDrawingsLockToggle = () => {
    const nextLocked = !uiState.isLockedAll;
    onSetAllDrawingsLocked(nextLocked);
    dispatch(toggleLockedAll());
  };

  const handleIndicatorsLockToggle = () => {
    onIndicatorsLockedChange(!indicatorsLocked);
  };

  const handleGlobalLockToggle = () => {
    const nextLocked = !(uiState.isLockedAll && indicatorsLocked);
    if (uiState.isLockedAll !== nextLocked) {
      onSetAllDrawingsLocked(nextLocked);
      dispatch(toggleLockedAll());
    }
    onIndicatorsLockedChange(nextLocked);
  };

  const handleVisibilityToggle = () => {
    const nextHidden = !uiState.areDrawingsHidden;
    onSetAllDrawingsHidden(nextHidden);
    dispatch(toggleAreDrawingsHidden());
  };

  const handleHideAllToggle = () => {
    const nextHidden = !(uiState.areDrawingsHidden && areIndicatorsHidden && positionsOrdersHidden);
    if (uiState.areDrawingsHidden !== nextHidden) {
      onSetAllDrawingsHidden(nextHidden);
      dispatch(toggleAreDrawingsHidden());
    }
    onIndicatorsHiddenChange(nextHidden);
    onPositionsOrdersHiddenChange(nextHidden);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (cursorDropdownRef.current && !cursorDropdownRef.current.contains(target)) {
        setOpenAuxMenu(null);
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
      if (annotationsDropdownRef.current && !annotationsDropdownRef.current.contains(target) && !target.closest(".gp-cursor-dropdown-portal")) {
        setIsAnnotationsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [
    setIsFibDropdownOpen,
    setIsTrendDropdownOpen,
    setIsChartPatternsDropdownOpen,
    setIsForecastingDropdownOpen,
    setIsAnnotationsDropdownOpen,
    fibDropdownRef,
    trendDropdownRef,
    chartPatternsDropdownRef,
    forecastingDropdownRef,
    annotationsDropdownRef,
  ]);

  const toolsScrollRef = useRef<HTMLDivElement>(null);

  return (
    <aside
      ref={verticalToolbarRef}
      className={clsx(
        "gp-vertical-toolbar",
        "gsap-target-vertical-toolbar",
        "animated-element",
      )}
      style={{ position: "relative" }}
      data-indicators-locked={indicatorsLocked ? "true" : "false"}
      data-indicators-hidden={areIndicatorsHidden ? "true" : "false"}
      data-positions-orders-hidden={positionsOrdersHidden ? "true" : "false"}
      data-loading={isInitialLoading ? "true" : "false"}
    >
      {isInitialLoading && <VerticalDrawingToolbarLoadingOverlay />}
      <div className="gp-vertical-scroll-shell">
        <VerticalToolbarScrollAffordance viewportRef={toolsScrollRef} direction="up" />
      <div ref={toolsScrollRef} className="gp-toolbar-scroll-container">
        <CursorModeSelector
          cursorMode={uiState.cursorMode}
          isActive={isCursorActive}
          isOpen={isCursorDropdownOpen}
          position={cursorDropdownPos}
          buttonRef={cursorDropdownRef}
          onToggle={toggleCursorDropdown}
          onSelectMode={handleSelectCursorMode}
           activeDrawingTool={activeTool}
           onSelectDrawingTool={handleSelectDrawingTool}
        />

        {/* --- UNIFIED DRAWING TOOLS SELECTOR: TREND + BRUSH/ARROWS/SHAPES --- */}
        <button
          ref={trendDropdownRef as React.RefObject<HTMLButtonElement>}
          className={clsx(
            "gp-toolbar-btn",
            "hover-lift",
            (isTrendDropdownOpen || isDrawingToolActive) ? "active" : "",
          )}
          title="Outils de dessin — lignes, brosses, flèches et formes"
          onClick={handleTrendButtonClick}
        >
          {renderTrendToolIcon(isDrawingToolActive ? activeTool : lastSelectedToolByCategory.trend, isDrawingToolActive)}
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

        {/* --- ANNOTATION TOOLS SELECTOR --- */}
        <button
          ref={annotationsDropdownRef as React.RefObject<HTMLButtonElement>}
          className={clsx(
            "gp-toolbar-btn",
            "hover-lift",
            (isAnnotationsDropdownOpen || (!isTrendDropdownOpen && !isFibDropdownOpen && !isChartPatternsDropdownOpen && !isForecastingDropdownOpen && isAnnotationToolActive)) ? "active" : "",
          )}
          title="Annotation tools"
          onClick={handleAnnotationButtonClick}
        >
          {renderCategoryToolIcon(
            isAnnotationToolActive ? activeTool : lastSelectedToolByCategory.annotations,
            isAnnotationToolActive,
            <AnnotationCategoryIcon />,
          )}
          {renderSplitDropdownTrigger(isAnnotationsDropdownOpen)}
        </button>


        <AnnotationToolDropdown
          counts={drawingCounts}
          isOpen={isAnnotationsDropdownOpen}
          pos={annotationsDropdownPos}
          searchQuery={annotationsSearchQuery}
          onSearchChange={setAnnotationsSearchQuery}
          onClose={() => setIsAnnotationsDropdownOpen(false)}
          view={annotationsDropdownView}
          onViewChange={setAnnotationsDropdownView}
          activeTool={activeTool}
          onSelectTool={handleSelectDrawingTool}
        />

        <DrawingToolbarUtilityActions
          measureActive={measureModeActive}
          iconPickerOpen={openAuxMenu === "icons"}
          onIconPickerOpenChange={(open) => setExclusiveAuxMenu(open ? "icons" : null)}
          onMeasureToggle={onMeasureModeToggle}
          onArmIconDrawing={(symbol) => {
            onZoomInModeCancel();
            onArmIconDrawing(symbol);
            dispatch(setCursorMode("cross"));
          }}
          zoomInActive={zoomInModeActive}
          onZoomInToggle={onZoomInModeToggle}
          zoomOutVisible={zoomOutVisible}
          onZoomOut={onZoomOut}
        />
      </div>
        <VerticalToolbarScrollAffordance viewportRef={toolsScrollRef} direction="down" />
      </div>

      <DrawingToolbarFooter
        openMenu={openAuxMenu === "magnet" || openAuxMenu === "lock" || openAuxMenu === "hide" || openAuxMenu === "remove" ? openAuxMenu : null}
        onOpenMenuChange={(menu) => setExclusiveAuxMenu(menu)}
        keepDrawing={keepDrawing}
        onKeepDrawingChange={onKeepDrawingChange}
        magnetMode={magnetMode}
        onMagnetModeChange={onMagnetModeChange}
        onMagnetToggle={onMagnetToggle}
        snapToIndicators={snapToIndicators}
        onSnapToIndicatorsChange={onSnapToIndicatorsChange}
        isLockedAll={uiState.isLockedAll}
        areDrawingsHidden={uiState.areDrawingsHidden}
        drawingCount={drawingCount}
        indicatorCount={indicatorCount}
        indicatorsLocked={indicatorsLocked}
        areIndicatorsHidden={areIndicatorsHidden}
        positionsOrdersHidden={positionsOrdersHidden}
        onDrawingsLockToggle={handleDrawingsLockToggle}
        onIndicatorsLockToggle={handleIndicatorsLockToggle}
        onGlobalLockToggle={handleGlobalLockToggle}
        onVisibilityToggle={handleVisibilityToggle}
        onIndicatorsVisibilityToggle={() => onIndicatorsHiddenChange(!areIndicatorsHidden)}
        onPositionsOrdersVisibilityToggle={() => onPositionsOrdersHiddenChange(!positionsOrdersHidden)}
        onHideAllToggle={handleHideAllToggle}
        onRemoveAllDrawings={onRemoveAllDrawings}
        onRemoveAllIndicators={onRemoveAllIndicators}
      />
    </aside >
  );
};
