import React from "react";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";
import { TRADINGVIEW_FONT_SIZES } from "../../../config/drawing/drawingFontSizeOptions";
import { stopFloatingPopupMouseDown, buildFloatingPopupStyle } from "./popupStyle";

interface FontSizePopupProps {
    drawing: Drawing;
    drawingType: Drawing["type"];
    updateDrawing: (id: string, updates: Partial<Drawing>) => void;
    closePopup: () => void;
}

const FONT_SIZES = TRADINGVIEW_FONT_SIZES;

export const FontSizePopup: React.FC<FontSizePopupProps> = ({
    drawing,
    updateDrawing,
    closePopup,
}) => {
    const current = drawing.fontSize || 14;

    const handleSelect = (size: number) => {
        updateDrawing(drawing.id, { fontSize: size });
        closePopup();
    };

    return (
        <div
            onPointerDown={stopFloatingPopupMouseDown}
            onMouseDown={stopFloatingPopupMouseDown}
            style={buildFloatingPopupStyle({
                top: "var(--popup-top, 30px)",
                left: "0px",
                width: "180px",
                overflow: "hidden",
                padding: "8px",
            })}
        >
            <div className="d-flex flex-wrap gap-1" style={{ justifyContent: "center" }}>
                {FONT_SIZES.map((size) => (
                    <button
                        key={size}
                        onClick={() => handleSelect(size)}
                        className="btn btn-link d-flex align-items-center justify-content-center"
                        style={{
                            width: "40px",
                            height: "32px",
                            padding: "0 4px",
                            color: current === size ? "#2962ff" : "#d1d4dc",
                            background: current === size ? "rgba(41, 98, 255, 0.14)" : "rgba(255, 255, 255, 0.03)",
                            border: current === size
                                ? "1px solid #2962ff"
                                : "1px solid var(--gp-border-color-light, #2d455c)",
                            borderRadius: "6px",
                            fontSize: `${Math.max(size, 12)}px`,
                            fontWeight: size >= 16 ? 600 : 400,
                            lineHeight: 1,
                            textDecoration: "none",
                            boxShadow: "none",
                            outline: "none",
                            fontFamily: "Inter, sans-serif",
                        }}
                        title={`${size}px`}
                        aria-label={`Font size ${size}`}
                    >
                        {size}
                    </button>
                ))}
            </div>
        </div>
    );
};
