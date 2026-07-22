import React from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { useTechnicalAnalysisPortalTarget } from "@/components/technical-analysis/components/common/portal/useTechnicalAnalysisPortalTarget";

import type { CursorModeType } from "../../../config/state/uiStateTypes";
import { ACCENT_GOLD, ACTIVE_BLUE, getActiveOptionStyle } from "./drawingToolbarTheme";

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
}) => {
  const portalTarget = useTechnicalAnalysisPortalTarget();

  return (
  <>
    <button
      ref={buttonRef}
      type="button"
      className={clsx("gp-toolbar-btn", "gp-toolbar-btn-split", "hover-lift", isActive && "active")}
      title={`Mode de curseur : ${cursorMode}`}
      onClick={onToggle}
    >
      {renderCursorIcon(cursorMode, isActive)}
    </button>

    {isOpen &&
      typeof document !== "undefined" &&
      !!portalTarget &&
      createPortal(
        <div
          className="gp-cursor-dropdown-portal"
          style={{
            position: "fixed",
            top: position.top,
            left: position.left,
          }}
        >
          {cursorModes.map((mode) => {
            const isSelected = cursorMode === mode.id;
            const selectMode = (event: React.MouseEvent<HTMLButtonElement> | React.PointerEvent<HTMLButtonElement>) => {
              event.preventDefault();
              event.stopPropagation();
              onSelectMode(mode.id);
            };

            return (
              <button
                key={mode.id}
                type="button"
                className={clsx("gp-cursor-option", isSelected && "active")}
                style={getActiveOptionStyle(isSelected)}
                aria-pressed={isSelected}
                aria-label={`Activer le mode ${mode.label}`}
                onPointerDown={selectMode}
                onClick={selectMode}
              >
                <span className="icon-container" aria-hidden="true">{mode.icon}</span>
                <span className="gp-cursor-label">{mode.label}</span>
              </button>
            );
          })}
        </div>,
        portalTarget,
      )}
  </>
  );
};
