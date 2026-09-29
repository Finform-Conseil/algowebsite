import React from "react";
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
import { getActiveOptionStyle } from "./drawingToolbarTheme";
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

const ToolRow: React.FC<{
  tool: { id: AllToolType; label: string; category?: string };
  isActive: boolean;
  showCategory?: boolean;
  useClonedIcon?: boolean;
  onSelect: (toolId: AllToolType) => void;
}> = ({ tool, isActive, showCategory = false, useClonedIcon = false, onSelect }) => (
  <div
    key={tool.id}
    className="gp-cursor-option"
    style={getActiveOptionStyle(isActive)}
    title={tool.label ?? tool.id}
    onMouseDown={(event) => {
      event.preventDefault();
      onSelect(tool.id);
    }}
  >
    <div className="icon-container">
      {useClonedIcon ? cloneIconWithActiveState(getDrawingToolIcon(tool.id), isActive) : getDrawingToolIcon(tool.id)}
    </div>
    {showCategory ? (
      <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
        <span className="gp-cursor-label">{tool.label || ""}</span>
        <span style={{ fontSize: "10px", color: "#787b86" }}>{tool.category}</span>
      </div>
    ) : (
      <span className="gp-cursor-label">{tool.label || ""}</span>
    )}
  </div>
);

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
