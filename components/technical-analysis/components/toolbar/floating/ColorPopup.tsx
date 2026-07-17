import React from "react";
import type { DrawingStyle } from "../../../config/drawing/drawingPrimitiveTypes";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";
import { ProColorPicker } from "../../common/inputs/ProColorPicker";
import { buildFillBackgroundUpdates } from "./drawingUpdateHelpers";
import { buildFloatingPopupStyle, stopFloatingPopupMouseDown } from "./popupStyle";

type PositionFillTarget = "tp" | "sl";

interface ColorPopupShellProps {
  title: React.ReactNode;
  titleColor?: string;
  closePopup: () => void;
  closeIcon?: string;
  children: React.ReactNode;
}

interface LineColorPopupProps {
  color: string;
  opacity: number;
  handleColorChange: (color: string, opacity: number, isLine: boolean) => void;
  closePopup: () => void;
}

interface TextColorPopupProps {
  drawing: Drawing;
  handleTextColorChange: (color: string, opacity: number, shouldClose: boolean) => void;
  closePopup: () => void;
}

interface FillColorPopupProps {
  drawing: Drawing;
  drawingStyle: DrawingStyle;
  color: string;
  opacity: number;
  fillEnabled: boolean;
  handleFillChange: (
    color: string,
    opacity: number,
    isLine: boolean,
    target: "both" | "tp" | "sl",
  ) => void;
  updateDrawing: (id: string, updates: Partial<Drawing>) => void;
  closePopup: () => void;
}

interface PositionFillPopupProps {
  positionProps: NonNullable<Drawing["positionProps"]>;
  target: PositionFillTarget;
  fallbackOpacity: number;
  handleFillChange: (
    color: string,
    opacity: number,
    isLine: boolean,
    target: "both" | "tp" | "sl",
  ) => void;
  closePopup: () => void;
}

const resolveFillBackgroundEnabled = (drawing: Drawing, fillEnabled: boolean) => {
  if (drawing.cyclesProps) return drawing.cyclesProps.fillBackground !== false;
  if (drawing.fibProps) return drawing.fibProps.fillBackground !== false;
  if (drawing.regressionProps) return drawing.regressionProps.fillBackground !== false;
  if (drawing.pitchforkProps) return drawing.pitchforkProps.fillBackground !== false;
  if (drawing.pitchfanProps) return drawing.pitchfanProps.fillBackground !== false;
  if (drawing.gannSquareProps) return drawing.gannSquareProps.fillBackground !== false;
  if (drawing.gannFanProps) return drawing.gannFanProps.fillBackground !== false;
  return fillEnabled;
};

const ColorPopupShell: React.FC<ColorPopupShellProps> = ({
  title,
  titleColor = "#787b86",
  closePopup,
  closeIcon = "bi-x",
  children,
}) => (
  <div
    onPointerDown={stopFloatingPopupMouseDown}
    onMouseDown={stopFloatingPopupMouseDown}
    style={buildFloatingPopupStyle({
      left: "-110px",
      width: "240px",
      borderRadius: "8px",
      padding: "10px",
    })}
  >
    <div className="d-flex justify-content-between align-items-center mb-2">
      <div
        style={{
          fontSize: "10px",
          color: titleColor,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {title}
      </div>
      <button
        onClick={closePopup}
        className="btn btn-link p-0 text-secondary"
        style={{ fontSize: "16px" }}
      >
        <i className={`bi ${closeIcon}`} />
      </button>
    </div>
    {children}
  </div>
);

export const LineColorPopup: React.FC<LineColorPopupProps> = ({
  color,
  opacity,
  handleColorChange,
  closePopup,
}) => (
  <ColorPopupShell title={<>&quot;Ligne&quot;</>} closePopup={closePopup}>
    <ProColorPicker
      color={color}
      opacity={opacity}
      onChange={(nextColor, nextOpacity) => handleColorChange(nextColor, nextOpacity, true)}
    />
  </ColorPopupShell>
);

export const TextColorPopup: React.FC<TextColorPopupProps> = ({
  drawing,
  handleTextColorChange,
  closePopup,
}) => (
  <ColorPopupShell title="Texte" closeIcon="bi-x-lg" closePopup={closePopup}>
    <ProColorPicker
      color={drawing.textColor || "#ffffff"}
      opacity={1}
      onChange={(nextColor, nextOpacity) =>
        handleTextColorChange(nextColor, nextOpacity, false)
      }
    />
  </ColorPopupShell>
);

export const FillColorPopup: React.FC<FillColorPopupProps> = ({
  drawing,
  drawingStyle,
  color,
  opacity,
  fillEnabled,
  handleFillChange,
  updateDrawing,
  closePopup,
}) => (
  <ColorPopupShell title="Fond" closePopup={closePopup}>
    <ProColorPicker
      color={color}
      opacity={opacity}
      onChange={(nextColor, nextOpacity) =>
        handleFillChange(nextColor, nextOpacity, false, "both")
      }
    />
    <div className="mt-2" style={{ fontSize: "11px", color: "#ffffff" }}>
      <label className="d-flex align-items-center gap-2" style={{ cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={resolveFillBackgroundEnabled(drawing, fillEnabled)}
          onChange={(event) => {
            const isChecked = event.target.checked;
            updateDrawing(
              drawing.id,
              buildFillBackgroundUpdates(drawing, drawingStyle, isChecked),
            );
          }}
        />
        <span>Remplissage</span>
      </label>
    </div>
  </ColorPopupShell>
);

export const PositionFillPopup: React.FC<PositionFillPopupProps> = ({
  positionProps,
  target,
  fallbackOpacity,
  handleFillChange,
  closePopup,
}) => {
  const isProfitTarget = target === "tp";
  const color = isProfitTarget
    ? positionProps.tpColor || "#00da3c"
    : positionProps.slColor || "#ec0000";
  const opacity = isProfitTarget
    ? positionProps.tpOpacity !== undefined ? positionProps.tpOpacity : fallbackOpacity
    : positionProps.slOpacity !== undefined ? positionProps.slOpacity : fallbackOpacity;

  return (
    <ColorPopupShell
      title={isProfitTarget ? "Profit" : "Perte"}
      titleColor={isProfitTarget ? "#00da3c" : "#ec0000"}
      closePopup={closePopup}
    >
      <ProColorPicker
        color={color}
        opacity={opacity}
        onChange={(nextColor, nextOpacity) =>
          handleFillChange(nextColor, nextOpacity, false, target)
        }
      />
    </ColorPopupShell>
  );
};
