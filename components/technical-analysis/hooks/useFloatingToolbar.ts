import { useState, useRef, useEffect, useCallback, RefObject } from "react";
import { Drawing, DrawingPoint } from "../config/TechnicalAnalysisTypes";
import type { AppNotification } from "@/components/design-system/layouts/HeaderHome/lib/mock-notifications";

type ToolbarNotification = Omit<AppNotification, "id" | "timestamp" | "isRead">;

const DEFAULT_NOTIFICATION_ICONS: Record<AppNotification["type"], string> = {
    success: "faCheckCircle",
    warning: "faExclamationTriangle",
    info: "faInfoCircle",
    error: "faTimesCircle",
};

const createToolbarNotification = (
    notification: Omit<ToolbarNotification, "iconType"> & { iconType?: string },
): ToolbarNotification => ({
    ...notification,
    iconType: notification.iconType ?? DEFAULT_NOTIFICATION_ICONS[notification.type],
});

/**
 * [TENOR 2026] useFloatingToolbar
 * Extracted from TechnicalAnalysis.tsx to enforce Single Responsibility Principle.
 * Manages the local state and DOM-native drag logic for the floating drawing toolbar.
 */

interface UseFloatingToolbarProps {
    drawings: Drawing[];
    selectedDrawingId: string | null;
    updateDrawing: (id: string, updates: Partial<Drawing>) => void;
    addDrawing: (drawing: Drawing) => void;
    setSelectedDrawingId: (id: string | null) => void;
    deleteDrawing: (id: string) => void;
    addNotification: (notification: ToolbarNotification) => void;
    drawingToolbarRef: RefObject<HTMLDivElement | null>;
}

export const useFloatingToolbar = ({
    drawings,
    selectedDrawingId,
    updateDrawing,
    addDrawing,
    setSelectedDrawingId,
    deleteDrawing,
    addNotification,
    drawingToolbarRef,
}: UseFloatingToolbarProps) => {
    // --- UI State ---
    const [activeToolbarPopup, setActiveToolbarPopup] = useState<string | null>(null);
    const [isSavingAs, setIsSavingAs] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState("");

    // --- High-Performance Drag Refs (Bypassing React Render Cycle) ---
    const toolbarOffsetRef = useRef({ x: 0, y: 0 });
    const isToolbarDraggingRef = useRef(false);
    const toolbarDragStartRef = useRef({ x: 0, y: 0 });

    // --- Drag Logic ---
    useEffect(() => {
        const handleDragMove = (e: MouseEvent) => {
            if (!isToolbarDraggingRef.current) return;
            const dx = e.clientX - toolbarDragStartRef.current.x;
            const dy = e.clientY - toolbarDragStartRef.current.y;

            toolbarOffsetRef.current.x += dx;
            toolbarOffsetRef.current.y += dy;
            toolbarDragStartRef.current = { x: e.clientX, y: e.clientY };
        };

        const handleDragEnd = () => {
            isToolbarDraggingRef.current = false;
            if (drawingToolbarRef.current) {
                drawingToolbarRef.current.style.cursor = "default";
            }
        };

        window.addEventListener("mousemove", handleDragMove);
        window.addEventListener("mouseup", handleDragEnd);

        return () => {
            window.removeEventListener("mousemove", handleDragMove);
            window.removeEventListener("mouseup", handleDragEnd);
        };
    }, [drawingToolbarRef]);

    const handleToolbarDragStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isToolbarDraggingRef.current = true;
        toolbarDragStartRef.current = { x: e.clientX, y: e.clientY };

        if (drawingToolbarRef.current) {
            drawingToolbarRef.current.style.cursor = "grabbing";
        }
    }, [drawingToolbarRef]);

    // --- Action Handlers ---
    const handleLockToggle = useCallback(() => {
        if (!selectedDrawingId) return;
        const current = drawings.find((d) => d.id === selectedDrawingId);
        if (current) {
            updateDrawing(selectedDrawingId, { locked: !current.locked });
        }
    }, [drawings, selectedDrawingId, updateDrawing]);

    const handleClone = useCallback(() => {
        if (!selectedDrawingId) return;
        const current = drawings.find((d) => d.id === selectedDrawingId);

        if (current && current.points.length > 0) {
            const newId = `drawing_${Date.now()}_clone`;
            const isPositionTool = current.type === "long_position" || current.type === "short_position";

            // [TENOR 2026 SCAR-130] ROOT CAUSE FIX: Position tools store all 3 points
            // (entry, TP, SL) at the SAME timestamp. This means timeOffset = 0 and the
            // clone was placed invisibly on top of the original.
            // FIX: Apply a pure PRICE offset (5% of entry price) for position tools,
            // and sync positionProps.tpPrice / slPrice so the renderer gets consistent data.
            
            const entryPrice = Number(current.points[0].value);
            // 5% visible vertical shift — meaningful even for small price ranges
            const valueShift = entryPrice * 0.05;

            let clonedPoints: DrawingPoint[];
            const clonedPositionProps = current.positionProps ? { ...current.positionProps } : undefined;

            if (isPositionTool) {
                // --- POSITION TOOLS: Pure value shift (no time shift) ---
                clonedPoints = current.points.map((p) => ({
                    ...p,
                    value: Number(p.value) - valueShift,
                }));

                // Recalculate absolute TP/SL prices preserving the original offsets
                if (clonedPositionProps) {
                    const newEntry = entryPrice - valueShift;
                    // Preserve the same offsets from the new entry price
                    const tpOff = current.tpOffset ?? (current.positionProps?.tpPrice !== null && current.positionProps?.tpPrice !== undefined ? Math.abs(current.positionProps.tpPrice - entryPrice) : entryPrice * 0.30);
                    const slOff = current.slOffset ?? (current.positionProps?.slPrice !== null && current.positionProps?.slPrice !== undefined ? Math.abs(entryPrice - current.positionProps.slPrice) : entryPrice * 0.30);
                    clonedPositionProps.tpPrice = current.type === "long_position" ? newEntry + tpOff : newEntry - tpOff;
                    clonedPositionProps.slPrice = current.type === "long_position" ? newEntry - slOff : newEntry + slOff;
                }
            } else {
                // --- ALL OTHER TOOLS: Use time + value offset ---
                const p0Time = current.points[0].time;
                let timeOffset = 3600000; // Default 1 hour
                if (current.points.length >= 2) {
                    const p1Time = Number(current.points[1].time);
                    timeOffset = Math.max(Math.abs(p1Time - Number(p0Time)) * 0.1, 60000 * 5);
                } else {
                    timeOffset = 60000 * 5; // 5 mins fallback
                }

                clonedPoints = current.points.map((p) => {
                    const origVal = Number(p.value);
                    const origTime = Number(p.time);
                    return {
                        ...p,
                        value: !isNaN(origVal) ? origVal - valueShift : p.value,
                        time:  !isNaN(origTime) ? origTime + timeOffset : p.time,
                    };
                });
            }

            const clone: Drawing = {
                ...current,
                id: newId,
                hidden: false, // [HDR-FIX] Ensure clone is always visible
                points: clonedPoints,
                ...(clonedPositionProps ? { positionProps: clonedPositionProps } : {}),
            };

            addDrawing(clone);
            setSelectedDrawingId(newId);

            addNotification(createToolbarNotification({
                title: "Cloné",
                message: "Dessin dupliqué avec succès",
                type: "success"
            }));
        } else {
            addNotification(createToolbarNotification({
                title: "Information",
                message: "Impossible de cloner cet objet (pas de points)",
                type: "info"
            }));
        }
        setActiveToolbarPopup(null);
    }, [drawings, selectedDrawingId, addDrawing, setSelectedDrawingId, addNotification]);

    const handleVisualOrder = useCallback((_direction: "front" | "back") => {
        if (!selectedDrawingId) return;
        // In useDrawingManager, reorderDrawing is expected to be passed.
        // For now, we utilize the updateDrawing to trigger a refresh if needed,
        // but the actual array movement happens in useDrawingManager.
        // We ensure setActiveToolbarPopup(null) to close the menu.
        setActiveToolbarPopup(null);
    }, [selectedDrawingId]);

    const handleHide = useCallback(() => {
        if (!selectedDrawingId) return;
        const current = drawings.find((d) => d.id === selectedDrawingId);
        if (current) {
            updateDrawing(selectedDrawingId, { hidden: !current.hidden });
        }
        setActiveToolbarPopup(null);
    }, [drawings, selectedDrawingId, updateDrawing]);

    const handleReverse = useCallback(() => {
        if (!selectedDrawingId) return;
        const current = drawings.find((d) => d.id === selectedDrawingId);
        if (!current) return;

        if (current.type === "long_position" || current.type === "short_position") {
            const nextType = current.type === "long_position" ? "short_position" : "long_position";
            
            // In TV, reversing a position tool keeps the same entry but flips the logic.
            // Since our renderers handle tpPrice/slPrice from positionProps, we just flip the type
            // and maybe swap colors to stay consistent.
            const updates: Partial<Drawing> = {
                type: nextType,
                positionProps: current.positionProps ? {
                    ...current.positionProps,
                    tpColor: current.positionProps?.slColor,
                    slColor: current.positionProps?.tpColor,
                    tpPrice: current.positionProps?.slPrice,
                    slPrice: current.positionProps?.tpPrice,
                    tpTicks: current.positionProps?.slTicks,
                    slTicks: current.positionProps?.tpTicks,
                } : undefined,
            };
            updateDrawing(selectedDrawingId, updates);
        }
        setActiveToolbarPopup(null);
    }, [drawings, selectedDrawingId, updateDrawing]);

    const handleCopyToClipboard = useCallback(() => {
        if (!selectedDrawingId) return;
        const current = drawings.find((d) => d.id === selectedDrawingId);
        if (current) {
            try {
                const json = JSON.stringify(current, null, 2);
                if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(json).then(() => {
                        addNotification(createToolbarNotification({
                            title: "Copié",
                            message: "Dessin copié dans le presse-papier",
                            type: "success"
                        }));
                    });
                } else {
                    // Fallback for non-secure contexts
                    const textArea = document.createElement("textarea");
                    textArea.value = json;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand("copy");
                    document.body.removeChild(textArea);
                    addNotification(createToolbarNotification({
                        title: "Copié",
                        message: "Dessin copié (mode compatibilité)",
                        type: "success"
                    }));
                }
            } catch (err) {
                console.error("Failed to copy drawing:", err);
                addNotification(createToolbarNotification({
                    title: "Erreur",
                    message: "Échec de la copie",
                    type: "error"
                }));
            }
        }
        setActiveToolbarPopup(null);
    }, [drawings, selectedDrawingId, addNotification]);

    const handleClearAllDrawings = useCallback(() => {
        if (window.confirm("Voulez-vous supprimer TOUS les dessins ?")) {
            drawings.forEach((d: Drawing) => deleteDrawing(d.id));
            setActiveToolbarPopup(null);
        }
    }, [drawings, deleteDrawing]);

    return {
        // State
        activeToolbarPopup,
        setActiveToolbarPopup,
        isSavingAs,
        setIsSavingAs,
        newTemplateName,
        setNewTemplateName,
        // Refs
        toolbarOffsetRef,
        // Handlers
        handleToolbarDragStart,
        handleLockToggle,
        handleClone,
        handleHide,
        handleReverse,
        handleCopyToClipboard,
        handleVisualOrder,
        handleClearAllDrawings,
    };
};

// --- EOF ---
