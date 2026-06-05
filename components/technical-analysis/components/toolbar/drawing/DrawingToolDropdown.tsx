import React from "react";
import clsx from "clsx";

import type { AllToolType } from "../../../config/drawing/drawingToolTypes";
import { getDrawingToolIcon } from "../../../config/drawing/drawingToolIconRegistry";
import { ToolPortal } from "../../common/primitives/ToolPortal";
import type { DrawingToolCounts } from "./drawingToolCounts";
import {
  filterChartPatternTools,
  filterForecastingTools,
  filterTrendTools,
  getFibDropdownTools,
  getTrendDropdownTools,
  type ChartPatternsDropdownView,
  type FibDropdownView,
  type ForecastingDropdownView,
  type TrendDropdownView,
} from "./drawingToolFilters";
import { ACTIVE_BLUE, getActiveOptionStyle } from "./drawingToolbarTheme";
import { cloneIconWithActiveState } from "./toolIconCatalog";

type ToolPortalPosition = {
  top: number;
  left: number;
  maxHeight: number;
};

type CategoryRowConfig<View extends string> = {
  id: View;
  label: string;
  count: number;
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

const categoryRowStyle: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", cursor: "pointer" };

const headerStyle: React.CSSProperties = { padding: "8px 12px 6px 12px", fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.4)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", marginBottom: "4px", userSelect: "none" };

const backHeaderStyle: React.CSSProperties = { ...headerStyle, display: "flex", alignItems: "center", justifyContent: "space-between" };

const backButtonStyle: React.CSSProperties = { cursor: "pointer", color: "rgba(255, 255, 255, 0.6)", fontSize: "11px", padding: "2px 6px", borderRadius: "3px", background: "rgba(255, 255, 255, 0.05)" };

const renderCategoryRows = <View extends string>(
  categories: Array<CategoryRowConfig<View>>,
  onViewChange: (view: View) => void,
) => (
  <>
    {categories.map((category) => (
      <div
        key={category.id}
        className={clsx("gp-cursor-option")}
        onMouseDown={(event) => {
          event.preventDefault();
          onViewChange(category.id);
        }}
        style={categoryRowStyle}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ background: ACTIVE_BLUE, color: "white", fontSize: "11px", fontWeight: 600, padding: "2px 6px", borderRadius: "3px", minWidth: "24px", textAlign: "center" }}>{category.count}</span>
          <span className="gp-cursor-label" style={{ fontWeight: 500 }}>{category.label}</span>
        </div>
        <i className="bi bi-chevron-right" style={{ fontSize: "0.8rem", color: "#787b86" }}></i>
      </div>
    ))}
  </>
);

const BackHeader: React.FC<{
  title: string;
  onBack: () => void;
  compact?: boolean;
}> = ({ title, onBack, compact = false }) => (
  <div style={backHeaderStyle}>
    <span>{title}</span>
    <div
      onMouseDown={(event) => {
        event.preventDefault();
        onBack();
      }}
      style={compact ? { cursor: "pointer" } : backButtonStyle}
      className={compact ? "back-icon-hover" : undefined}
    >
      {compact ? <i className="bi bi-chevron-left" style={{ fontSize: "12px" }}></i> : "← Retour"}
    </div>
  </div>
);

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

export const TrendToolDropdown: React.FC<BaseDropdownProps<TrendDropdownView> & {
  counts: DrawingToolCounts;
}> = ({
  counts,
  isOpen,
  pos,
  searchQuery,
  onSearchChange,
  onClose,
  view,
  onViewChange,
  activeTool,
  onSelectTool,
}) => {
  const filteredTools = filterTrendTools(searchQuery);

  return (
    <ToolPortal
      isOpen={isOpen}
      pos={pos}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      onClose={onClose}
      placeholder="Rechercher un outil..."
      searchInputId="trend-tool-search"
      searchInputName="trendToolSearch"
      searchInputLabel="Rechercher un outil de tendance"
    >
      {searchQuery.trim() ? (
        <div style={{ padding: "4px 0" }}>
          {filteredTools.length > 0 ? (
            filteredTools.map((tool) => (
              <ToolRow
                key={`trend-${tool.id}`}
                tool={tool}
                isActive={activeTool === tool.id}
                showCategory
                useClonedIcon
                onSelect={(toolId) => {
                  onSelectTool(toolId);
                  onSearchChange("");
                  onClose();
                }}
              />
            ))
          ) : (
            <div style={{ padding: "20px", textAlign: "center", color: "#787b86", fontSize: "12px" }}>Aucun outil trouvé</div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          {view === "categories" && renderCategoryRows([
            { id: "drawing_tools", label: "Lignes et mesures", count: counts.lines },
            { id: "channels", label: "Canaux", count: counts.channels },
            { id: "pitchforks", label: "Fourchettes", count: counts.pitchforks },
          ], onViewChange)}

          {["channels", "pitchforks", "drawing_tools"].includes(view) && (
            <>
              <BackHeader title={view === "drawing_tools" ? "LIGNES ET MESURES" : view.toUpperCase()} onBack={() => onViewChange("categories")} compact />
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2px" }}>
                {getTrendDropdownTools(view).map((tool) => (
                  <ToolRow
                    key={tool.id}
                    tool={tool}
                    isActive={activeTool === tool.id}
                    useClonedIcon
                    onSelect={(toolId) => {
                      onSelectTool(toolId);
                      onClose();
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </ToolPortal>
  );
};

export const FibToolDropdown: React.FC<BaseDropdownProps<FibDropdownView> & {
  counts: DrawingToolCounts;
}> = (props) => (
  <ToolPortal isOpen={props.isOpen} pos={props.pos} searchQuery={props.searchQuery} onSearchChange={props.onSearchChange} onClose={props.onClose} placeholder="Rechercher un outil Fibonacci..." searchInputId="fib-tool-search" searchInputName="fibToolSearch" searchInputLabel="Rechercher un outil Fibonacci">
    {props.view === "categories" && (
      <>
        <div style={headerStyle}>FIBONACCI & GANN</div>
        {renderCategoryRows([
          { id: "fibonacci", label: "Fibonacci", count: props.counts.fibPure },
          { id: "gann", label: "Gann", count: props.counts.gann },
        ], props.onViewChange)}
      </>
    )}
    {["fibonacci", "gann"].includes(props.view) && <ToolList {...props} view={props.view} title={props.view.toUpperCase()} getTools={getFibDropdownTools} />}
  </ToolPortal>
);

export const ChartPatternsToolDropdown: React.FC<BaseDropdownProps<ChartPatternsDropdownView> & {
  counts: DrawingToolCounts;
}> = (props) => (
  <ToolPortal isOpen={props.isOpen} pos={props.pos} searchQuery={props.searchQuery} onSearchChange={props.onSearchChange} onClose={props.onClose} placeholder="Rechercher une figure chartiste..." searchInputId="chart-pattern-tool-search" searchInputName="chartPatternToolSearch" searchInputLabel="Rechercher une figure chartiste">
    {props.view === "categories" && (
      <>
        <div style={headerStyle}>FIGURES CHARTISTES</div>
        {renderCategoryRows([
          { id: "patterns", label: "Figures", count: props.counts.patterns },
          { id: "elliott", label: "Vagues d'Elliott", count: props.counts.elliott },
          { id: "cycles", label: "Cycles", count: props.counts.cycles },
        ], props.onViewChange)}
      </>
    )}
    {["patterns", "elliott", "cycles"].includes(props.view) && <ToolList {...props} view={props.view} title={props.view === "patterns" ? "FIGURES CHARTISTES" : props.view.toUpperCase()} getTools={(view) => filterChartPatternTools(view, props.searchQuery)} maxHeight="400px" />}
  </ToolPortal>
);

export const ForecastingToolDropdown: React.FC<BaseDropdownProps<ForecastingDropdownView> & {
  counts: DrawingToolCounts;
}> = (props) => (
  <ToolPortal isOpen={props.isOpen} pos={props.pos} searchQuery={props.searchQuery} onSearchChange={props.onSearchChange} onClose={props.onClose} placeholder="Rechercher une prévision ou un profil de volume..." searchInputId="forecasting-tool-search" searchInputName="forecastingToolSearch" searchInputLabel="Rechercher une prévision ou un profil de volume">
    {props.view === "categories" && (
      <>
        <div style={headerStyle}>PRÉVISIONS ET PROFILS DE VOLUME</div>
        {renderCategoryRows([
          { id: "forecasting", label: "Prévisions", count: props.counts.forecasting },
          { id: "volume", label: "Profils de volume", count: props.counts.volume },
        ], props.onViewChange)}
      </>
    )}
    {["forecasting", "volume"].includes(props.view) && <ToolList {...props} view={props.view} title={props.view === "forecasting" ? "PRÉVISIONS" : "PROFILS DE VOLUME"} getTools={(view) => filterForecastingTools(view, props.searchQuery)} />}
  </ToolPortal>
);

const ToolList = <View extends string>({
  view,
  title,
  getTools,
  activeTool,
  onSelectTool,
  onViewChange,
  onClose,
  maxHeight,
}: BaseDropdownProps<View> & {
  title: string;
  getTools: (view: View) => Array<{ id: AllToolType; label: string; category?: string }>;
  maxHeight?: string;
}) => (
  <>
    <BackHeader title={title} onBack={() => onViewChange("categories" as View)} />
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2px", maxHeight, overflowY: maxHeight ? "auto" : undefined }}>
      {getTools(view).map((tool) => (
        <ToolRow
          key={tool.id}
          tool={tool}
          isActive={activeTool === tool.id}
          onSelect={(toolId) => {
            onSelectTool(toolId);
            onClose();
          }}
        />
      ))}
    </div>
  </>
);
