import React from "react";
import clsx from "clsx";
import { Drawing, DrawingStyle } from "../../config/TechnicalAnalysisTypes";
import { ToolbarConfig } from "../../config/TechnicalAnalysisConstants";
import { ProColorPicker } from "../common/ProColorPicker";
import { QuickOptionsPopup } from "./QuickOptionsPopup";

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
    setActiveDrawingSettingsTab: (tab: "style" | "coordinates" | "visibility" | "text" | "inputs") => void;
    setIsAlertModalOpen: (val: boolean) => void;
    setActiveAlertTab: (tab: "settings" | "notifications") => void;
    handleLockToggle: () => void;
    handleClone: () => void;
    handleHide: () => void;
    handleReverse: () => void;
    handleCopyToClipboard: () => void;
    handleVisualOrder: (dir: "front" | "back") => void;
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
    setActiveDrawingSettingsTab,
    setIsAlertModalOpen,
    setActiveAlertTab,
    handleLockToggle,
    handleClone,
    handleHide,
    handleReverse,
    handleCopyToClipboard,
    handleVisualOrder,
    toolbarConfig,
}) => {
    if (!dr) return null;

    const def = (toolbarConfig as unknown as ToolbarConfig).button_definitions[buttonId];
    if (!def) return null;

    const drType = dr.type;
    const drawingStyle = (dr.style || {}) as DrawingStyle;
    const posProps = (dr.positionProps || {}) as NonNullable<Drawing["positionProps"]>;

    // [TENOR 2026] All style tokens flattened to avoid ReferenceError with Bundler/Optimizers
    const lineColor = drawingStyle.color || "#2962FF";
    const lineOpacity = drawingStyle.lineOpacity ?? 1;
    const lineWidth = drawingStyle.lineWidth || 1;
    const lineStyle = drawingStyle.lineStyle || "solid";
    const fillColor = drawingStyle.fillColor || "rgba(41, 98, 255, 0.2)";
    const fillOpacity = drawingStyle.fillOpacity ?? 0.2;
    const fillEnabled = drawingStyle.fillEnabled !== false;

    const isActive = activeToolbarPopup === buttonId || (buttonId === "text" && activeToolbarPopup === "text_color");
    const isLocked = dr.locked;



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
                setActiveAlertTab("settings");
                setIsAlertModalOpen(true);
                break;
            case "toggleLock":
                handleLockToggle();
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
            case "openTextSettings":
                setActiveDrawingSettingsTab("text");
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
                        color: "#d1d4dc", // [TENOR 2026] TV Gray for Dark Contrast
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
                        backgroundColor: "rgba(255, 255, 255, 0.15)", // [TENOR 2026] Separator for Dark Theme
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

    const iconClass = buttonId === "lock" && isLocked ? def.iconLocked : def.icon;

    return (
        <div key={buttonId} style={{ position: "relative" }}>
            <button
                key={buttonId}
                onClick={handleClick}
                className={clsx(
                    "gp-toolbar-btn",
                    "btn btn-link d-flex align-items-center justify-content-center",
                    isActive && "active",
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
                title={def.title}
            >
                {buttonId === "thickness" || buttonId === "line_style" || buttonId === "line" ? (
                    <div className="d-flex align-items-center justify-content-center px-1 gap-1" style={{ minWidth: "40px" }}>
                        <div
                            style={{
                                width: "14px",
                                height: `${Math.max(1, lineWidth)}px`,
                                backgroundColor: "#d1d4dc",
                                borderRadius: "1px",
                            }}
                        />
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
                    </div>
                ) : (
                    <div className="d-flex flex-column align-items-center justify-content-center" style={{ gap: "2px" }}>
                        <i
                            className={`bi ${buttonId === "color" || buttonId === "fill" ? "bi-paint-bucket" : iconClass}`}
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

            {/* POPUPS */}
            {isActive && buttonId === "template" && (
                <div
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        position: "absolute",
                        top: "var(--popup-top, 36px)",
                        bottom: "var(--popup-bottom, auto)",
                        left: "-20px",
                        background: "#1c2030",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "6px",
                        zIndex: 1100,
                        width: "180px",
                        overflow: "hidden",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
                        transform: "var(--popup-transform, none)",
                    }}
                >
                    {(namedTemplates[drType] || []).length > 0 && (
                        <div
                            style={{
                                padding: "4px",
                                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                                maxHeight: "120px",
                                overflowY: "auto",
                            }}
                        >
                            {(namedTemplates[drType] || []).map((t) => (
                                <div
                                    key={t.name}
                                    className="d-flex align-items-center justify-content-between p-2 hover-bg-slate-800 rounded-1"
                                    style={{
                                        fontSize: "11px",
                                        color: "#ffffff",
                                        cursor: "pointer",
                                    }}
                                >
                                    <span
                                        onClick={() => {
                                            applyNamedTemplate(dr.id, t.name);
                                            setActiveToolbarPopup(null);
                                        }}
                                    >
                                        {t.name}
                                    </span>
                                    <i
                                        className="bi bi-x-circle-fill"
                                        style={{ fontSize: "10px", opacity: 0.3 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteNamedTemplate(drType, t.name);
                                        }}
                                    ></i>
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
                            <i className="bi bi-plus-lg"></i>
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
                                onChange={(e) => setNewTemplateName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && newTemplateName && dr.id) {
                                        saveNamedTemplate(dr.id, newTemplateName);
                                        setIsSavingAs(false);
                                        setNewTemplateName("");
                                        setActiveToolbarPopup(null);
                                    }
                                    if (e.key === "Escape") setIsSavingAs(false);
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
                                    onClick={() => {
                                        if (newTemplateName && dr.id) {
                                            saveNamedTemplate(dr.id, newTemplateName);
                                            setIsSavingAs(false);
                                            setNewTemplateName("");
                                            setActiveToolbarPopup(null);
                                        }
                                    }}
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
                            if (dr.id) saveAsDefault(dr.id);
                            setActiveToolbarPopup(null);
                        }}
                        className="d-flex align-items-center gap-2 p-2 hover-bg-slate-800"
                        style={{
                            fontSize: "11px",
                            color: "#ffffff",
                            cursor: "pointer",
                            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                    >
                        <i className="bi bi-file-earmark-arrow-down" style={{ color: "#787b86" }}></i>
                        <span>Enregistrer par défaut</span>
                    </div>
                    <div
                        onClick={() => {
                            if (dr.id) resetStyle(dr.id);
                            setActiveToolbarPopup(null);
                        }}
                        className="d-flex align-items-center gap-2 p-2 hover-bg-slate-800"
                        style={{
                            fontSize: "11px",
                            color: "#ffffff",
                            cursor: "pointer"
                        }}
                    >
                        <i className="bi bi-arrow-counterclockwise" style={{ color: "#787b86" }}></i>
                        <span>Réinitialiser</span>
                    </div>
                </div>
            )}

            {isActive && buttonId === "layers" && (
                <div
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        position: "absolute",
                        top: "var(--popup-top, 36px)",
                        bottom: "var(--popup-bottom, auto)",
                        left: "-100px",
                        background: "#1c2030",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        padding: "10px",
                        borderRadius: "6px",
                        zIndex: 1100,
                        width: "200px",
                        color: "#ffffff",
                        fontSize: "11px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
                        transform: "var(--popup-transform, none)",
                    }}
                >
                    <div className="fw-bold mb-2">Arborescence des objets</div>
                    <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                        {drawings.map((d: Drawing) => (
                            <div
                                key={d.id}
                                className={clsx(
                                    "p-1 mb-1 rounded d-flex align-items-center justify-content-between",
                                    d.id === selectedDrawingId ? "bg-primary text-white" : "hover-bg-slate-800",
                                )}
                                style={{ cursor: "pointer" }}
                                onClick={() => setSelectedDrawingId(d.id)}
                            >
                                <span className="text-truncate" style={{ maxWidth: "120px" }}>
                                    {d.type.replace("_", " ")}
                                </span>
                                <div className="d-flex gap-1" style={{ opacity: 0.6 }}>
                                    <i
                                        className={clsx(
                                            "bi",
                                            d.locked ? "bi-lock-fill" : "bi-unlock",
                                        )}
                                        style={{ fontSize: "10px" }}
                                    ></i>
                                    <i
                                        className="bi bi-trash"
                                        style={{ fontSize: "10px" }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteDrawing(d.id);
                                        }}
                                    ></i>
                                </div>
                            </div>
                        ))}
                        {drawings.length === 0 && (
                            <div className="text-center opacity-30 py-2">Aucun objet</div>
                        )}
                    </div>
                </div>
            )}
            
            {isActive && buttonId === "color" && (
                <div
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        position: "absolute",
                        top: "var(--popup-top, 36px)",
                        bottom: "var(--popup-bottom, auto)",
                        left: "-110px",
                        background: "#1c2030",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        padding: "10px",
                        borderRadius: "8px",
                        zIndex: 1100,
                        width: "240px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
                        transform: "var(--popup-transform, none)",
                    }}
                >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <div
                            style={{
                                fontSize: "10px",
                                color: "#787b86",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                            }}
                        >
                            &quot;Ligne&quot;
                        </div>
                        <button
                            onClick={() => setActiveToolbarPopup(null)}
                            className="btn btn-link p-0 text-secondary"
                            style={{ fontSize: "16px" }}
                        >
                            <i className="bi bi-x"></i>
                        </button>
                    </div>
                    <ProColorPicker
                        color={lineColor}
                        opacity={lineOpacity}
                        onChange={(c, a) => handleColorChange(c, a, true)}
                    />
                </div>
            )}

            {isActive && buttonId === "text" && activeToolbarPopup === "text_color" && (
                <div
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        position: "absolute",
                        top: "var(--popup-top, 36px)",
                        bottom: "var(--popup-bottom, auto)",
                        left: "-110px",
                        background: "#1c2030",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        padding: "10px",
                        borderRadius: "8px",
                        zIndex: 1100,
                        width: "240px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
                        transform: "var(--popup-transform, none)",
                    }}
                >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <div
                            style={{
                                fontSize: "10px",
                                color: "#787b86",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                            }}
                        >
                            Texte
                        </div>
                        <button
                            onClick={() => setActiveToolbarPopup(null)}
                            className="btn btn-link p-0 text-secondary"
                            style={{ fontSize: "16px" }}
                        >
                            <i className="bi bi-x-lg"></i>
                        </button>
                    </div>
                    <ProColorPicker
                        color={dr?.textColor || "#ffffff"}
                        opacity={1}
                        onChange={(c, o) => handleTextColorChange(c, o, false)}
                    />
                </div>
            )}

            {isActive && buttonId === "fill" && (
                <div
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        position: "absolute",
                        top: "var(--popup-top, 36px)",
                        bottom: "var(--popup-bottom, auto)",
                        left: "-110px",
                        background: "#1c2030",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        padding: "10px",
                        borderRadius: "8px",
                        zIndex: 1100,
                        width: "240px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
                        transform: "var(--popup-transform, none)",
                    }}
                >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <div
                            style={{
                                fontSize: "10px",
                                color: "#787b86",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                            }}
                        >
                            Fond
                        </div>
                        <button
                            onClick={() => setActiveToolbarPopup(null)}
                            className="btn btn-link p-0 text-secondary"
                            style={{ fontSize: "16px" }}
                        >
                            <i className="bi bi-x"></i>
                        </button>
                    </div>
                    <ProColorPicker
                        color={fillColor}
                        opacity={fillOpacity}
                        onChange={(c: string, a: number) =>
                            handleFillChange(c, a, false, "both")
                        }
                    />
                    <div className="mt-2" style={{ fontSize: "11px", color: "#ffffff" }}>
                        <label className="d-flex align-items-center gap-2" style={{ cursor: "pointer" }}>
                            <input
                                type="checkbox"
                                checked={
                                    dr.cyclesProps ? dr.cyclesProps.fillBackground !== false :
                                    dr.fibProps ? dr.fibProps.fillBackground !== false :
                                    dr.regressionProps ? dr.regressionProps.fillBackground !== false :
                                    dr.pitchforkProps ? dr.pitchforkProps.fillBackground !== false :
                                    dr.pitchfanProps ? dr.pitchfanProps.fillBackground !== false :
                                    dr.gannSquareProps ? dr.gannSquareProps.fillBackground !== false :
                                    dr.gannFanProps ? dr.gannFanProps.fillBackground !== false :
                                    fillEnabled
                                }
                                onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    const updates: Partial<Drawing> = {
                                        style: {
                                            ...drawingStyle,
                                            fillEnabled: isChecked,
                                        },
                                    };
                                    if (dr.cyclesProps) updates.cyclesProps = { ...dr.cyclesProps, fillBackground: isChecked };
                                    if (dr.fibProps) updates.fibProps = { ...dr.fibProps, fillBackground: isChecked };
                                    if (dr.regressionProps) updates.regressionProps = { ...dr.regressionProps, fillBackground: isChecked };
                                    if (dr.pitchforkProps) updates.pitchforkProps = { ...dr.pitchforkProps, fillBackground: isChecked };
                                    if (dr.pitchfanProps) updates.pitchfanProps = { ...dr.pitchfanProps, fillBackground: isChecked };
                                    if (dr.gannSquareProps) updates.gannSquareProps = { ...dr.gannSquareProps, fillBackground: isChecked };
                                    if (dr.gannFanProps) updates.gannFanProps = { ...dr.gannFanProps, fillBackground: isChecked };
                                    
                                    updateDrawing(dr.id, updates);
                                }}
                            />
                            <span>Remplissage</span>
                        </label>
                    </div>
                </div>
            )}

            {isActive && buttonId === "tp_fill" && (
                <div
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        position: "absolute",
                        top: "var(--popup-top, 36px)",
                        bottom: "var(--popup-bottom, auto)",
                        left: "-110px",
                        background: "#1c2030",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        padding: "10px",
                        borderRadius: "8px",
                        zIndex: 1100,
                        width: "240px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
                        transform: "var(--popup-transform, none)",
                    }}
                >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <div
                            style={{
                                fontSize: "10px",
                                color: "#00da3c",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                            }}
                        >
                            Profit
                        </div>
                        <button
                            onClick={() => setActiveToolbarPopup(null)}
                            className="btn btn-link p-0 text-secondary"
                            style={{ fontSize: "16px" }}
                        >
                            <i className="bi bi-x"></i>
                        </button>
                    </div>
                    <ProColorPicker
                        color={posProps.tpColor || "#00da3c"}
                        opacity={
                            posProps.tpOpacity !== undefined ? posProps.tpOpacity : fillOpacity
                        }
                        onChange={(c: string, a: number) =>
                            handleFillChange(c, a, false, "tp")
                        }
                    />
                </div>
            )}

            {isActive && buttonId === "sl_fill" && (
                <div
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        position: "absolute",
                        top: "var(--popup-top, 36px)",
                        bottom: "var(--popup-bottom, auto)",
                        left: "-110px",
                        background: "#1c2030",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        padding: "10px",
                        borderRadius: "8px",
                        zIndex: 1100,
                        width: "240px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
                        transform: "var(--popup-transform, none)",
                    }}
                >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <div
                            style={{
                                fontSize: "10px",
                                color: "#ec0000",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                            }}
                        >
                            Perte
                        </div>
                        <button
                            onClick={() => setActiveToolbarPopup(null)}
                            className="btn btn-link p-0 text-secondary"
                            style={{ fontSize: "16px" }}
                        >
                            <i className="bi bi-x"></i>
                        </button>
                    </div>
                    <ProColorPicker
                        color={posProps.slColor || "#ec0000"}
                        opacity={
                            posProps.slOpacity !== undefined ? posProps.slOpacity : fillOpacity
                        }
                        onChange={(c: string, a: number) =>
                            handleFillChange(c, a, false, "sl")
                        }
                    />
                </div>
            )}

            {isActive && (buttonId === "line" || buttonId === "line_style" || buttonId === "thickness") && (
                <div
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        position: "absolute",
                        top: "var(--popup-top, 36px)",
                        bottom: "var(--popup-bottom, auto)",
                        left: "-150px",
                        background: "#1c2030",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        padding: "10px",
                        borderRadius: "8px",
                        zIndex: 1100,
                        width: "140px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
                        transform: "var(--popup-transform, none)",
                    }}
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
                        {[1, 2, 3, 4].map((w) => {
                            return (
                                <div
                                    key={w}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleLineStyleChange({ lineWidth: w });
                                    }}
                                    style={{
                                        flex: 1,
                                        height: "26px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        background: lineWidth === w ? "#2962ff" : "transparent",
                                        cursor: "pointer",
                                        borderRadius: "4px",
                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "60%",
                                            height: `${w}px`,
                                            background: "#ffffff",
                                            borderRadius: "1px",
                                        }}
                                    ></div>
                                </div>
                            );
                        })}
                    </div>
                    <div
                        style={{ height: "1px", background: "rgba(255, 255, 255, 0.1)", margin: "2px 0" }}
                    ></div>
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
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                handleLineStyleChange({ lineStyle: "solid" });
                            }}
                            title="Solid"
                            style={{
                                flex: 1,
                                height: "26px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                background: lineStyle === "solid" ? "#2962ff" : "transparent",
                                borderRadius: "4px",
                                color: "#ffffff",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                            }}
                        >
                            <i className="bi bi-dash-lg"></i>
                        </div>
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                handleLineStyleChange({ lineStyle: "dashed" });
                            }}
                            title="Dashed"
                            style={{
                                flex: 1,
                                height: "26px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                background: lineStyle === "dashed" ? "#2962ff" : "transparent",
                                borderRadius: "4px",
                                color: "#ffffff",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                            }}
                        >
                            <i className="bi bi-three-dots"></i>
                        </div>
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                handleLineStyleChange({ lineStyle: "dotted" });
                            }}
                            title="Dotted"
                            style={{
                                flex: 1,
                                height: "26px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                background: lineStyle === "dotted" ? "#2962ff" : "transparent",
                                borderRadius: "4px",
                                color: "#ffffff",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                            }}
                        >
                            <i className="bi bi-dot"></i>
                        </div>
                    </div>
                </div>
            )}

            {isActive && buttonId === "more" && (
                <div
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        position: "absolute",
                        top: "var(--popup-top, 36px)",
                        bottom: "var(--popup-bottom, auto)",
                        left: "-170px",
                        background: "#1c2030",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "6px",
                        zIndex: 1100,
                        width: "220px",
                        overflow: "hidden",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
                        transform: "var(--popup-transform, none)",
                        padding: "4px 0",
                    }}
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
                            <i className="bi bi-layers"></i>
                            <span>Cloner</span>
                        </div>
                    </div>

                    <div className="tv-menu-item" onClick={handleCopyToClipboard}>
                        <div className="d-flex align-items-center">
                            <i className="bi bi-copy"></i>
                            <span>Copier</span>
                        </div>
                        <span className="tv-menu-shortcut">Ctrl+C</span>
                    </div>

                    {(drType === "long_position" || drType === "short_position") && (
                        <div className="tv-menu-item" onClick={handleReverse}>
                            <div className="d-flex align-items-center">
                                <i className="bi bi-arrow-down-up"></i>
                                <span>Inverser la position</span>
                            </div>
                        </div>
                    )}

                    <div className="tv-menu-item" onClick={handleHide}>
                        <div className="d-flex align-items-center">
                            <i className={dr.hidden ? "bi bi-eye" : "bi bi-eye-slash"}></i>
                            <span>{dr.hidden ? "Afficher" : "Cacher"}</span>
                        </div>
                        <span className="tv-menu-shortcut">Ctrl+H</span>
                    </div>

                    <div className="tv-menu-divider"></div>

                    <div className="tv-menu-item" onClick={() => handleVisualOrder("front")}>
                        <div className="d-flex align-items-center">
                            <i className="bi bi-front"></i>
                            <span>Mettre au premier plan</span>
                        </div>
                        <span className="tv-menu-shortcut">Alt+F</span>
                    </div>

                    <div className="tv-menu-item" onClick={() => handleVisualOrder("back")}>
                        <div className="d-flex align-items-center">
                            <i className="bi bi-back"></i>
                            <span>Mettre en arrière-plan</span>
                        </div>
                        <span className="tv-menu-shortcut">Alt+B</span>
                    </div>

                    <div className="tv-menu-divider"></div>

                    <div className="tv-menu-item" onClick={() => deleteDrawing(dr.id)} style={{ color: "#f23645" }}>
                        <div className="d-flex align-items-center">
                            <i className="bi bi-trash" style={{ color: "inherit" }}></i>
                            <span>Supprimer</span>
                        </div>
                        <span className="tv-menu-shortcut">Suppr</span>
                    </div>

                    <div className="tv-menu-divider"></div>

                    <div className="tv-menu-item" onClick={() => setSelectedDrawingId(null)}>
                        <div className="d-flex align-items-center">
                            <i className="bi bi-x-lg"></i>
                            <span>Fermer le Toolkit</span>
                        </div>
                    </div>
                </div>
            )}

            {isActive && buttonId === "quick_options" && (drType === "gann_square" || drType === "gann_square_fixed" || drType === "gann_box") && (
                <div
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        position: "absolute",
                        top: "var(--popup-top, 30px)",
                        bottom: "var(--popup-bottom, auto)",
                        left: "-170px",
                        background: "#ffffff",
                        border: "1px solid #e0e3eb",
                        borderRadius: "6px",
                        zIndex: 1100,
                        width: "200px",
                        overflow: "hidden",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                        transform: "var(--popup-transform, none)",
                        padding: "10px",
                    }}
                >
                    <QuickOptionsPopup dr={dr} updateDrawing={updateDrawing} />
                </div>
            )}
        </div>
    );
};
