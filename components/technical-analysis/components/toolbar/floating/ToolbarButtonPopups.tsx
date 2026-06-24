import React from "react";

import type { DrawingStyle } from "../../../config/drawing/drawingPrimitiveTypes";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";
import {
  FillColorPopup,
  LineColorPopup,
  PositionFillPopup,
  TextColorPopup,
} from "./ColorPopup";
import { LayersPopup } from "./LayersPopup";
import { LineStylePopup } from "./LineStylePopup";
import { MorePopup } from "./MorePopup";
import { QuickOptionsPopup } from "./QuickOptionsPopup";
import { TemplatePopup } from "./TemplatePopup";
import { buildFloatingPopupStyle, stopFloatingPopupMouseDown } from "./popupStyle";

interface ToolbarButtonPopupsProps {
  buttonId: string;
  drawing: Drawing;
  drawingType: Drawing["type"];
  isActive: boolean;
  activeToolbarPopup: string | null;
  drawings: Drawing[];
  selectedDrawingId: string | null;
  setSelectedDrawingId: (id: string | null) => void;
  updateDrawing: (id: string, updates: Partial<Drawing>) => void;
  deleteDrawing: (id: string) => void;
  handleColorChange: (color: string, opacity: number, shouldClose: boolean) => void;
  handleFillChange: (color: string, opacity: number, shouldClose: boolean, target: "both" | "tp" | "sl") => void;
  handleLineStyleChange: (updates: Partial<DrawingStyle>) => void;
  handleTextColorChange: (color: string, opacity: number, shouldClose: boolean) => void;
  namedTemplates: Record<string, { name: string; style: DrawingStyle }[]>;
  applyNamedTemplate: (id: string, name: string) => void;
  deleteNamedTemplate: (type: string, name: string) => void;
  saveNamedTemplate: (id: string, name: string) => void;
  saveAsDefault: (id: string) => void;
  resetStyle: (id: string) => void;
  isSavingAs: boolean;
  setIsSavingAs: (val: boolean) => void;
  newTemplateName: string;
  setNewTemplateName: (val: string) => void;
  closePopup: () => void;
  drawingStyle: DrawingStyle;
  positionProps: NonNullable<Drawing["positionProps"]>;
  lineColor: string;
  lineOpacity: number;
  lineWidth: number;
  lineStyle: DrawingStyle["lineStyle"];
  fillColor: string;
  fillOpacity: number;
  fillEnabled: boolean;
  hasQuickOptionsPopup: boolean;
  handleClone: () => void;
  handleHide: () => void;
  handleReverse: () => void;
  handleCopyToClipboard: () => void;
  handleVisualOrder: (dir: "front" | "back" | "forward" | "backward") => void;
}

export const ToolbarButtonPopups: React.FC<ToolbarButtonPopupsProps> = ({
  buttonId,
  drawing,
  drawingType,
  isActive,
  activeToolbarPopup,
  drawings,
  selectedDrawingId,
  setSelectedDrawingId,
  updateDrawing,
  deleteDrawing,
  handleColorChange,
  handleFillChange,
  handleLineStyleChange,
  handleTextColorChange,
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
  drawingStyle,
  positionProps,
  lineColor,
  lineOpacity,
  lineWidth,
  lineStyle,
  fillColor,
  fillOpacity,
  fillEnabled,
  hasQuickOptionsPopup,
  handleClone,
  handleHide,
  handleReverse,
  handleCopyToClipboard,
  handleVisualOrder,
}) => (
  <>
    {isActive && buttonId === "template" && (
      <TemplatePopup
        drawing={drawing}
        drawingType={drawingType}
        namedTemplates={namedTemplates}
        applyNamedTemplate={applyNamedTemplate}
        deleteNamedTemplate={deleteNamedTemplate}
        saveNamedTemplate={saveNamedTemplate}
        saveAsDefault={saveAsDefault}
        resetStyle={resetStyle}
        isSavingAs={isSavingAs}
        setIsSavingAs={setIsSavingAs}
        newTemplateName={newTemplateName}
        setNewTemplateName={setNewTemplateName}
        closePopup={closePopup}
      />
    )}

    {isActive && buttonId === "layers" && (
      <LayersPopup
        drawings={drawings}
        selectedDrawingId={selectedDrawingId}
        setSelectedDrawingId={setSelectedDrawingId}
        deleteDrawing={deleteDrawing}
      />
    )}

    {isActive && buttonId === "color" && (
      <LineColorPopup
        color={lineColor}
        opacity={lineOpacity}
        handleColorChange={handleColorChange}
        closePopup={closePopup}
      />
    )}

    {isActive && buttonId === "text" && activeToolbarPopup === "text_color" && (
      <TextColorPopup
        drawing={drawing}
        handleTextColorChange={handleTextColorChange}
        closePopup={closePopup}
      />
    )}

    {isActive && buttonId === "fill" && (
      <FillColorPopup
        drawing={drawing}
        drawingStyle={drawingStyle}
        color={fillColor}
        opacity={fillOpacity}
        fillEnabled={fillEnabled}
        handleFillChange={handleFillChange}
        updateDrawing={updateDrawing}
        closePopup={closePopup}
      />
    )}

    {isActive && buttonId === "tp_fill" && (
      <PositionFillPopup
        positionProps={positionProps}
        target="tp"
        fallbackOpacity={fillOpacity}
        handleFillChange={handleFillChange}
        closePopup={closePopup}
      />
    )}

    {isActive && buttonId === "sl_fill" && (
      <PositionFillPopup
        positionProps={positionProps}
        target="sl"
        fallbackOpacity={fillOpacity}
        handleFillChange={handleFillChange}
        closePopup={closePopup}
      />
    )}

    {isActive && (buttonId === "line" || buttonId === "line_style" || buttonId === "thickness") && (
      <LineStylePopup
        lineWidth={lineWidth}
        lineStyle={lineStyle}
        handleLineStyleChange={handleLineStyleChange}
        title={buttonId === "thickness" && (drawingType === "brush" || drawingType === "highlighter") ? "Line tool width" : undefined}
      />
    )}

    {isActive && buttonId === "more" && (
      <MorePopup
        drawing={drawing}
        drawingType={drawingType}
        handleClone={handleClone}
        handleCopyToClipboard={handleCopyToClipboard}
        handleReverse={handleReverse}
        handleHide={handleHide}
        handleVisualOrder={handleVisualOrder}
        deleteDrawing={deleteDrawing}
        setSelectedDrawingId={setSelectedDrawingId}
      />
    )}

    {isActive && buttonId === "quick_options" && hasQuickOptionsPopup && (
      <div
        onMouseDown={stopFloatingPopupMouseDown}
        style={buildFloatingPopupStyle({
          top: "var(--popup-top, 30px)",
          left: "-170px",
          width: "200px",
          background: "#ffffff",
          border: "1px solid #e0e3eb",
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
          padding: "10px",
        })}
      >
        <QuickOptionsPopup dr={drawing} updateDrawing={updateDrawing} />
      </div>
    )}
  </>
);
