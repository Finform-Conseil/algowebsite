import React from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { useTechnicalAnalysisPortalTarget } from "@/components/technical-analysis/components/common/portal/useTechnicalAnalysisPortalTarget";
import {
  FLOATING_TOOLBAR_BUTTON_SIZE_PX,
  FLOATING_TOOLBAR_DRAG_SLOT_WIDTH_PX,
  FLOATING_TOOLBAR_GAP_PX,
  FLOATING_TOOLBAR_HEIGHT_PX,
  FLOATING_TOOLBAR_HORIZONTAL_PADDING_PX,
  FloatingToolbarDragHandle,
  FloatingToolbarShell,
} from "@/components/technical-analysis/components/toolbar/floating/FloatingToolbarShell";

import type { CursorModeType } from "../../../config/state/uiStateTypes";
import type { AllToolType } from "../../../config/drawing/drawingToolTypes";
import { getDrawingToolIcon } from "../../../config/drawing/drawingToolIconRegistry";
import { useDrawingFavorites } from "./DrawingToolDropdown";
import { ACCENT_GOLD, ACTIVE_BLUE } from "./drawingToolbarTheme";

type CursorDropdownPosition = {
  top: number;
  left: number;
};

interface CursorModeSelectorProps {
  cursorMode: CursorModeType;
  isActive: boolean;
  isOpen: boolean;
  position: CursorDropdownPosition;
  buttonRef: React.RefObject<HTMLButtonElement>;
  onToggle: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onSelectMode: (mode: CursorModeType) => void;
  activeDrawingTool: AllToolType | null;
  onSelectDrawingTool: (tool: AllToolType) => void;
}

const cursorModes: Array<{
  id: CursorModeType;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    id: "cross",
    label: "Croisée",
    icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="1.5"><path d="M12 5V3M12 21v-2M5 12H3M21 12h-2M12 19v-4M12 9V5M19 12h-4M9 12H5"></path></svg>,
  },
  {
    id: "cross-tooltip",
    label: "Croisée + Info",
    icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="1.5"><path d="M12 5V3M12 21v-2M5 12H3M21 12h-2M12 19v-4M12 9V5M19 12h-4M9 12H5"></path></svg>,
  },
  {
    id: "dot",
    label: "Point",
    icon: <i className="bi bi-circle-fill" style={{ fontSize: "0.45rem" }}></i>,
  },
  {
    id: "arrow",
    label: "Flèche",
    icon: <i className="bi bi-cursor-fill"></i>,
  },
  {
    id: "arrow-tooltip",
    label: "Flèche + Info",
    icon: <i className="bi bi-cursor-fill"></i>,
  },
  {
    id: "demonstration",
    label: "Présentation",
    icon: <i className="bi bi-hand-index-thumb-fill" style={{ color: ACCENT_GOLD }}></i>,
  },
  {
    id: "magic",
    label: "Baguette visuelle",
    icon: <i className="bi bi-magic" style={{ color: ACCENT_GOLD }}></i>,
  },
  {
    id: "eraser",
    label: "Gomme",
    icon: <i className="bi bi-eraser-fill"></i>,
  },
];

const CURSOR_FAVORITES_STORAGE_KEY = "finform.ta.cursor-favorites.v1";
const CURSOR_FAVORITES_POSITION_STORAGE_KEY = "finform.ta.cursor-favorites-position.v1";
const FAVORITES_DEFAULT_X_RATIO = 0.5;
const FAVORITES_DEFAULT_Y_RATIO = 0.02;
const FAVORITES_HANDLE_WIDTH = FLOATING_TOOLBAR_DRAG_SLOT_WIDTH_PX;
const FAVORITES_ITEM_WIDTH = FLOATING_TOOLBAR_BUTTON_SIZE_PX;
const FAVORITES_TOOLBAR_HEIGHT = FLOATING_TOOLBAR_HEIGHT_PX;
const FAVORITES_TOOLBAR_HORIZONTAL_PADDING = FLOATING_TOOLBAR_HORIZONTAL_PADDING_PX * 2;
const FAVORITES_TOOLBAR_GAP = FLOATING_TOOLBAR_GAP_PX;
const FAVORITES_CHART_MARGIN = 8;

type CursorFavoritesPosition = {
  left: number;
  top: number;
};

type CursorFavoritesPlacement = {
  xRatio: number;
  yRatio: number;
};

const DEFAULT_FAVORITES_PLACEMENT: CursorFavoritesPlacement = {
  xRatio: FAVORITES_DEFAULT_X_RATIO,
  yRatio: FAVORITES_DEFAULT_Y_RATIO,
};

const isCursorMode = (value: unknown): value is CursorModeType =>
  typeof value === "string" && cursorModes.some((mode) => mode.id === value);

const getFavoritesChartRect = (): DOMRect | null => {
  if (typeof document === "undefined") return null;
  const chart = (
    document.querySelector(".gp-multi-chart-cell.active .gp-chart-layers-stack")
    ?? document.querySelector(".gp-chart-layers-stack")
    ?? document.querySelector(".gp-chart-view-wrapper")
  ) as HTMLElement | null;
  return chart?.getBoundingClientRect() ?? null;
};

const getFavoritesToolbarWidth = (favoriteCount: number) => {
  const count = Math.max(1, favoriteCount);
  return FAVORITES_TOOLBAR_HORIZONTAL_PADDING
    + FAVORITES_HANDLE_WIDTH
    + FAVORITES_TOOLBAR_GAP
    + FAVORITES_ITEM_WIDTH * count
    + FAVORITES_TOOLBAR_GAP * Math.max(0, count - 1);
};

const clampUnit = (value: number) => Math.min(1, Math.max(0, value));

const positionFromPlacement = (
  placement: CursorFavoritesPlacement,
  favoriteCount: number,
  chartRect: DOMRect | null = getFavoritesChartRect(),
): CursorFavoritesPosition => {
  if (!chartRect) return { left: FAVORITES_CHART_MARGIN, top: FAVORITES_CHART_MARGIN };
  const width = getFavoritesToolbarWidth(favoriteCount);
  const availableX = Math.max(0, chartRect.width - width - FAVORITES_CHART_MARGIN * 2);
  const availableY = Math.max(0, chartRect.height - FAVORITES_TOOLBAR_HEIGHT - FAVORITES_CHART_MARGIN * 2);
  return {
    left: chartRect.left + FAVORITES_CHART_MARGIN + availableX * clampUnit(placement.xRatio),
    top: chartRect.top + FAVORITES_CHART_MARGIN + availableY * clampUnit(placement.yRatio),
  };
};

const placementFromPosition = (
  position: CursorFavoritesPosition,
  favoriteCount: number,
  chartRect: DOMRect | null = getFavoritesChartRect(),
): CursorFavoritesPlacement => {
  if (!chartRect) return DEFAULT_FAVORITES_PLACEMENT;
  const width = getFavoritesToolbarWidth(favoriteCount);
  const availableX = Math.max(1, chartRect.width - width - FAVORITES_CHART_MARGIN * 2);
  const availableY = Math.max(1, chartRect.height - FAVORITES_TOOLBAR_HEIGHT - FAVORITES_CHART_MARGIN * 2);
  return {
    xRatio: clampUnit((position.left - chartRect.left - FAVORITES_CHART_MARGIN) / availableX),
    yRatio: clampUnit((position.top - chartRect.top - FAVORITES_CHART_MARGIN) / availableY),
  };
};

const clampFavoritesPosition = (
  position: CursorFavoritesPosition,
  favoriteCount: number,
  chartRect: DOMRect | null = getFavoritesChartRect(),
): CursorFavoritesPosition => {
  if (!chartRect) return positionFromPlacement(DEFAULT_FAVORITES_PLACEMENT, favoriteCount, chartRect);
  const width = getFavoritesToolbarWidth(favoriteCount);
  const minLeft = chartRect.left + FAVORITES_CHART_MARGIN;
  const maxLeft = Math.max(minLeft, chartRect.right - width - FAVORITES_CHART_MARGIN);
  const minTop = chartRect.top + FAVORITES_CHART_MARGIN;
  const maxTop = Math.max(minTop, chartRect.bottom - FAVORITES_TOOLBAR_HEIGHT - FAVORITES_CHART_MARGIN);
  return {
    left: Math.min(Math.max(minLeft, position.left), maxLeft),
    top: Math.min(Math.max(minTop, position.top), maxTop),
  };
};

const renderCursorIcon = (cursorMode: CursorModeType, isActive: boolean) => {
  if (cursorMode.includes("cross")) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={isActive ? ACTIVE_BLUE : "currentColor"}
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
          fill={isActive ? ACTIVE_BLUE : "currentColor"}
          opacity={cursorMode === "cross-tooltip" ? 0.5 : 1}
        />
      </svg>
    );
  }

  if (cursorMode === "dot") {
    return (
      <i
        className="bi bi-circle-fill"
        style={{ fontSize: "0.5rem", color: isActive ? ACTIVE_BLUE : "inherit" }}
      ></i>
    );
  }

  if (cursorMode.includes("arrow")) {
    return <i className="bi bi-cursor-fill" style={{ color: isActive ? ACTIVE_BLUE : "inherit" }}></i>;
  }

  if (cursorMode === "demonstration") {
    return <i className="bi bi-hand-index-thumb-fill" style={{ color: ACCENT_GOLD }}></i>;
  }

  if (cursorMode === "magic") {
    return <i className="bi bi-magic" style={{ color: isActive ? ACTIVE_BLUE : "inherit" }}></i>;
  }

  if (cursorMode === "eraser") {
    return <i className="bi bi-eraser-fill" style={{ color: isActive ? ACTIVE_BLUE : "inherit" }}></i>;
  }

  return null;
};

export const CursorModeSelector: React.FC<CursorModeSelectorProps> = ({
  cursorMode,
  isActive,
  isOpen,
  position,
  buttonRef,
  onToggle,
  onSelectMode,
  activeDrawingTool,
  onSelectDrawingTool,
}) => {
  const portalTarget = useTechnicalAnalysisPortalTarget();
  const { favorites: drawingFavorites } = useDrawingFavorites();
  const [favorites, setFavorites] = React.useState<CursorModeType[]>([]);
  const [favoritesHydrated, setFavoritesHydrated] = React.useState(false);
  const favoriteCount = favorites.length + drawingFavorites.length;
  const [favoritesPlacement, setFavoritesPlacement] = React.useState<CursorFavoritesPlacement>(
    DEFAULT_FAVORITES_PLACEMENT,
  );
  const [favoritesPosition, setFavoritesPosition] = React.useState<CursorFavoritesPosition>(
    () => positionFromPlacement(DEFAULT_FAVORITES_PLACEMENT, 1),
  );
  const dragStateRef = React.useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originLeft: number;
    originTop: number;
  } | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedFavorites = JSON.parse(window.localStorage.getItem(CURSOR_FAVORITES_STORAGE_KEY) ?? "[]");
      if (Array.isArray(storedFavorites)) {
        setFavorites(storedFavorites.filter(isCursorMode));
      }
    } catch {
      setFavorites([]);
    }

    const chartRect = getFavoritesChartRect();
    try {
      const storedPosition = JSON.parse(
        window.localStorage.getItem(CURSOR_FAVORITES_POSITION_STORAGE_KEY) ?? "null",
      ) as Partial<CursorFavoritesPosition & CursorFavoritesPlacement> | null;
      let placement = DEFAULT_FAVORITES_PLACEMENT;
      if (
        storedPosition
        && typeof storedPosition.xRatio === "number"
        && Number.isFinite(storedPosition.xRatio)
        && typeof storedPosition.yRatio === "number"
        && Number.isFinite(storedPosition.yRatio)
      ) {
        placement = {
          xRatio: clampUnit(storedPosition.xRatio),
          yRatio: clampUnit(storedPosition.yRatio),
        };
      } else if (
        storedPosition
        && typeof storedPosition.left === "number"
        && Number.isFinite(storedPosition.left)
        && typeof storedPosition.top === "number"
        && Number.isFinite(storedPosition.top)
      ) {
        placement = placementFromPosition({
          left: storedPosition.left,
          top: storedPosition.top,
        }, 1, chartRect);
      }
      setFavoritesPlacement(placement);
      setFavoritesPosition(positionFromPlacement(placement, 1, chartRect));
      window.localStorage.setItem(CURSOR_FAVORITES_POSITION_STORAGE_KEY, JSON.stringify(placement));
    } catch {
      setFavoritesPlacement(DEFAULT_FAVORITES_PLACEMENT);
      setFavoritesPosition(positionFromPlacement(DEFAULT_FAVORITES_PLACEMENT, 1, chartRect));
    }

    setFavoritesHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!favoritesHydrated || typeof window === "undefined") return;
    window.localStorage.setItem(CURSOR_FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    setFavoritesPosition(positionFromPlacement(favoritesPlacement, favoriteCount));
  }, [favorites, favoritesHydrated, favoritesPlacement, favoriteCount]);

  React.useEffect(() => {
    if (!favoritesHydrated || typeof window === "undefined") return;
    const syncToChart = () => {
      setFavoritesPosition(positionFromPlacement(favoritesPlacement, favoriteCount));
    };
    syncToChart();

    const chart = (
      document.querySelector(".gp-multi-chart-cell.active .gp-chart-layers-stack")
      ?? document.querySelector(".gp-chart-layers-stack")
      ?? document.querySelector(".gp-chart-view-wrapper")
    ) as HTMLElement | null;
    const resizeObserver = typeof ResizeObserver !== "undefined" && chart
      ? new ResizeObserver(syncToChart)
      : null;
    if (chart) resizeObserver?.observe(chart);
    const frame = window.requestAnimationFrame(syncToChart);

    window.addEventListener("resize", syncToChart);
    window.addEventListener("scroll", syncToChart, true);
    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", syncToChart);
      window.removeEventListener("scroll", syncToChart, true);
    };
  }, [favoriteCount, favoritesHydrated, favoritesPlacement]);

  const toggleFavorite = React.useCallback((
    event: React.MouseEvent<HTMLButtonElement> | React.PointerEvent<HTMLButtonElement>,
    mode: CursorModeType,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setFavorites((current) => (
      current.includes(mode)
        ? current.filter((favorite) => favorite !== mode)
        : [...current, mode]
    ));
  }, []);

  const handleFavoriteSelect = React.useCallback((
    event: React.MouseEvent<HTMLButtonElement> | React.PointerEvent<HTMLButtonElement>,
    mode: CursorModeType,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    onSelectMode(mode);
  }, [onSelectMode]);

  const handleFavoritesDragStart = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originLeft: favoritesPosition.left,
      originTop: favoritesPosition.top,
    };
  }, [favoritesPosition.left, favoritesPosition.top]);

  const handleFavoritesDragMove = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !event.isPrimary) return;
    event.preventDefault();
    event.stopPropagation();
    setFavoritesPosition(clampFavoritesPosition({
      left: drag.originLeft + event.clientX - drag.startX,
      top: drag.originTop + event.clientY - drag.startY,
    }, favoriteCount));
  }, [favoriteCount]);

  const handleFavoritesDragEnd = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    dragStateRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {}
    setFavoritesPosition((current) => {
      const next = clampFavoritesPosition(current, favoriteCount);
      const placement = placementFromPosition(next, favoriteCount);
      setFavoritesPlacement(placement);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(CURSOR_FAVORITES_POSITION_STORAGE_KEY, JSON.stringify(placement));
      }
      return positionFromPlacement(placement, favoriteCount);
    });
  }, [favoriteCount]);

  const favoriteModes = React.useMemo(
    () => favorites
      .map((favorite) => cursorModes.find((mode) => mode.id === favorite))
      .filter((mode): mode is (typeof cursorModes)[number] => Boolean(mode)),
    [favorites],
  );

  return (
  <>
    <button
      ref={buttonRef}
      type="button"
      className={clsx("gp-toolbar-btn", "hover-lift", isActive && "active")}
      title={`Mode de curseur : ${cursorMode}`}
      onClick={onToggle}
    >
      {renderCursorIcon(cursorMode, isActive)}
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
    </button>

    {isOpen &&
      typeof document !== "undefined" &&
      !!portalTarget &&
      createPortal(
        <div
          className="gp-cursor-dropdown-portal"
          role="treegrid"
          aria-label="Cursor modes"
          style={{
            position: "fixed",
            top: position.top,
            left: position.left,
          }}
        >
          {cursorModes.map((mode) => {
            const isSelected = cursorMode === mode.id;
            const isFavorite = favorites.includes(mode.id);
            const selectMode = (event: React.MouseEvent<HTMLButtonElement> | React.PointerEvent<HTMLButtonElement>) => {
              event.preventDefault();
              event.stopPropagation();
              onSelectMode(mode.id);
            };

            return (
              <div
                key={mode.id}
                className={clsx("gp-cursor-option-row", isSelected && "active")}
                role="row"
                aria-selected={isSelected}
              >
                <button
                  type="button"
                  className={clsx("gp-cursor-option", isSelected && "active")}
                  aria-pressed={isSelected}
                  aria-label={`Activer le mode ${mode.label}`}
                  onPointerDown={selectMode}
                  onClick={selectMode}
                >
                  <span className="icon-container" aria-hidden="true">{mode.icon}</span>
                  <span className="gp-cursor-label">{mode.label}</span>
                </button>
                <button
                  type="button"
                  className={clsx("gp-cursor-favorite-button", isFavorite && "is-favorite")}
                  data-qa-id="preset-menu-favorite-button"
                  aria-pressed={isFavorite}
                  aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={(event) => toggleFavorite(event, mode.id)}
                >
                  <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">
                    <path d="M9 2.13l1.903 3.855.116.236.26.038 4.255.618-3.079 3.001-.188.184.044.26.727 4.238L9.1 13.742 9 13.69l-.1.052-3.806 2.001.727-4.238.044-.26-.188-.184-3.079-3.001 4.255-.618.26-.038.116-.236L9 2.13Z" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>,
        portalTarget,
      )}

    {favoritesHydrated &&
      favoriteCount > 0 &&
      typeof document !== "undefined" &&
      !!portalTarget &&
      createPortal(
        <FloatingToolbarShell
          className="gp-cursor-favorites-toolbar"
          data-cursor-favorites-toolbar="true"
          style={{
            left: favoritesPosition.left,
            top: favoritesPosition.top,
            width: getFavoritesToolbarWidth(favoriteCount),
          }}
        >
          <FloatingToolbarDragHandle
            className="gp-cursor-favorites-drag"
            data-cursor-favorites-drag="true"
            title="Move favorites toolbar"
            aria-label="Move favorites toolbar"
            role="button"
            tabIndex={0}
            onPointerDown={handleFavoritesDragStart}
            onPointerMove={handleFavoritesDragMove}
            onPointerUp={handleFavoritesDragEnd}
            onPointerCancel={handleFavoritesDragEnd}
          />
          <div className="gp-cursor-favorites-content">
            {favoriteModes.map((mode) => {
              const isSelected = cursorMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  className={clsx("gp-toolbar-btn", "gp-cursor-favorites-item", isSelected && "active")}
                  data-name={`FavoriteToolbar${mode.id.replaceAll("-", "")}`}
                  title={mode.label}
                  aria-label={mode.label}
                  aria-pressed={isSelected}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={(event) => handleFavoriteSelect(event, mode.id)}
                >
                  {renderCursorIcon(mode.id, isSelected)}
                </button>
              );
            })}
          </div>
          <div className="gp-cursor-favorites-content">
            {drawingFavorites.filter((toolId): toolId is NonNullable<AllToolType> => toolId !== null).map((toolId) => (
              <button
                key={`drawing-${toolId}`}
                type="button"
                className={clsx("gp-toolbar-btn", "gp-cursor-favorites-item", activeDrawingTool === toolId && "active")}
                aria-label={`Activer l'outil favori ${toolId}`}
                aria-pressed={activeDrawingTool === toolId}
                title={toolId.replaceAll("_", " ")}
                onClick={() => onSelectDrawingTool(toolId)}
              >
                {getDrawingToolIcon(toolId)}
              </button>
            ))}
          </div>
        </FloatingToolbarShell>,
        portalTarget,
      )}
  </>
  );
};
