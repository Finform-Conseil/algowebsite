import React from "react";
import clsx from "clsx";
import type { DrawingStyle } from "../../../config/drawing/drawingPrimitiveTypes";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";
import type { ToolbarConfig } from "../../../config/drawing/drawingToolbarTypes";
import { TEXT_NOTE_TOOL_VARIANT_SET } from "../../../config/drawing/drawingConstants";
import { getLockTooltip } from "../../../lib/drawingToolbarLabels";
import { ToolbarButtonPopups } from "./ToolbarButtonPopups";

interface ToolbarButtonProps {
    buttonId: string;
    selectedDrawing: Drawing | null;
    activeToolbarPopup: string | null;
    setActiveToolbarPopup: (id: string | null) => void;
    drawings: Drawing[];
    selectedDrawingId: string | null;
    setSelectedDrawingId: (id: string | null) => void;
    updateDrawing: (id: string, updates: Partial<Drawing>) => void;
    deleteDrawing: (id: string) => void;
    handleColorChange: (color: string, opacity: number, isLine: boolean) => void;
    handleFillChange: (color: string, opacity: number, isLine: boolean, target: "both" | "tp" | "sl") => void;
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
    setIsDrawingSettingsModalOpen: (val: boolean) => void;
    setIsAlertModalOpen: (val: boolean) => void;
    handleLockToggle: () => void;
    handleClone: () => void;
    handleHide: () => void;
    handleReverse: () => void;
    handleCopyToClipboard: () => void;
    handleVisualOrder: (dir: "front" | "back" | "forward" | "backward") => void;
    toolbarConfig: ToolbarConfig;
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
    buttonId,
    selectedDrawing: dr,
    activeToolbarPopup,
    setActiveToolbarPopup,
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
    setIsDrawingSettingsModalOpen,
    setIsAlertModalOpen,
    handleLockToggle,
    handleClone,
    handleHide,
    handleReverse,
    handleCopyToClipboard,
    handleVisualOrder,
    toolbarConfig,
}) => {

    if (!dr) return null;

    const def = toolbarConfig.button_definitions[buttonId];
    if (!def) return null;

    const drType = dr.type;
    const isTextNote = TEXT_NOTE_TOOL_VARIANT_SET.has(drType);
    const drToolbar = drType ? (toolbarConfig.drawings as Record<string, { toolbar: string[] }>)[drType]?.toolbar : undefined;
    const hasSeparateFontSize = drToolbar?.includes("font_size") === true;
    const drawingStyle = (dr.style || {}) as DrawingStyle;
    const posProps = (dr.positionProps || {}) as NonNullable<Drawing["positionProps"]>;
    const hasQuickOptionsPopup =
        drType === "gann_square" ||
        drType === "gann_square_fixed" ||
        drType === "gann_box" ||
        drType === "anchored_volume_profile" ||
        drType === "fixed_range_volume_profile" ||
        drType === "brush" ||
        drType === "highlighter";

    // [TENOR 2026] All style tokens flattened to avoid ReferenceError with Bundler/Optimizers
    const lineColor = drawingStyle.color || "#2962FF";
    const lineOpacity = drawingStyle.lineOpacity ?? 1;
    const lineWidth = drawingStyle.lineWidth || 1;
    const lineStyle: DrawingStyle["lineStyle"] = drawingStyle.lineStyle || "solid";
    const fillColor = drawingStyle.fillColor || "rgba(41, 98, 255, 0.2)";
    const fillOpacity = drawingStyle.fillOpacity ?? 0.2;
    const fillEnabled = drawingStyle.fillEnabled !== false;
    const closePopup = () => setActiveToolbarPopup(null);


    const isActive = activeToolbarPopup === buttonId || (buttonId === "text" && activeToolbarPopup === "text_color");
    const isLocked = dr.locked;
    const buttonTitle = buttonId === "text"
        ? "Text"
        : buttonId === "visibility"
            ? (dr.hidden ? "Afficher" : "Masquer")
            : buttonId === "lock"
                ? getLockTooltip(dr.locked)
                : (buttonId === "thickness" && (drType === "brush" || drType === "highlighter") ? "Line tool width" : def.title);



    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        switch (def.action) {
            case "openTemplatePopup":
                setActiveToolbarPopup(isActive ? null : "template");
                setIsSavingAs(false);
                setNewTemplateName("");
                break;
            case "openColorPopup":
                setActiveToolbarPopup(isActive ? null : "color");
                break;
            case "openTextColorPopup":
                setActiveToolbarPopup(isActive ? null : "text_color");
                break;
            case "openLineStylePopup":
                setActiveToolbarPopup(isActive ? null : "line_style");
                break;
            case "openFillPopup":
                setActiveToolbarPopup(isActive ? null : "fill");
                break;
            case "openTPFillPopup":
                setActiveToolbarPopup(isActive ? null : "tp_fill");
                break;
            case "openSLFillPopup":
                setActiveToolbarPopup(isActive ? null : "sl_fill");
                break;
            case "openSettingsModal":
                setIsDrawingSettingsModalOpen(true);
                break;
            case "openAlertModal":
                setIsAlertModalOpen(true);
                break;
            case "toggleLock":
                handleLockToggle();
                break;
            case "toggleVisibility":
                handleHide();
                break;
            case "deleteDrawing":
                deleteDrawing(dr.id);
                break;
            case "openMorePopup":
                setActiveToolbarPopup(isActive ? null : "more");
                break;
            case "openQuickOptions":
                setActiveToolbarPopup(isActive ? null : "quick_options");
                break;
            case "openFontSizePopup":
                setActiveToolbarPopup(isActive ? null : "font_size");
                break;
            case "openTextSettings":
                setIsDrawingSettingsModalOpen(true);
                break;
            case "openThicknessPopup":
                setActiveToolbarPopup(isActive ? null : "thickness");
                break;
            case "toggleOrientation":
                if (drType === "arrow_marker") {
                    const orientations: ("top" | "bottom" | "left" | "right")[] = [
                        "bottom",
                        "left",
                        "top",
                        "right",
                    ];
                    const current = dr.arrowOrientation || "bottom";
                    const nextIndex = (orientations.indexOf(current) + 1) % orientations.length;
                    updateDrawing(dr.id, {
                        arrowOrientation: orientations[nextIndex],
                    });
                }
                break;
            case "openObjectTree":
                setActiveToolbarPopup(isActive ? null : "layers");
                break;
            case "drag":
                break;
            case "openShapeSwitcherPopup":
                setActiveToolbarPopup(isActive ? null : "shape_switcher");
                break;
            case "toggleAnchor":
                updateDrawing(dr.id, { anchored: !dr.anchored });
                break;
            case "addTableRow":
                if (dr?.tableProps) {
                    const tp = dr.tableProps;
                    const newRow = tp.rows;
                    const newRowHeights = [...tp.rowHeights, 30];
                    const newCells = tp.cells.map(row => [...row]);
                    newCells.push(Array.from({ length: tp.columns }, () => ({ text: "" })));
                    updateDrawing(dr.id, {
                        tableProps: { ...tp, rows: newRow + 1, rowHeights: newRowHeights, cells: newCells },
                    });
                }
                break;
            case "addTableColumn":
                if (dr?.tableProps) {
                    const tp = dr.tableProps;
                    const newCol = tp.columns;
                    const newColumnWidths = [...tp.columnWidths, 80];
                    const newCells = tp.cells.map(row => [...row, { text: "" }]);
                    updateDrawing(dr.id, {
                        tableProps: { ...tp, columns: newCol + 1, columnWidths: newColumnWidths, cells: newCells },
                    });
                }
                break;
            case "removeTableRow":
                if (dr?.tableProps && dr.tableProps.rows > 1) {
                    const tp = dr.tableProps;
                    const newRowHeights = tp.rowHeights.slice(0, -1);
                    const newCells = tp.cells.slice(0, -1);
                    updateDrawing(dr.id, {
                        tableProps: { ...tp, rows: tp.rows - 1, rowHeights: newRowHeights, cells: newCells },
                    });
                }
                break;
            case "removeTableColumn":
                if (dr?.tableProps && dr.tableProps.columns > 1) {
                    const tp = dr.tableProps;
                    const newColumnWidths = tp.columnWidths.slice(0, -1);
                    const newCells = tp.cells.map(row => row.slice(0, -1));
                    updateDrawing(dr.id, {
                        tableProps: { ...tp, columns: tp.columns - 1, columnWidths: newColumnWidths, cells: newCells },
                    });
                }
                break;
            default:
                break;
        }
    };

    if (buttonId === "move") {
        return (
            <React.Fragment key={buttonId}>
                <div
                    data-toolbar-drag-handle="true"
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 2px)",
                        gridTemplateRows: "repeat(3, 2px)",
                        gap: "3px",
                        cursor: "grab",
                        color: "#787b86",
                        padding: "4px",
                        marginRight: "2px",
                        alignContent: "center",
                    }}
                >
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            style={{
                                width: "2px",
                                height: "2px",
                                backgroundColor: "currentColor",
                                borderRadius: "50%",
                            }}
                        ></div>
                    ))}
                </div>
                <div
                    style={{
                        width: "1px",
                        height: "16px",
                        backgroundColor: "rgba(255, 255, 255, 0.15)",
                        margin: "0 4px",
                    }}
                ></div>
            </React.Fragment>
        );
    }

    if (buttonId === "icon_tool") {
        return (
            <div
                key={buttonId}
                className="d-flex align-items-center justify-content-center"
                style={{ width: "28px", height: "28px", color: "#64748b" }}
            >
                <i className={`bi ${def.icon}`} style={{ fontSize: "14px" }}></i>
            </div>
        );
    }

    if (buttonId === "font_size") {
        return (
            <div key={buttonId} style={{ position: "relative" }}>
                <button
                    key={buttonId}
                    onClick={handleClick}
                    className="gp-toolbar-btn btn btn-link d-flex align-items-center justify-content-center"
                    style={{
                        width: "32px",
                        height: "32px",
                        padding: 0,
                        textDecoration: "none",
                        boxShadow: "none",
                        outline: "none",
                        color: isActive ? "#2962ff" : "#d1d4dc",
                        fontSize: "12px",
                        fontWeight: 600,
                    }}
                    title={dr ? `Font size: ${dr.fontSize || 14}` : ""}
                    aria-label="Font size"
                >
                    <span style={{ lineHeight: 1 }}>{dr?.fontSize || 14}</span>
                </button>
                <ToolbarButtonPopups
                    buttonId={buttonId}
                    drawing={dr}
                    drawingType={drType}
                    isActive={isActive}
                    activeToolbarPopup={activeToolbarPopup}
                    drawings={drawings}
                    selectedDrawingId={selectedDrawingId}
                    setSelectedDrawingId={setSelectedDrawingId}
                    updateDrawing={updateDrawing}
                    deleteDrawing={deleteDrawing}
                    handleColorChange={handleColorChange}
                    handleFillChange={handleFillChange}
                    handleLineStyleChange={handleLineStyleChange}
                    handleTextColorChange={handleTextColorChange}
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
                    drawingStyle={drawingStyle}
                    positionProps={posProps}
                    lineColor={lineColor}
                    lineOpacity={lineOpacity}
                    lineWidth={lineWidth}
                    lineStyle={lineStyle}
                    fillColor={fillColor}
                    fillOpacity={fillOpacity}
                    fillEnabled={fillEnabled}
                    hasQuickOptionsPopup={hasQuickOptionsPopup}
                    handleClone={handleClone}
                    handleHide={handleHide}
                    handleReverse={handleReverse}
                    handleCopyToClipboard={handleCopyToClipboard}
                    handleVisualOrder={handleVisualOrder}
                />
            </div>
        );
    }

    const iconClass =
        buttonId === "lock" && isLocked
            ? def.iconLocked
            : buttonId === "visibility" && dr.hidden
                ? "bi-eye-slash"
                : buttonId === "anchor" && dr.anchored
                    ? def.iconAnchored
                    : def.icon;

    return (
        <div key={buttonId} style={{ position: "relative" }}>
            <button
                key={buttonId}
                onClick={handleClick}
                className={clsx(
                    "gp-toolbar-btn",
                    "btn btn-link d-flex align-items-center justify-content-center",
                    (isActive || (buttonId === "visibility" && dr.hidden)) && "active",
                )}
                style={{
                    width: "32px", // [TENOR 2026] Slightly wider for TV padding
                    height: "32px",
                    padding: 0,
                    textDecoration: "none",
                    boxShadow: "none",
                    outline: "none",
                    color: "#d1d4dc", // [TENOR 2026] TV Gray for Dark Theme
                }}
                title={buttonTitle}
                aria-label={buttonTitle}
            >
                {buttonId === "thickness" || buttonId === "line_style" || buttonId === "line" ? (
                    <div className="d-flex align-items-center justify-content-center px-1 gap-1" style={{ minWidth: "40px" }}>
                        {drType === "brush" || drType === "highlighter" ? (
                            <svg viewBox="0 0 24 24" width="16" height="16" style={{ fill: "none", stroke: "#d1d4dc", strokeWidth: Math.min(4, Math.max(1.5, lineWidth / 3)), strokeLinecap: "round" }}>
                                <path d="M4 14c2-3 4-3 6 0s4 3 6 0 2-3 4-3" />
                            </svg>
                        ) : (
                            <div
                                style={{
                                    width: "14px",
                                    height: `${Math.max(1, lineWidth)}px`,
                                    backgroundColor: "#d1d4dc",
                                    borderRadius: "1px",
                                }}
                            />
                        )}
                        <span
                            style={{
                                fontSize: "11px",
                                fontWeight: 500,
                                color: "#d1d4dc",
                                opacity: 0.8,
                            }}
                        >
                            {lineWidth}px
                        </span>
                    </div>
                ) : buttonId === "orientation" ? (
                    <div className="d-flex align-items-center justify-content-center">
                        <i
                            className={clsx(
                                "bi",
                                dr.arrowOrientation === "top" && "bi-arrow-up",
                                (dr.arrowOrientation === "bottom" || !dr.arrowOrientation) && "bi-arrow-down",
                                dr.arrowOrientation === "left" && "bi-arrow-left",
                                dr.arrowOrientation === "right" && "bi-arrow-right",
                            )}
                            style={{ fontSize: "14px", color: "#d1d4dc" }}
                        ></i>
                    </div>
                ) : def.icon === "color_box" ? (
                    <div
                        style={{
                            width: "14px",
                            height: "14px",
                            backgroundColor:
                                buttonId === "tp_fill"
                                    ? posProps.tpColor || "#00da3c"
                                    : buttonId === "sl_fill"
                                        ? posProps.slColor || "#ec0000"
                                        : buttonId === "fill"
                                            ? fillColor
                                            : lineColor,
                            borderRadius: "2px",
                            border: "1px solid rgba(255,255,255,0.2)",
                        }}
                    />
                ) : buttonId === "text" ? (
                    <div className="d-flex flex-column align-items-center justify-content-center" style={{ gap: "1px", width: "100%", height: "100%" }}>
                        <i
                            className="bi bi-type"
                            style={{
                                fontSize: "14px",
                                color: isActive ? "#2962ff" : "inherit",
                            }}
                        ></i>
                        <div
                            style={{
                                width: "14px",
                                height: "2px",
                                backgroundColor: dr?.textColor || "#FFFFFF",
                                borderRadius: "1px",
                            }}
                        />
                        {isTextNote && !hasSeparateFontSize && (
                            <span
                                style={{
                                    fontSize: "9px",
                                    lineHeight: 1,
                                    color: "#d1d4dc",
                                    opacity: 0.85,
                                    fontWeight: 600,
                                }}
                            >
                                {dr.fontSize || 14}
                            </span>
                        )}
                    </div>
                ) : (
                    <div className="d-flex flex-column align-items-center justify-content-center" style={{ gap: "2px" }}>
                        <i
                            className={`bi ${buttonId === "fill" ? "bi-paint-bucket" : iconClass}`}
                            style={{
                                fontSize: "15px",
                                color: (buttonId === "lock" && isLocked) || isActive ? "#2962ff" : "inherit",
                            }}
                        ></i>
                        {(buttonId === "color" || buttonId === "fill" || buttonId === "tp_fill" || buttonId === "sl_fill") && (
                            <div
                                style={{
                                    width: "16px",
                                    height: "3px",
                                    backgroundColor:
                                        buttonId === "tp_fill"
                                            ? posProps.tpColor || "#00da3c"
                                            : buttonId === "sl_fill"
                                                ? posProps.slColor || "#ec0000"
                                                : buttonId === "fill"
                                                    ? fillColor
                                                    : lineColor,
                                    borderRadius: "1px",
                                }}
                            />
                        )}
                    </div>
                )}
            </button>

            <ToolbarButtonPopups
                buttonId={buttonId}
                drawing={dr}
                drawingType={drType}
                isActive={isActive}
                activeToolbarPopup={activeToolbarPopup}
                drawings={drawings}
                selectedDrawingId={selectedDrawingId}
                setSelectedDrawingId={setSelectedDrawingId}
                updateDrawing={updateDrawing}
                deleteDrawing={deleteDrawing}
                handleColorChange={handleColorChange}
                handleFillChange={handleFillChange}
                handleLineStyleChange={handleLineStyleChange}
                handleTextColorChange={handleTextColorChange}
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
                drawingStyle={drawingStyle}
                positionProps={posProps}
                lineColor={lineColor}
                lineOpacity={lineOpacity}
                lineWidth={lineWidth}
                lineStyle={lineStyle}
                fillColor={fillColor}
                fillOpacity={fillOpacity}
                fillEnabled={fillEnabled}
                hasQuickOptionsPopup={hasQuickOptionsPopup}
                handleClone={handleClone}
                handleHide={handleHide}
                handleReverse={handleReverse}
                handleCopyToClipboard={handleCopyToClipboard}
                handleVisualOrder={handleVisualOrder}
            />
        </div>
    );
};
