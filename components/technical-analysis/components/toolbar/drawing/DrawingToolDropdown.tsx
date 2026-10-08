import React from "react";
import clsx from "clsx";
import type { AllToolType } from "../../../config/drawing/drawingToolTypes";
import { getDrawingToolIcon } from "../../../config/drawing/drawingToolIconRegistry";
import { TOOL_CATEGORIES } from "../../../config/drawing/drawingConstants";
import { ToolPortal } from "../../common/primitives/ToolPortal";
import type { DrawingToolCounts } from "./drawingToolCounts";
import {
  filterAnnotationTools,
  filterBrushTools,
  filterChartPatternTools,
  filterForecastingTools,
  filterTrendTools,
  getFibDropdownTools,
  type AnnotationDropdownView,
  type ChartPatternsDropdownView,
  type FibDropdownView,
  type ForecastingDropdownView,
  type TrendDropdownView,
} from "./drawingToolFilters";
import { cloneIconWithActiveState } from "./toolIconCatalog";

type ToolPortalPosition = {
  top: number;
  left: number;
  maxHeight: number;
};

interface BaseDropdownProps<View extends string> {
  isOpen: boolean;
  pos: ToolPortalPosition;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClose: () => void;
  view: View;
  onViewChange: (view: View) => void;
  activeTool: AllToolType | null;
  onSelectTool: (toolId: AllToolType) => void;
}

const headerStyle: React.CSSProperties = { padding: "8px 12px 6px 12px", fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.4)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", marginBottom: "4px", userSelect: "none" };

const DRAWING_FAVORITES_KEY = "finform.ta.drawing-tool-favorites.v1";
const favoriteListeners = new Set<() => void>();
const favoriteSnapshot = () => {
  if (typeof window === "undefined") return "[]";
  try { return window.localStorage.getItem(DRAWING_FAVORITES_KEY) ?? "[]"; }
  catch { return "[]"; }
};
const subscribeFavorites = (listener: () => void) => {
  favoriteListeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === DRAWING_FAVORITES_KEY || event.key === null) listener();
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    favoriteListeners.delete(listener);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
};
export const useDrawingFavorites = () => {
  const snapshot = React.useSyncExternalStore(subscribeFavorites, favoriteSnapshot, () => "[]");
  const favorites = React.useMemo(() => {
    try {
      const values: unknown = JSON.parse(snapshot);
      return Array.isArray(values) ? values.filter((value): value is AllToolType => typeof value === "string") : [];
    } catch { return [] as AllToolType[]; }
  }, [snapshot]);
  const toggle = React.useCallback((id: AllToolType) => {
    const next = favorites.includes(id) ? favorites.filter((value) => value !== id) : [...favorites, id];
    try { window.localStorage.setItem(DRAWING_FAVORITES_KEY, JSON.stringify(next)); }
    catch { return; }
    favoriteListeners.forEach((listener) => listener());
  }, [favorites]);
  return { favorites, toggle };
};

const ToolRow: React.FC<{
  tool: { id: AllToolType; label: string; category?: string };
  isActive: boolean;
  showCategory?: boolean;
  useClonedIcon?: boolean;
  onSelect: (toolId: AllToolType) => void;
}> = ({ tool, isActive, showCategory = false, useClonedIcon = false, onSelect }) => {
  const { favorites, toggle } = useDrawingFavorites();
  const isFavorite = favorites.includes(tool.id);
  return (
    <div className={clsx("gp-cursor-option-row", "gp-drawing-tool-option-row", isActive && "active")}>
      <button
        type="button"
        className={clsx("gp-cursor-option", isActive && "active")}
        title={tool.label ?? tool.id}
        aria-pressed={isActive}
        onClick={() => onSelect(tool.id)}
      >
        <span className="icon-container" aria-hidden="true">
          {useClonedIcon ? cloneIconWithActiveState(getDrawingToolIcon(tool.id), isActive) : getDrawingToolIcon(tool.id)}
        </span>
        {showCategory ? (
          <span className="gp-drawing-tool-option-label">
            <span className="gp-cursor-label">{tool.label || ""}</span>
            <span className="gp-drawing-tool-option-category">{tool.category}</span>
          </span>
        ) : <span className="gp-cursor-label">{tool.label || ""}</span>}
      </button>
      <button
        type="button"
        className={clsx("gp-cursor-favorite-button", isFavorite && "is-favorite")}
        aria-label={`${isFavorite ? "Retirer" : "Ajouter"} ${tool.label} ${isFavorite ? "des" : "aux"} favoris`}
        aria-pressed={isFavorite}
        onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); }}
        onClick={(event) => { event.stopPropagation(); toggle(tool.id); }}
      >
        <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">
          <path d="M9 2.13l1.903 3.855.116.236.26.038 4.255.618-3.079 3.001-.188.184.044.26.727 4.238L9.1 13.742 9 13.69l-.1.052-3.806 2.001.727-4.238.044-.26-.188-.184-3.079-3.001 4.255-.618.26-.038.116-.236L9 2.13Z" />
        </svg>
      </button>
    </div>
  );
};

const DRAWING_CATALOG_SECTIONS = [
  { id: "drawing_tools", label: "LIGNES ET MESURES", kind: "trend", category: TOOL_CATEGORIES.LINES_MEASURES },
  { id: "channels", label: "CANAUX", kind: "trend", category: TOOL_CATEGORIES.CHANNELS },
  { id: "pitchforks", label: "FOURCHETTES", kind: "trend", category: TOOL_CATEGORIES.PITCHFORKS },
  { id: "brushes", label: "BROSSES", kind: "brush", view: "brushes" },
  { id: "arrows", label: "FLÈCHES", kind: "brush", view: "arrows" },
  { id: "formes", label: "FORMES", kind: "brush", view: "formes" },
] as const;

export const TrendToolDropdown: React.FC<BaseDropdownProps<TrendDropdownView> & {
  counts: DrawingToolCounts;
}> = ({
  isOpen,
  pos,
  searchQuery,
  onSearchChange,
  onClose,
  activeTool,
  onSelectTool,
}) => {
  const filteredTrendTools = filterTrendTools(searchQuery);
  const visibleSections = DRAWING_CATALOG_SECTIONS
    .map((section) => ({
      ...section,
      tools: section.kind === "trend"
        ? filteredTrendTools.filter((tool) => tool.category === section.category)
        : filterBrushTools(section.view, searchQuery),
    }))
    .filter((section) => section.tools.length > 0);

  const selectTool = (toolId: AllToolType) => {
    onSelectTool(toolId);
    onSearchChange("");
    onClose();
  };

  return (
    <ToolPortal
      isOpen={isOpen}
      pos={pos}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      onClose={onClose}
      placeholder="Rechercher un outil de dessin..."
      searchInputId="trend-tool-search"
      searchInputName="trendToolSearch"
      searchInputLabel="Rechercher un outil de dessin"
    >
      <div className="gp-drawing-tool-catalog gp-unified-drawing-tool-catalog" style={{ display: "flex", flexDirection: "column", minWidth: "292px", padding: "2px 0 6px" }}>
        {visibleSections.length > 0 ? (
          visibleSections.map((section, sectionIndex) => (
            <section
              key={section.id}
              aria-labelledby={`trend-catalog-${section.id}`}
              style={{
                borderTop: sectionIndex === 0 ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
                paddingTop: sectionIndex === 0 ? 0 : "5px",
                marginTop: sectionIndex === 0 ? 0 : "5px",
              }}
            >
              <div
                id={`trend-catalog-${section.id}`}
                style={{ ...headerStyle, borderBottom: "none", marginBottom: "1px", paddingTop: "7px", paddingBottom: "4px" }}
              >
                {section.label}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1px" }}>
                {section.tools.map((tool) => (
                  <ToolRow
                    key={tool.id}
                    tool={tool}
                    isActive={activeTool === tool.id}
                    useClonedIcon
                    onSelect={selectTool}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div style={{ padding: "20px", textAlign: "center", color: "#787b86", fontSize: "12px" }}>Aucun outil trouvé</div>
        )}
      </div>
    </ToolPortal>
  );
};

const FIB_CATALOG_SECTIONS = [
  { id: "fibonacci", label: "FIBONACCI", view: "fibonacci" as const },
  { id: "gann", label: "GANN", view: "gann" as const },
] as const;

export const FibToolDropdown: React.FC<BaseDropdownProps<FibDropdownView> & {
  counts: DrawingToolCounts;
}> = (props) => {
  const fibQuery = props.searchQuery.trim().toLowerCase();
  const visibleFibSections = FIB_CATALOG_SECTIONS
    .map((section) => ({
      ...section,
      tools: getFibDropdownTools(section.view).filter((tool) => {
        if (!fibQuery) return true;
        return (
          (tool.label?.toLowerCase() || "").includes(fibQuery) ||
          tool.id.toLowerCase().includes(fibQuery)
        );
      }),
    }))
    .filter((section) => section.tools.length > 0);

  const selectFibTool = (toolId: AllToolType) => {
    props.onSelectTool(toolId);
    props.onSearchChange("");
    props.onClose();
  };

  return (
    <ToolPortal
      isOpen={props.isOpen}
      pos={props.pos}
      searchQuery={props.searchQuery}
      onSearchChange={props.onSearchChange}
      onClose={props.onClose}
      placeholder="Rechercher un outil Fibonacci..."
      searchInputId="fib-tool-search"
      searchInputName="fibToolSearch"
      searchInputLabel="Rechercher un outil Fibonacci"
    >
      <div
        className="gp-drawing-tool-catalog gp-fib-tool-catalog"
        style={{ display: "flex", flexDirection: "column", minWidth: "292px", padding: "2px 0 6px" }}
      >
        {visibleFibSections.length > 0 ? (
          visibleFibSections.map((section, sectionIndex) => (
            <section
              key={section.id}
              aria-labelledby={`fib-catalog-${section.id}`}
              style={{
                borderTop: sectionIndex === 0 ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
                paddingTop: sectionIndex === 0 ? 0 : "5px",
                marginTop: sectionIndex === 0 ? 0 : "5px",
              }}
            >
              <div
                id={`fib-catalog-${section.id}`}
                style={{ ...headerStyle, borderBottom: "none", marginBottom: "1px", paddingTop: "7px", paddingBottom: "4px" }}
              >
                {section.label}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1px" }}>
                {section.tools.map((tool) => (
                  <ToolRow
                    key={tool.id}
                    tool={tool}
                    isActive={props.activeTool === tool.id}
                    useClonedIcon
                    onSelect={selectFibTool}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div style={{ padding: "20px", textAlign: "center", color: "#787b86", fontSize: "12px" }}>
            Aucun outil trouvé
          </div>
        )}
      </div>
    </ToolPortal>
  );
};

const CHART_PATTERN_CATALOG_SECTIONS = [
  { id: "patterns", label: "FIGURES CHARTISTES", view: "patterns" as const },
  { id: "elliott", label: "VAGUES D'ELLIOTT", view: "elliott" as const },
  { id: "cycles", label: "CYCLES", view: "cycles" as const },
] as const;

export const ChartPatternsToolDropdown: React.FC<BaseDropdownProps<ChartPatternsDropdownView> & {
  counts: DrawingToolCounts;
}> = (props) => {
  const visibleChartPatternSections = CHART_PATTERN_CATALOG_SECTIONS
    .map((section) => ({
      ...section,
      tools: filterChartPatternTools(section.view, props.searchQuery),
    }))
    .filter((section) => section.tools.length > 0);

  const selectChartPatternTool = (toolId: AllToolType) => {
    props.onSelectTool(toolId);
    props.onSearchChange("");
    props.onClose();
  };

  return (
    <ToolPortal
      isOpen={props.isOpen}
      pos={props.pos}
      searchQuery={props.searchQuery}
      onSearchChange={props.onSearchChange}
      onClose={props.onClose}
      placeholder="Rechercher une figure chartiste..."
      searchInputId="chart-pattern-tool-search"
      searchInputName="chartPatternToolSearch"
      searchInputLabel="Rechercher une figure chartiste"
    >
      <div
        className="gp-drawing-tool-catalog gp-chart-pattern-tool-catalog"
        style={{ display: "flex", flexDirection: "column", minWidth: "292px", padding: "2px 0 6px" }}
      >
        {visibleChartPatternSections.length > 0 ? (
          visibleChartPatternSections.map((section, sectionIndex) => (
            <section
              key={section.id}
              aria-labelledby={`chart-pattern-catalog-${section.id}`}
              style={{
                borderTop: sectionIndex === 0 ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
                paddingTop: sectionIndex === 0 ? 0 : "5px",
                marginTop: sectionIndex === 0 ? 0 : "5px",
              }}
            >
              <div
                id={`chart-pattern-catalog-${section.id}`}
                style={{ ...headerStyle, borderBottom: "none", marginBottom: "1px", paddingTop: "7px", paddingBottom: "4px" }}
              >
                {section.label}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1px" }}>
                {section.tools.map((tool) => (
                  <ToolRow
                    key={tool.id}
                    tool={tool}
                    isActive={props.activeTool === tool.id}
                    useClonedIcon
                    onSelect={selectChartPatternTool}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div style={{ padding: "20px", textAlign: "center", color: "#787b86", fontSize: "12px" }}>
            Aucun outil trouvé
          </div>
        )}
      </div>
    </ToolPortal>
  );
};

const ANNOTATION_CATALOG_SECTIONS = [
  { id: "text_notes", label: "TEXT AND NOTES", view: "text_notes" as const },
  { id: "content", label: "CONTENT", view: "content" as const },
] as const;

export const AnnotationToolDropdown: React.FC<BaseDropdownProps<AnnotationDropdownView> & {
  counts: DrawingToolCounts;
}> = (props) => {
  const visibleAnnotationSections = ANNOTATION_CATALOG_SECTIONS
    .map((section) => ({ ...section, tools: filterAnnotationTools(section.view, props.searchQuery) }))
    .filter((section) => section.tools.length > 0);

  const selectAnnotationTool = (toolId: AllToolType) => {
    props.onSelectTool(toolId);
    props.onSearchChange("");
    props.onClose();
  };

  return (
    <ToolPortal isOpen={props.isOpen} pos={props.pos} searchQuery={props.searchQuery} onSearchChange={props.onSearchChange} onClose={props.onClose} placeholder="Rechercher une annotation..." searchInputId="annotation-tool-search" searchInputName="annotationToolSearch" searchInputLabel="Rechercher une annotation">
      <div className="gp-drawing-tool-catalog gp-annotation-tool-catalog" style={{ display: "flex", flexDirection: "column", minWidth: "292px", padding: "2px 0 6px" }}>
        {visibleAnnotationSections.length > 0 ? visibleAnnotationSections.map((section, sectionIndex) => (
          <section key={section.id} aria-labelledby={`annotation-catalog-${section.id}`} style={{ borderTop: sectionIndex === 0 ? "none" : "1px solid rgba(255, 255, 255, 0.08)", paddingTop: sectionIndex === 0 ? 0 : "5px", marginTop: sectionIndex === 0 ? 0 : "5px" }}>
            <div id={`annotation-catalog-${section.id}`} style={{ ...headerStyle, borderBottom: "none", marginBottom: "1px", paddingTop: "7px", paddingBottom: "4px" }}>{section.label}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1px" }}>
              {section.tools.map((tool) => <ToolRow key={tool.id} tool={tool} isActive={props.activeTool === tool.id} useClonedIcon onSelect={selectAnnotationTool} />)}
            </div>
          </section>
        )) : <div style={{ padding: "20px", textAlign: "center", color: "#787b86", fontSize: "12px" }}>Aucune annotation trouvée</div>}
      </div>
    </ToolPortal>
  );
};

const FORECASTING_CATALOG_SECTIONS = [
  { id: "forecasting", label: "PRÉVISIONS", view: "forecasting" as const },
  { id: "volume", label: "PROFILS DE VOLUME", view: "volume" as const },
  { id: "measurers", label: "MESUREURS", view: "measurers" as const },
] as const;

export const ForecastingToolDropdown: React.FC<BaseDropdownProps<ForecastingDropdownView> & {
  counts: DrawingToolCounts;
}> = (props) => {
  const visibleForecastingSections = FORECASTING_CATALOG_SECTIONS
    .map((section) => ({ ...section, tools: filterForecastingTools(section.view, props.searchQuery) }))
    .filter((section) => section.tools.length > 0);

  const selectForecastingTool = (toolId: AllToolType) => {
    props.onSelectTool(toolId);
    props.onSearchChange("");
    props.onClose();
  };

  return (
    <ToolPortal isOpen={props.isOpen} pos={props.pos} searchQuery={props.searchQuery} onSearchChange={props.onSearchChange} onClose={props.onClose} placeholder="Rechercher une prévision ou un profil de volume..." searchInputId="forecasting-tool-search" searchInputName="forecastingToolSearch" searchInputLabel="Rechercher une prévision ou un profil de volume">
      <div className="gp-drawing-tool-catalog gp-forecasting-tool-catalog" style={{ display: "flex", flexDirection: "column", minWidth: "292px", padding: "2px 0 6px" }}>
        {visibleForecastingSections.length > 0 ? visibleForecastingSections.map((section, sectionIndex) => (
          <section key={section.id} aria-labelledby={`forecasting-catalog-${section.id}`} style={{ borderTop: sectionIndex === 0 ? "none" : "1px solid rgba(255, 255, 255, 0.08)", paddingTop: sectionIndex === 0 ? 0 : "5px", marginTop: sectionIndex === 0 ? 0 : "5px" }}>
            <div id={`forecasting-catalog-${section.id}`} style={{ ...headerStyle, borderBottom: "none", marginBottom: "1px", paddingTop: "7px", paddingBottom: "4px" }}>{section.label}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1px" }}>
              {section.tools.map((tool) => <ToolRow key={tool.id} tool={tool} isActive={props.activeTool === tool.id} useClonedIcon onSelect={selectForecastingTool} />)}
            </div>
          </section>
        )) : <div style={{ padding: "20px", textAlign: "center", color: "#787b86", fontSize: "12px" }}>Aucun outil trouvé</div>}
      </div>
    </ToolPortal>
  );
};
