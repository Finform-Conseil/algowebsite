import React from "react";
import type { DrawingStyle } from "../../../config/drawing/drawingPrimitiveTypes";
import { buildFloatingPopupStyle, stopFloatingPopupMouseDown } from "./popupStyle";

interface LineStylePopupProps {
  lineWidth: number;
  lineStyle: DrawingStyle["lineStyle"];
  handleLineStyleChange: (updates: Partial<DrawingStyle>) => void;
}

const lineWidths = [1, 2, 3, 4] as const;
const lineStyles: { value: DrawingStyle["lineStyle"]; title: string; icon: string }[] = [
  { value: "solid", title: "Solid", icon: "bi-dash-lg" },
  { value: "dashed", title: "Dashed", icon: "bi-three-dots" },
  { value: "dotted", title: "Dotted", icon: "bi-dot" },
];

export const LineStylePopup: React.FC<LineStylePopupProps> = ({
  lineWidth,
  lineStyle,
  handleLineStyleChange,
}) => (
  <div
    onMouseDown={stopFloatingPopupMouseDown}
    style={buildFloatingPopupStyle({
      left: "-150px",
      width: "140px",
      borderRadius: "8px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      padding: "10px",
    })}
  >
    <div
      style={{
        fontSize: "10px",
        color: "#787b86",
        textTransform: "uppercase",
        fontWeight: 700,
        letterSpacing: "0.5px",
      }}
    >
      Épaisseur
    </div>
    <div style={{ display: "flex", gap: "4px" }}>
      {lineWidths.map((width) => (
        <div
          key={width}
          onClick={(event) => {
            event.stopPropagation();
            handleLineStyleChange({ lineWidth: width });
          }}
          style={{
            flex: 1,
            height: "26px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: lineWidth === width ? "#2962ff" : "transparent",
            cursor: "pointer",
            borderRadius: "4px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div
            style={{
              width: "60%",
              height: `${width}px`,
              background: "#ffffff",
              borderRadius: "1px",
            }}
          />
        </div>
      ))}
    </div>
    <div
      style={{
        height: "1px",
        background: "rgba(255, 255, 255, 0.1)",
        margin: "2px 0",
      }}
    />
    <div
      style={{
        fontSize: "10px",
        color: "#787b86",
        textTransform: "uppercase",
        fontWeight: 700,
        letterSpacing: "0.5px",
      }}
    >
      Style
    </div>
    <div style={{ display: "flex", gap: "4px" }}>
      {lineStyles.map((styleOption) => (
        <div
          key={styleOption.value}
          onClick={(event) => {
            event.stopPropagation();
            handleLineStyleChange({ lineStyle: styleOption.value });
          }}
          title={styleOption.title}
          style={{
            flex: 1,
            height: "26px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            background: lineStyle === styleOption.value ? "#2962ff" : "transparent",
            borderRadius: "4px",
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <i className={`bi ${styleOption.icon}`} />
        </div>
      ))}
    </div>
  </div>
);
