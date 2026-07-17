import React from "react";
import clsx from "clsx";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";
import { buildFloatingPopupStyle, stopFloatingPopupMouseDown } from "./popupStyle";

interface LayersPopupProps {
  drawings: Drawing[];
  selectedDrawingId: string | null;
  setSelectedDrawingId: (id: string | null) => void;
  deleteDrawing: (id: string) => void;
}

export const LayersPopup: React.FC<LayersPopupProps> = ({
  drawings,
  selectedDrawingId,
  setSelectedDrawingId,
  deleteDrawing,
}) => (
  <div
    onPointerDown={stopFloatingPopupMouseDown}
    onMouseDown={stopFloatingPopupMouseDown}
    style={buildFloatingPopupStyle({
      left: "-100px",
      width: "200px",
      color: "#ffffff",
      fontSize: "11px",
      padding: "10px",
    })}
  >
    <div className="fw-bold mb-2">Arborescence des objets</div>
    <div style={{ maxHeight: "150px", overflowY: "auto" }}>
      {drawings.map((drawing) => (
        <div
          key={drawing.id}
          className={clsx(
            "p-1 mb-1 rounded d-flex align-items-center justify-content-between",
            drawing.id === selectedDrawingId ? "bg-primary text-white" : "hover-bg-slate-800",
          )}
          style={{ cursor: "pointer" }}
          onClick={() => setSelectedDrawingId(drawing.id)}
        >
          <span className="text-truncate" style={{ maxWidth: "120px" }}>
            {drawing.type.replace("_", " ")}
          </span>
          <div className="d-flex gap-1" style={{ opacity: 0.6 }}>
            <i
              className={clsx("bi", drawing.locked ? "bi-lock-fill" : "bi-unlock")}
              style={{ fontSize: "10px" }}
            />
            <i
              className="bi bi-trash"
              style={{ fontSize: "10px" }}
              onClick={(event) => {
                event.stopPropagation();
                deleteDrawing(drawing.id);
              }}
            />
          </div>
        </div>
      ))}
      {drawings.length === 0 && (
        <div className="text-center opacity-30 py-2">Aucun objet</div>
      )}
    </div>
  </div>
);
