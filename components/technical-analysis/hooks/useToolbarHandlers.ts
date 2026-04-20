/**
 * [TENOR 2026 DRY] useToolbarHandlers
 * Extracted from TechnicalAnalysis.tsx — Phase 4 of DRY Apex Elite Consolidation
 *
 * Encapsulates the three style-mutation handlers used by the floating toolbar:
 *  - handleColorChange  → updates stroke/line color + per-tool-specific props
 *  - handleFillChange   → updates fill color/opacity + per-tool-specific props
 *  - handleLineStyleChange → updates lineWidth / lineStyle + per-tool-specific props
 *
 * Dependencies are injected as parameters to keep this hook stateless and
 * independent from the God Component's React state.
 */

import { useCallback } from "react";
import { Drawing, DrawingStyle } from "../config/TechnicalAnalysisTypes";
import {
    POSITION_TOOLS,
    FIB_TOOLS_ONE_COLOR,
    PITCHFORK_TOOLS,
    FIB_PURE_TOOLS,
} from "../config/TechnicalAnalysisConstants";

interface UseToolbarHandlersProps {
    drawings: Drawing[];
    selectedDrawingId: string | null;
    updateDrawing: (id: string, updates: Partial<Drawing>) => void;
    setActiveToolbarPopup: (popup: string | null) => void;
}

export const useToolbarHandlers = ({
    drawings,
    selectedDrawingId,
    updateDrawing,
    setActiveToolbarPopup,
}: UseToolbarHandlersProps) => {

    // =========================================================================
    // handleColorChange — Updates the global stroke/line color for any tool
    // =========================================================================
    const handleColorChange = useCallback((
        newColor: string,
        alpha: number = 1,
        shouldClose = false,
    ) => {
        if (!selectedDrawingId) return;
        const current = drawings.find((d) => d.id === selectedDrawingId);
        if (current) {
            const updates: Partial<Drawing> = {
                style: { ...current.style, color: newColor, lineOpacity: alpha },
            };

            if (
                (POSITION_TOOLS as readonly string[]).includes(current.type)
            ) {
                const pProps = (current.positionProps || {}) as NonNullable<Drawing["positionProps"]>;
                pProps.lineColor = newColor;
                pProps.lineOpacity = alpha;
                updates.positionProps = pProps;
                updates.style = { ...current.style, color: newColor, lineOpacity: alpha };
                if (!current.textColor) updates.textColor = "#ffffff";
            } else if (current.type === "fib_retracement" && current.fibProps) {
                // [TENOR 2026] Fib Retracement Color -> Update TrendLine only (preserve rainbow levels)
                const newFibProps = { ...current.fibProps };
                newFibProps.trendLine = {
                    ...(newFibProps.trendLine || { enabled: true, color: "#787b86", lineStyle: "dashed", lineWidth: 1, }),
                    color: newColor,
                    lineOpacity: alpha
                };
                if (newFibProps.useOneColor) {
                    newFibProps.oneColor = newColor;
                    newFibProps.levels = newFibProps.levels.map(l => ({ ...l, color: newColor, lineOpacity: alpha }));
                }
                updates.fibProps = newFibProps;
            } else if (
                (FIB_TOOLS_ONE_COLOR as readonly string[]).includes(current.type) && current.fibProps
            ) {
                updates.fibProps = {
                    ...current.fibProps,
                    useOneColor: true,
                    oneColor: newColor,
                };
            } else if (current.type === "regression_trend" && current.regressionProps) {
                const newRegProps = { ...current.regressionProps };
                newRegProps.baseColor = newColor;
                newRegProps.upColor = newColor;
                newRegProps.downColor = newColor;
                updates.style = { ...current.style, color: newColor, lineOpacity: alpha };
                updates.regressionProps = newRegProps;
            } else if (current.type === "fib_speed_resistance_fan" && current.fibProps?.fanProps) {
                updates.fibProps = {
                    ...current.fibProps,
                    fanProps: { ...current.fibProps.fanProps, useOneColor: true, oneColor: newColor }
                };
            } else if (
                ((PITCHFORK_TOOLS as readonly string[]).includes(current.type) || current.type === "pitchfan") &&
                (current.pitchforkProps || current.pitchfanProps)
            ) {
                const isPitchfan = current.type === "pitchfan";
                const newProps = isPitchfan ? { ...current.pitchfanProps! } : { ...current.pitchforkProps! };
                newProps.useOneColor = true;
                newProps.oneColor = newColor;
                newProps.levels = (newProps.levels as Array<{ t: number; color: string; lineWidth: number; lineStyle: "solid" | "dashed" | "dotted"; lineOpacity: number; enabled: boolean;[key: string]: unknown }>).map((l) => ({
                    ...l,
                    color: newColor,
                    lineOpacity: alpha
                }));
                if (isPitchfan) {
                    updates.pitchfanProps = newProps as typeof current.pitchfanProps;
                } else {
                    updates.pitchforkProps = newProps as typeof current.pitchforkProps;
                }
            } else if (
                current.type === "trend_based_fib_time" && current.trendBasedFibTimeProps
            ) {
                const newProps = { ...current.trendBasedFibTimeProps };
                newProps.trendLine = { ...newProps.trendLine, color: newColor };
                newProps.extensionLine = { ...newProps.extensionLine, color: newColor };
                newProps.levels = newProps.levels.map((l) => ({ ...l, color: newColor }));
                updates.trendBasedFibTimeProps = newProps;
            } else if (
                (POSITION_TOOLS as readonly string[]).includes(current.type) && current.positionProps
            ) {
                updates.style = { ...current.style, color: newColor, lineOpacity: alpha };
            } else if (current.type === "fib_circles" && current.fibCirclesProps) {
                updates.fibCirclesProps = {
                    ...current.fibCirclesProps,
                    useOneColor: true,
                    oneColor: newColor,
                };
            } else if (current.type === "fib_spiral" && current.fibSpiralProps) {
                updates.fibSpiralProps = {
                    ...current.fibSpiralProps,
                    useOneColor: true,
                    oneColor: newColor,
                    trendLine: { ...current.fibSpiralProps.trendLine, color: newColor, lineOpacity: alpha },
                    levels: current.fibSpiralProps.levels.map(l => ({ ...l, color: newColor, lineOpacity: alpha }))
                };
            } else if (current.type === "fib_speed_resistance_arcs" && current.fibSpeedResistanceArcsProps) {
                const newProps = { ...current.fibSpeedResistanceArcsProps };
                newProps.trendLine = { ...newProps.trendLine, color: newColor, lineOpacity: alpha };
                newProps.levels = newProps.levels.map((l) => ({ ...l, color: newColor, lineOpacity: alpha }));
                updates.fibSpeedResistanceArcsProps = newProps;
            } else if (current.type === "fib_wedge" && current.fibWedgeProps) {
                const newProps = { ...current.fibWedgeProps };
                if (newProps.trendLine) newProps.trendLine = { ...newProps.trendLine, color: newColor, lineOpacity: alpha };
                newProps.levels = newProps.levels.map(l => ({ ...l, color: newColor, lineOpacity: alpha }));
                updates.fibWedgeProps = newProps;
                updates.style = { ...current.style, fillColor: newColor, fillOpacity: alpha };
            } else if (current.type === "gann_box" && current.gannBoxProps) {
                const newProps = { ...current.gannBoxProps };
                newProps.useOneColor = true;
                newProps.oneColor = newColor;
                newProps.priceLevels = newProps.priceLevels.map(l => ({ ...l, color: newColor, lineOpacity: alpha }));
                newProps.timeLevels = newProps.timeLevels.map(l => ({ ...l, color: newColor, lineOpacity: alpha }));
                updates.gannBoxProps = newProps;
                updates.textColor = newColor;
            } else if (current.type === "gann_square_fixed" && current.gannSquareFixedProps) {
                const newProps = { ...current.gannSquareFixedProps };
                newProps.levels = newProps.levels.map(l => ({ ...l, color: newColor, lineOpacity: alpha }));
                newProps.fans = newProps.fans.map(f => ({ ...f, color: newColor, lineOpacity: alpha }));
                newProps.arcs = newProps.arcs.map(a => ({ ...a, color: newColor, lineOpacity: alpha }));
                newProps.background = { ...newProps.background, color: newColor };
                updates.gannSquareFixedProps = newProps;
                updates.textColor = newColor;
            } else if (current.type === "gann_square" && current.gannSquareProps) {
                const newProps = { ...current.gannSquareProps };
                newProps.useOneColor = true;
                newProps.oneColor = newColor;
                newProps.levels = newProps.levels.map(l => ({ ...l, color: newColor, lineOpacity: alpha }));
                newProps.fans = newProps.fans.map(f => ({ ...f, color: newColor, lineOpacity: alpha }));
                newProps.arcs = newProps.arcs.map(a => ({ ...a, color: newColor, lineOpacity: alpha }));
                updates.gannSquareProps = newProps;
                updates.style = { ...current.style, color: newColor, lineOpacity: alpha };
            } else if (current.type === "gann_fan" && current.gannFanProps) {
                const newProps = { ...current.gannFanProps };
                newProps.lines = newProps.lines.map(l => ({ ...l, color: newColor, lineOpacity: alpha }));
                updates.gannFanProps = newProps;
                updates.style = { ...current.style, color: newColor, lineOpacity: alpha };
            }

            updateDrawing(selectedDrawingId, updates);
        }
        if (shouldClose) setActiveToolbarPopup(null);
    }, [drawings, selectedDrawingId, updateDrawing, setActiveToolbarPopup]);

    // =========================================================================
    // handleFillChange — Updates the fill color/opacity for any tool
    // =========================================================================
    const handleFillChange = useCallback((
        newColor: string,
        alpha: number = 0.2,
        shouldClose = false,
        target: "tp" | "sl" | "both" = "both",
    ) => {
        if (!selectedDrawingId) return;
        const current = drawings.find((d) => d.id === selectedDrawingId);
        if (!current) return;

        const updates: Partial<Drawing> = {
            style: {
                ...current.style,
                fillColor: target === "both" ? newColor : current.style.fillColor,
                fillOpacity: target === "both" ? alpha : current.style.fillOpacity,
                fillEnabled: true,
            },
        };

        if ((POSITION_TOOLS as readonly string[]).includes(current.type)) {
            const pProps = (
                current.positionProps ? { ...current.positionProps } : {}
            ) as NonNullable<Drawing["positionProps"]>;
            if (target === "tp" || target === "both") {
                pProps.tpColor = newColor;
                pProps.tpOpacity = alpha;
            }
            if (target === "sl" || target === "both") {
                pProps.slColor = newColor;
                pProps.slOpacity = alpha;
            }
            updates.positionProps = pProps;
            if (!current.textColor) updates.textColor = "#ffffff";
        } else if (current.type === "time_cycles" && current.cyclesProps) {
            const newProps = { ...current.cyclesProps };
            newProps.fillOpacity = alpha;
            if (target === "both") {
                newProps.fillBackground = alpha > 0;
                newProps.levels = newProps.levels ? newProps.levels.map(l => ({ ...l })) : [];
                if (newProps.levels && newProps.levels.length > 0) {
                    newProps.levels[0].color = newColor;
                }
            }
            updates.cyclesProps = newProps;
        } else if (current.type === "regression_trend" && current.regressionProps) {
            const newRegProps = { ...current.regressionProps };
            newRegProps.upFillColor = newColor;
            newRegProps.downFillColor = newColor;
            updates.regressionProps = newRegProps;
        } else if (
            ((PITCHFORK_TOOLS as readonly string[]).includes(current.type) || current.type === "pitchfan") &&
            (current.pitchforkProps || current.pitchfanProps)
        ) {
            const isPitchfan = current.type === "pitchfan";
            const newProps = isPitchfan ? { ...current.pitchfanProps } : { ...current.pitchforkProps };
            newProps.fillBackground = true;
            newProps.fillOpacity = alpha;
            newProps.levels = (newProps.levels as Array<{ t: number; color: string; lineWidth: number; lineStyle: "solid" | "dashed" | "dotted"; lineOpacity: number; enabled: boolean; fillOpacity?: number; fillColor?: string;[key: string]: unknown }>).map((l) => ({
                ...l,
                fillOpacity: alpha,
                fillColor: target === "both" ? newColor : l.fillColor,
            }));
            if (isPitchfan) {
                updates.pitchfanProps = newProps as typeof current.pitchfanProps;
            } else {
                updates.pitchforkProps = newProps as typeof current.pitchforkProps;
            }
        } else if (
            (FIB_PURE_TOOLS as readonly string[]).includes(current.type) && current.fibProps
        ) {
            const newFibProps = { ...current.fibProps };
            newFibProps.fillOpacity = alpha;
            if (target === "both") {
                newFibProps.oneColor = newColor;
                newFibProps.useOneColor = true;
            }
            updates.fibProps = newFibProps;
        } else if (current.type === "fib_circles" && current.fibCirclesProps) {
            updates.fibCirclesProps = {
                ...current.fibCirclesProps,
                background: {
                    ...current.fibCirclesProps.background,
                    fillOpacity: alpha
                },
            };
            if (target === "both") {
                updates.fibCirclesProps.oneColor = newColor;
                updates.fibCirclesProps.useOneColor = true;
            }
        } else if (current.type === "fib_speed_resistance_arcs" && current.fibSpeedResistanceArcsProps) {
            updates.fibSpeedResistanceArcsProps = {
                ...current.fibSpeedResistanceArcsProps,
                background: {
                    ...current.fibSpeedResistanceArcsProps.background,
                    fillOpacity: alpha
                },
            };
        } else if (current.type === "fib_wedge" && current.fibWedgeProps) {
            const newWedgeProps = { ...current.fibWedgeProps };
            if (newWedgeProps.background) {
                newWedgeProps.background.fillOpacity = alpha;
                if (target === "both") {
                    newWedgeProps.levels = (newWedgeProps.levels as Array<{ value: number; color: string; enabled: boolean; lineOpacity: number; fillOpacity: number; lineStyle: "solid" | "dashed" | "dotted"; lineWidth: number; fillColor?: string;[key: string]: unknown }>).map(l => ({ ...l, color: newColor }));
                }
            }
            updates.fibWedgeProps = newWedgeProps;
            updates.style = { ...current.style, fillColor: newColor, fillOpacity: alpha };
        } else if (current.type === "gann_box" && current.gannBoxProps) {
            const newProps = { ...current.gannBoxProps };
            if (newProps.priceBackground) newProps.priceBackground = { ...newProps.priceBackground, fillOpacity: alpha };
            if (newProps.timeBackground) newProps.timeBackground = { ...newProps.timeBackground, fillOpacity: alpha };
            updates.gannBoxProps = newProps;
        } else if (current.type === "gann_square_fixed" && current.gannSquareFixedProps) {
            const newProps = { ...current.gannSquareFixedProps };
            newProps.background = { ...newProps.background, opacity: alpha };
            if (target === "both") {
                newProps.background.color = newColor;
                newProps.background.enabled = true;
            }
            updates.gannSquareFixedProps = newProps;
        } else if (current.type === "gann_square" && current.gannSquareProps) {
            const newProps = { ...current.gannSquareProps };
            newProps.fillOpacity = alpha;
            if (target === "both") {
                newProps.color = newColor;
                newProps.fillBackground = true;
                newProps.mosaicFill = false;
            }
            updates.gannSquareProps = newProps;
            updates.style = { ...current.style, fillColor: newColor, fillOpacity: alpha, fillEnabled: true };
        } else if (current.type === "gann_fan" && current.gannFanProps) {
            const newProps = { ...current.gannFanProps };
            if (target === "both") {
                newProps.lines = newProps.lines.map(l => ({ ...l, fillColor: newColor, fillOpacity: alpha }));
                newProps.fillBackground = true;
                updates.style = { ...current.style, fillColor: newColor, fillOpacity: alpha, fillEnabled: true };
            } else {
                newProps.lines = newProps.lines.map(l => ({ ...l, fillOpacity: alpha }));
            }
            updates.gannFanProps = newProps;
        }

        updateDrawing(selectedDrawingId, updates);
        if (shouldClose) setActiveToolbarPopup(null);
    }, [drawings, selectedDrawingId, updateDrawing, setActiveToolbarPopup]);

    // =========================================================================
    // handleLineStyleChange — Updates lineWidth / lineStyle for any tool
    // =========================================================================
    const handleLineStyleChange = useCallback((updates: Partial<DrawingStyle>) => {
        if (!selectedDrawingId) return;
        const current = drawings.find((d) => d.id === selectedDrawingId);
        if (current) {
            if (current.type === "regression_trend" && current.regressionProps) {
                const newProps = { ...current.regressionProps };
                if (updates.lineWidth) {
                    newProps.baseLineWidth = updates.lineWidth;
                    newProps.upLineWidth = updates.lineWidth;
                    newProps.downLineWidth = updates.lineWidth;
                }
                if (updates.lineStyle) {
                    newProps.upLineStyle = updates.lineStyle;
                    newProps.downLineStyle = updates.lineStyle;
                }
                updateDrawing(selectedDrawingId, {
                    regressionProps: newProps,
                    style: { ...current.style, ...updates },
                });
            } else if (
                ((PITCHFORK_TOOLS as readonly string[]).includes(current.type) || current.type === "pitchfan") &&
                (current.pitchforkProps || current.pitchfanProps)
            ) {
                const isPitchfan = current.type === "pitchfan";
                const newProps = isPitchfan ? { ...current.pitchfanProps } : { ...current.pitchforkProps };
                if (updates.lineWidth) {
                    const w = updates.lineWidth;
                    newProps.levels = (newProps.levels as Array<{ t: number; color: string; lineWidth: number; lineStyle: "solid" | "dashed" | "dotted"; lineOpacity: number; enabled: boolean;[key: string]: unknown }>).map((l) => ({
                        ...l, lineWidth: w,
                    }));
                }
                if (updates.lineStyle) {
                    const ls = updates.lineStyle;
                    newProps.levels = (newProps.levels as Array<{ t: number; color: string; lineWidth: number; lineStyle: "solid" | "dashed" | "dotted"; lineOpacity: number; enabled: boolean;[key: string]: unknown }>).map((l) => {
                        // [TENOR 2026] Protect median line (value 0 or t=0.5) from global style override
                        if (l.value === 0 || l.t === 0.5) return l;
                        return { ...l, lineStyle: ls };
                    });
                }
                const drawingUpdates: Partial<Pick<Drawing, 'style' | 'pitchfanProps' | 'pitchforkProps'>> = {
                    style: { ...current.style, ...updates },
                };
                if (isPitchfan) {
                    drawingUpdates.pitchfanProps = newProps as typeof current.pitchfanProps;
                } else {
                    drawingUpdates.pitchforkProps = newProps as typeof current.pitchforkProps;
                }
                updateDrawing(selectedDrawingId, drawingUpdates);
            } else if (
                (current.type === "fib_retracement" || current.type === "trend_based_fib_extension" || current.type === "fib_channel" || current.type === "fib_time_zone" || current.type === "fib_speed_resistance_fan") &&
                current.fibProps
            ) {
                const newProps = { ...current.fibProps };
                if (updates.lineWidth) {
                    newProps.trendLine = {
                        ...(newProps.trendLine || { enabled: true, color: "#787b86", lineStyle: "dashed", lineWidth: 1, }),
                        lineWidth: updates.lineWidth,
                    } as NonNullable<Drawing["fibProps"]>["trendLine"];
                    newProps.levels = newProps.levels.map((l) => ({ ...l, lineWidth: updates.lineWidth! }));
                }
                if (updates.lineStyle) {
                    newProps.levels = newProps.levels.map((l) => ({ ...l, lineStyle: updates.lineStyle! }));
                }
                if (current.type === "fib_speed_resistance_fan" && newProps.fanProps) {
                    if (updates.lineStyle) {
                        newProps.fanProps = { ...newProps.fanProps, gridStyle: updates.lineStyle as DrawingStyle['lineStyle'] };
                    }
                }
                updateDrawing(selectedDrawingId, { fibProps: newProps, style: { ...current.style, ...updates } });
            } else if (current.type === "trend_based_fib_time" && current.trendBasedFibTimeProps) {
                const newProps = { ...current.trendBasedFibTimeProps };
                if (updates.lineWidth) {
                    const w = updates.lineWidth;
                    newProps.trendLine = { ...newProps.trendLine, lineWidth: w };
                    newProps.extensionLine = { ...newProps.extensionLine, lineWidth: w };
                    newProps.levels = newProps.levels.map((l) => ({ ...l, lineWidth: w }));
                }
                if (updates.lineStyle) {
                    const ls = updates.lineStyle;
                    newProps.trendLine = { ...newProps.trendLine, lineStyle: ls };
                    newProps.extensionLine = { ...newProps.extensionLine, lineStyle: ls };
                    newProps.levels = newProps.levels.map((l) => ({ ...l, lineStyle: ls }));
                }
                updateDrawing(selectedDrawingId, { trendBasedFibTimeProps: newProps, style: { ...current.style, ...updates } });
            } else if (current.type === "fib_speed_resistance_arcs" && current.fibSpeedResistanceArcsProps) {
                const newProps = { ...current.fibSpeedResistanceArcsProps };
                if (updates.lineWidth) {
                    const w = updates.lineWidth;
                    newProps.trendLine = { ...newProps.trendLine, lineWidth: w };
                    newProps.levels = newProps.levels.map((l) => ({ ...l, lineWidth: w }));
                }
                if (updates.lineStyle) {
                    const ls = updates.lineStyle;
                    newProps.trendLine = { ...newProps.trendLine, lineStyle: ls };
                    newProps.levels = newProps.levels.map((l) => ({ ...l, lineStyle: ls }));
                }
                updateDrawing(selectedDrawingId, { fibSpeedResistanceArcsProps: newProps, style: { ...current.style, ...updates } });
            } else if (current.type === "fib_circles" && current.fibCirclesProps) {
                const newProps = { ...current.fibCirclesProps };
                if (updates.lineWidth) {
                    const w = updates.lineWidth;
                    newProps.trendLine = { ...newProps.trendLine, lineWidth: w };
                    newProps.levels = newProps.levels.map((l) => ({ ...l, lineWidth: w }));
                }
                if (updates.lineStyle) {
                    newProps.levels = newProps.levels.map((l) => ({ ...l, lineStyle: updates.lineStyle! }));
                }
                updateDrawing(selectedDrawingId, { fibCirclesProps: newProps, style: { ...current.style, ...updates } });
            } else if (current.id === selectedDrawingId && current.type === "fib_spiral" && current.fibSpiralProps) {
                const newProps = { ...current.fibSpiralProps };
                if (updates.lineWidth) {
                    const w = updates.lineWidth;
                    newProps.trendLine = { ...newProps.trendLine, lineWidth: w };
                    newProps.levels = newProps.levels.map((l) => ({ ...l, lineWidth: w }));
                }
                if (updates.lineStyle) {
                    const ls = updates.lineStyle as DrawingStyle['lineStyle'];
                    newProps.levels = newProps.levels.map((l) => ({ ...l, lineStyle: ls }));
                }
                updateDrawing(selectedDrawingId, { fibSpiralProps: newProps, style: { ...current.style, ...updates } });
            } else if (current.type === "fib_wedge" && current.fibWedgeProps) {
                const newProps = { ...current.fibWedgeProps };
                if (updates.lineWidth) {
                    const w = updates.lineWidth;
                    if (newProps.trendLine) newProps.trendLine = { ...newProps.trendLine, lineWidth: w };
                    newProps.levels = newProps.levels.map((l) => ({ ...l, lineWidth: w }));
                }
                if (updates.lineStyle) {
                    const ls = updates.lineStyle;
                    if (newProps.trendLine) newProps.trendLine = { ...newProps.trendLine, lineStyle: ls };
                    newProps.levels = newProps.levels.map((l) => ({ ...l, lineStyle: ls }));
                }
                updateDrawing(selectedDrawingId, { fibWedgeProps: newProps, style: { ...current.style, ...updates } });
            } else if (current.type === "gann_box" && current.gannBoxProps) {
                const newProps = { ...current.gannBoxProps };
                if (updates.lineWidth) {
                    newProps.priceLevels = newProps.priceLevels.map(l => ({ ...l, lineWidth: updates.lineWidth! }));
                    newProps.timeLevels = newProps.timeLevels.map(l => ({ ...l, lineWidth: updates.lineWidth! }));
                }
                if (updates.lineStyle) {
                    newProps.priceLevels = newProps.priceLevels.map(l => ({ ...l, lineStyle: updates.lineStyle! }));
                    newProps.timeLevels = newProps.timeLevels.map(l => ({ ...l, lineStyle: updates.lineStyle! }));
                }
                updateDrawing(selectedDrawingId, { gannBoxProps: newProps, style: { ...current.style, ...updates } });
            } else if (current.type === "gann_square_fixed" && current.gannSquareFixedProps) {
                const newProps = { ...current.gannSquareFixedProps };
                if (updates.lineWidth) {
                    newProps.levels = newProps.levels.map(l => ({ ...l, lineWidth: updates.lineWidth! }));
                    newProps.fans = newProps.fans.map(f => ({ ...f, lineWidth: updates.lineWidth! }));
                    newProps.arcs = newProps.arcs.map(a => ({ ...a, lineWidth: updates.lineWidth! }));
                }
                if (updates.lineStyle) {
                    newProps.levels = newProps.levels.map(l => ({ ...l, lineStyle: updates.lineStyle! }));
                    newProps.fans = newProps.fans.map(f => ({ ...f, lineStyle: updates.lineStyle! }));
                    newProps.arcs = newProps.arcs.map(a => ({ ...a, lineStyle: updates.lineStyle! }));
                }
                updateDrawing(selectedDrawingId, { gannSquareFixedProps: newProps, style: { ...current.style, ...updates } });
            } else if (current.type === "gann_square" && current.gannSquareProps) {
                const newProps = { ...current.gannSquareProps };
                if (updates.lineWidth) {
                    const w = updates.lineWidth;
                    newProps.levels = newProps.levels.map(l => ({ ...l, lineWidth: w }));
                    newProps.fans = newProps.fans.map(f => ({ ...f, lineWidth: w }));
                    newProps.arcs = newProps.arcs.map(a => ({ ...a, lineWidth: w }));
                }
                if (updates.lineStyle) {
                    const ls = updates.lineStyle;
                    newProps.levels = newProps.levels.map(l => ({ ...l, lineStyle: ls }));
                    newProps.fans = newProps.fans.map(f => ({ ...f, lineStyle: ls }));
                    newProps.arcs = newProps.arcs.map(a => ({ ...a, lineStyle: ls }));
                }
                updateDrawing(selectedDrawingId, { gannSquareProps: newProps, style: { ...current.style, ...updates } });
            } else if (current.type === "gann_fan" && current.gannFanProps) {
                const newProps = { ...current.gannFanProps };
                if (updates.lineWidth) {
                    const w = updates.lineWidth;
                    newProps.lines = newProps.lines.map(l => ({ ...l, lineWidth: w }));
                }
                if (updates.lineStyle) {
                    const ls = updates.lineStyle;
                    newProps.lines = newProps.lines.map(l => ({ ...l, lineStyle: ls }));
                }
                updateDrawing(selectedDrawingId, { gannFanProps: newProps, style: { ...current.style, ...updates } });
            } else if (current.type === "position_forecast" && current.forecastProps) {
                // [TENOR 2026] Sync style to both generic style (for renderer cursor) and specific props
                updateDrawing(selectedDrawingId, { 
                    style: { ...current.style, ...updates } 
                });
            } else {
                // Standard handling for all other tools (lines, rays, channels, etc.)
                updateDrawing(selectedDrawingId, { style: { ...current.style, ...updates } });
            }
        }
    }, [drawings, selectedDrawingId, updateDrawing]);

    const handleTextColorChange = useCallback((
        newColor: string,
        _alpha: number = 1,
        shouldClose = false,
    ) => {
        if (!selectedDrawingId) return;
        updateDrawing(selectedDrawingId, { textColor: newColor });
        if (shouldClose) setActiveToolbarPopup(null);
    }, [selectedDrawingId, updateDrawing, setActiveToolbarPopup]);

    return { handleColorChange, handleFillChange, handleLineStyleChange, handleTextColorChange };
};
