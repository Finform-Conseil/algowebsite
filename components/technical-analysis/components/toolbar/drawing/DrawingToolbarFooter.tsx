import React from "react";
import clsx from "clsx";

import type { AllToolType } from "../../../config/drawing/drawingToolTypes";
import { DRAWING_TOOL_SPECS } from "../../../config/drawing/drawingToolSpecs";
import { ACTIVE_BLUE } from "./drawingToolbarTheme";

const trendLineToolLabel = DRAWING_TOOL_SPECS.find((tool) => tool.id === "line")?.label ?? "Ligne de tendance";

const getTrendLineButtonTitle = (activeTool: AllToolType | null) => {
  if (activeTool === "line") {
    return "Outil actif : " + trendLineToolLabel;
  }

  return "Activer l'outil " + trendLineToolLabel;
};

interface DrawingToolbarControlsProps {
  activeTool: AllToolType | null;
  onSelectTool: (toolId: AllToolType) => void;
}

interface DrawingToolbarFooterProps extends DrawingToolbarControlsProps {
  isLockedAll: boolean;
  areDrawingsHidden: boolean;
  onGlobalLockToggle: () => void;
  onVisibilityToggle: () => void;
  onClearAllDrawings: () => void;
}

export const DrawingToolbarUtilityActions: React.FC<DrawingToolbarControlsProps> = ({
  activeTool,
  onSelectTool,
}) => {
  return (
    <>
    <button
      className={clsx("gp-toolbar-btn", "opacity-50")}
      title="Icônes indisponibles pour cette version"
      aria-label="Icônes indisponibles pour cette version"
      disabled
    >
      <i className="bi bi-emoji-smile"></i>
    </button>
    <div className="gp-toolbar-divider"></div>
    <button
      className={clsx("gp-toolbar-btn", "hover-lift", activeTool === "date_price_range" && "active")}
      title="Date & Prix"
      onClick={() => onSelectTool("date_price_range")}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21L21 3l-2-2L1 19l2 2zM6 12v2M9 9v2m3-3v2m3-3v2"></path>
      </svg>
    </button>
    <button
      className={clsx("gp-toolbar-btn", "opacity-50")}
      title="Zoom indisponible dans la barre de dessin; utilisez les contrôles temporels"
      aria-label="Zoom indisponible dans la barre de dessin; utilisez les contrôles temporels"
      disabled
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="M21 21l-4.35-4.35M11 8v6M8 11h6"></path>
      </svg>
    </button>
  </>
);
};

export const DrawingToolbarFooter: React.FC<DrawingToolbarFooterProps> = ({
  activeTool,
  isLockedAll,
  areDrawingsHidden,
  onSelectTool,
  onGlobalLockToggle,
  onVisibilityToggle,
  onClearAllDrawings,
}) => (
  <div className="gp-toolbar-footer">
      <div className="gp-toolbar-divider"></div>
      <button
        className={clsx("gp-toolbar-btn", "opacity-50")}
        title="Aimant indisponible pour cette version"
        aria-label="Aimant indisponible pour cette version"
        disabled
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-magnet" viewBox="0 0 16 16">
          <path d="M8 1a7 7 0 0 0-7 7v3h4V8a3 3 0 0 1 6 0v3h4V8a7 7 0 0 0-7-7m7 11h-4v3h4zM5 12H1v3h4zM0 8a8 8 0 1 1 16 0v8h-6V8a2 2 0 1 0-4 0v8H0z" />
        </svg>
      </button>
      <button
        className={clsx("gp-toolbar-btn", "hover-lift", activeTool === "line" && "active")}
        title={getTrendLineButtonTitle(activeTool)}
        aria-label={getTrendLineButtonTitle(activeTool)}
        aria-pressed={activeTool === "line"}
        onClick={() => onSelectTool("line")}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil" viewBox="0 0 16 16">
          <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325" />
        </svg>
      </button>
      <button className={clsx("gp-toolbar-btn", "hover-lift", isLockedAll && "active")} onClick={onGlobalLockToggle} title="Verrouiller les dessins">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-unlock2" style={{ color: isLockedAll ? ACTIVE_BLUE : "inherit" }} viewBox="0 0 16 16"><path fillRule="evenodd" d="M8 0c1.07 0 2.041.42 2.759 1.104l.14.14.062.08a.5.5 0 0 1-.71.675l-.076-.066-.216-.205A3 3 0 0 0 5 4v2h6.5A2.5 2.5 0 0 1 14 8.5v5a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 2 13.5v-5a2.5 2.5 0 0 1 2-2.45V4a4 4 0 0 1 4-4M4.5 7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7z" /></svg>
      </button>
      <button className={clsx("gp-toolbar-btn", "hover-lift", areDrawingsHidden && "active")} onClick={onVisibilityToggle} title="Visibilité des dessins">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" style={{ color: areDrawingsHidden ? ACTIVE_BLUE : "inherit" }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
      </button>
      <div className="gp-toolbar-divider"></div>
      <button className={clsx("gp-toolbar-btn", "hover-lift")} onClick={onClearAllDrawings} title="Supprimer les dessins">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"></path></svg>
      </button>
  </div>
);
