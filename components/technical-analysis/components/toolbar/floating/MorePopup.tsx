import React from "react";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";
import { buildFloatingPopupStyle, stopFloatingPopupMouseDown } from "./popupStyle";

interface MorePopupProps {
  drawing: Drawing;
  drawingType: string;
  handleClone: () => void;
  handleCopyToClipboard: () => void;
  handleReverse: () => void;
  handleHide: () => void;
  handleVisualOrder: (direction: "front" | "back" | "forward" | "backward") => void;
  deleteDrawing: (id: string) => void;
  setSelectedDrawingId: (id: string | null) => void;
}

const positionDrawingTypes = new Set(["long_position", "short_position"]);

export const MorePopup: React.FC<MorePopupProps> = ({
  drawing,
  drawingType,
  handleClone,
  handleCopyToClipboard,
  handleReverse,
  handleHide,
  handleVisualOrder,
  deleteDrawing,
  setSelectedDrawingId,
}) => (
  <div
    onMouseDown={stopFloatingPopupMouseDown}
    style={buildFloatingPopupStyle({
      left: "-170px",
      width: "220px",
      overflow: "hidden",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
      padding: "4px 0",
    })}
  >
    <style>{`
      .tv-menu-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 16px;
        font-size: 13px;
        color: #ffffff;
        cursor: pointer;
        transition: background 0.1s;
      }
      .tv-menu-item:hover {
        background: rgba(255, 255, 255, 0.05);
      }
      .tv-menu-item i {
        font-size: 16px;
        width: 20px;
        margin-right: 12px;
        color: #787b86;
      }
      .tv-menu-shortcut {
        font-size: 11px;
        color: #787b86;
        margin-left: 12px;
        opacity: 0.6;
      }
      .tv-menu-divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.1);
        margin: 4px 0;
      }
    `}</style>

    <div className="tv-menu-item" onClick={handleClone}>
      <div className="d-flex align-items-center">
        <i className="bi bi-layers" />
        <span>Cloner</span>
      </div>
    </div>

    <div className="tv-menu-item" onClick={handleCopyToClipboard}>
      <div className="d-flex align-items-center">
        <i className="bi bi-copy" />
        <span>Copier</span>
      </div>
    </div>

    {positionDrawingTypes.has(drawingType) && (
      <div className="tv-menu-item" onClick={handleReverse}>
        <div className="d-flex align-items-center">
          <i className="bi bi-arrow-down-up" />
          <span>Inverser la position</span>
        </div>
      </div>
    )}

    <div className="tv-menu-item" onClick={handleHide}>
      <div className="d-flex align-items-center">
        <i className={drawing.hidden ? "bi bi-eye" : "bi bi-eye-slash"} />
        <span>{drawing.hidden ? "Afficher" : "Cacher"}</span>
      </div>
    </div>

    <div className="tv-menu-divider" />

    <div className="tv-menu-item" onClick={() => handleVisualOrder("forward")}>
      <div className="d-flex align-items-center">
        <i className="bi bi-layer-forward" />
        <span>Avancer d'un plan</span>
      </div>
    </div>

    <div className="tv-menu-item" onClick={() => handleVisualOrder("backward")}>
      <div className="d-flex align-items-center">
        <i className="bi bi-layer-backward" />
        <span>Reculer d'un plan</span>
      </div>
    </div>

    <div className="tv-menu-item" onClick={() => handleVisualOrder("front")}>
      <div className="d-flex align-items-center">
        <i className="bi bi-front" />
        <span>Mettre au premier plan</span>
      </div>
    </div>

    <div className="tv-menu-item" onClick={() => handleVisualOrder("back")}>
      <div className="d-flex align-items-center">
        <i className="bi bi-back" />
        <span>Mettre en arriere-plan</span>
      </div>
    </div>

    <div className="tv-menu-divider" />

    <div
      className="tv-menu-item"
      onClick={() => deleteDrawing(drawing.id)}
      style={{ color: "#f23645" }}
    >
      <div className="d-flex align-items-center">
        <i className="bi bi-trash" style={{ color: "inherit" }} />
        <span>Supprimer</span>
      </div>
      <span className="tv-menu-shortcut">Suppr</span>
    </div>

    <div className="tv-menu-divider" />

    <div className="tv-menu-item" onClick={() => setSelectedDrawingId(null)}>
      <div className="d-flex align-items-center">
        <i className="bi bi-x-lg" />
        <span>Fermer le Toolkit</span>
      </div>
    </div>
  </div>
);
