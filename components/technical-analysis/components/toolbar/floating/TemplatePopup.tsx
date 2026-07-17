import React from "react";
import type { DrawingStyle } from "../../../config/drawing/drawingPrimitiveTypes";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";
import { buildFloatingPopupStyle, stopFloatingPopupMouseDown } from "./popupStyle";

interface TemplatePopupProps {
  drawing: Drawing;
  drawingType: string;
  namedTemplates: Record<string, { name: string; style: DrawingStyle }[]>;
  applyNamedTemplate: (id: string, name: string) => void;
  deleteNamedTemplate: (type: string, name: string) => void;
  saveNamedTemplate: (id: string, name: string) => void;
  saveAsDefault: (id: string) => void;
  resetStyle: (id: string) => void;
  isSavingAs: boolean;
  setIsSavingAs: (value: boolean) => void;
  newTemplateName: string;
  setNewTemplateName: (value: string) => void;
  closePopup: () => void;
}

export const TemplatePopup: React.FC<TemplatePopupProps> = ({
  drawing,
  drawingType,
  namedTemplates,
  applyNamedTemplate,
  deleteNamedTemplate,
  saveNamedTemplate,
  saveAsDefault,
  resetStyle,
  isSavingAs,
  setIsSavingAs,
  newTemplateName,
  setNewTemplateName,
  closePopup,
}) => {
  const templates = namedTemplates[drawingType] || [];

  const saveTemplate = () => {
    if (!newTemplateName || !drawing.id) return;
    saveNamedTemplate(drawing.id, newTemplateName);
    setIsSavingAs(false);
    setNewTemplateName("");
    closePopup();
  };

  return (
    <div
      onPointerDown={stopFloatingPopupMouseDown}
      onMouseDown={stopFloatingPopupMouseDown}
      style={buildFloatingPopupStyle({
        left: "-20px",
        width: "180px",
        overflow: "hidden",
      })}
    >
      {templates.length > 0 && (
        <div
          style={{
            padding: "4px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            maxHeight: "120px",
            overflowY: "auto",
          }}
        >
          {templates.map((template) => (
            <div
              key={template.name}
              className="d-flex align-items-center justify-content-between p-2 hover-bg-slate-800 rounded-1"
              style={{
                fontSize: "11px",
                color: "#ffffff",
                cursor: "pointer",
              }}
            >
              <span
                onClick={() => {
                  applyNamedTemplate(drawing.id, template.name);
                  closePopup();
                }}
              >
                {template.name}
              </span>
              <i
                className="bi bi-x-circle-fill"
                style={{ fontSize: "10px", opacity: 0.3 }}
                onClick={(event) => {
                  event.stopPropagation();
                  deleteNamedTemplate(drawingType, template.name);
                }}
              />
            </div>
          ))}
        </div>
      )}
      {!isSavingAs ? (
        <div
          onClick={() => setIsSavingAs(true)}
          className="d-flex align-items-center gap-2 p-2 hover-bg-slate-800"
          style={{
            fontSize: "11px",
            color: "#ffffff",
            cursor: "pointer",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <i className="bi bi-plus-lg" />
          <span>Enregistrer sous...</span>
        </div>
      ) : (
        <div
          className="p-2"
          style={{
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            background: "#252b3d",
          }}
        >
          <input
            autoFocus
            type="text"
            placeholder="Nom du modèle..."
            value={newTemplateName}
            onChange={(event) => setNewTemplateName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") saveTemplate();
              if (event.key === "Escape") setIsSavingAs(false);
            }}
            style={{
              width: "100%",
              background: "#1c2030",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#ffffff",
              fontSize: "10px",
              padding: "4px",
              borderRadius: "4px",
            }}
          />
          <div className="d-flex justify-content-end gap-1 mt-1">
            <button
              onClick={() => setIsSavingAs(false)}
              className="btn btn-sm p-0 px-1 text-secondary"
              style={{ fontSize: "10px" }}
            >
              Annuler
            </button>
            <button
              onClick={saveTemplate}
              className="btn btn-primary btn-sm p-0 px-1"
              style={{ fontSize: "10px" }}
            >
              OK
            </button>
          </div>
        </div>
      )}
      <div
        onClick={() => {
          if (drawing.id) saveAsDefault(drawing.id);
          closePopup();
        }}
        className="d-flex align-items-center gap-2 p-2 hover-bg-slate-800"
        style={{
          fontSize: "11px",
          color: "#ffffff",
          cursor: "pointer",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <i className="bi bi-file-earmark-arrow-down" style={{ color: "#787b86" }} />
        <span>Enregistrer par défaut</span>
      </div>
      <div
        onClick={() => {
          if (drawing.id) resetStyle(drawing.id);
          closePopup();
        }}
        className="d-flex align-items-center gap-2 p-2 hover-bg-slate-800"
        style={{
          fontSize: "11px",
          color: "#ffffff",
          cursor: "pointer",
        }}
      >
        <i className="bi bi-arrow-counterclockwise" style={{ color: "#787b86" }} />
        <span>Réinitialiser</span>
      </div>
    </div>
  );
};
