import React from "react";
import { SettingsToggle } from "../common/SettingsField";
import { Drawing } from "../../config/TechnicalAnalysisTypes";

interface QuickOptionsPopupProps {
    dr: Drawing;
    updateDrawing: (id: string, updates: Partial<Drawing>) => void;
}

export const QuickOptionsPopup: React.FC<QuickOptionsPopupProps> = ({
    dr,
    updateDrawing,
}) => {
    const drType = dr.type;

    return (
        <div style={{ minWidth: "180px", color: "#131722" }}>
            <div
                style={{
                    fontSize: "10px",
                    color: "#787b86",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    marginBottom: "8px",
                    paddingBottom: "4px",
                    borderBottom: "1px solid #e0e3eb",
                    letterSpacing: "0.5px"
                }}
            >
                Modèles
            </div>
            {drType === "gann_square" && dr.gannSquareProps && (
                <>
                    <SettingsToggle label="Inverser" theme="light" checked={dr.gannSquareProps.reverse} onChange={(val) => updateDrawing(dr.id, { gannSquareProps: { ...dr.gannSquareProps!, reverse: val } })} />
                    <SettingsToggle label="Angles" theme="light" checked={dr.gannSquareProps.showAngles} onChange={(val) => updateDrawing(dr.id, { gannSquareProps: { ...dr.gannSquareProps!, showAngles: val } })} />
                    <SettingsToggle label="Fans" theme="light" checked={dr.gannSquareProps.showFans} onChange={(val) => updateDrawing(dr.id, { gannSquareProps: { ...dr.gannSquareProps!, showFans: val } })} />
                    <SettingsToggle label="Grille" theme="light" checked={dr.gannSquareProps.showGrid} onChange={(val) => updateDrawing(dr.id, { gannSquareProps: { ...dr.gannSquareProps!, showGrid: val } })} />
                    <SettingsToggle label="Arcs" theme="light" checked={dr.gannSquareProps.showArcs} onChange={(val) => updateDrawing(dr.id, { gannSquareProps: { ...dr.gannSquareProps!, showArcs: val } })} />
                    <SettingsToggle label="Étiquettes" theme="light" checked={dr.gannSquareProps.showLabels} onChange={(val) => updateDrawing(dr.id, { gannSquareProps: { ...dr.gannSquareProps!, showLabels: val } })} />
                    <SettingsToggle label="Mosaïque" theme="light" checked={dr.gannSquareProps.mosaicFill} onChange={(val) => updateDrawing(dr.id, { gannSquareProps: { ...dr.gannSquareProps!, mosaicFill: val } })} />
                </>
            )}
            {drType === "gann_square_fixed" && dr.gannSquareFixedProps && (
                <>
                    <SettingsToggle label="Fans" theme="light" checked={dr.gannSquareFixedProps.showFans} onChange={(val) => updateDrawing(dr.id, { gannSquareFixedProps: { ...dr.gannSquareFixedProps!, showFans: val } })} />
                    <SettingsToggle label="Grille" theme="light" checked={dr.gannSquareFixedProps.showGrid} onChange={(val) => updateDrawing(dr.id, { gannSquareFixedProps: { ...dr.gannSquareFixedProps!, showGrid: val } })} />
                    <SettingsToggle label="Arcs" theme="light" checked={dr.gannSquareFixedProps.showArcs} onChange={(val) => updateDrawing(dr.id, { gannSquareFixedProps: { ...dr.gannSquareFixedProps!, showArcs: val } })} />
                    <SettingsToggle label="Étiquettes" theme="light" checked={dr.gannSquareFixedProps.showLabels} onChange={(val) => updateDrawing(dr.id, { gannSquareFixedProps: { ...dr.gannSquareFixedProps!, showLabels: val } })} />
                </>
            )}
            {drType === "gann_box" && dr.gannBoxProps && (
                <>
                    <SettingsToggle label="Inverser" theme="light" checked={dr.gannBoxProps.reverse} onChange={(val) => updateDrawing(dr.id, { gannBoxProps: { ...dr.gannBoxProps!, reverse: val } })} />
                    <SettingsToggle label="Angles" theme="light" checked={dr.gannBoxProps.showAngles || false} onChange={(val) => updateDrawing(dr.id, { gannBoxProps: { ...dr.gannBoxProps!, showAngles: val } })} />
                    <div style={{ marginTop: "8px", marginBottom: "4px", fontSize: "10px", color: "#787b86", fontWeight: 700, textTransform: "uppercase" }}>Arrière-plan</div>
                    <SettingsToggle label="Fond Prix" theme="light" checked={dr.gannBoxProps.priceBackground?.enabled || false} onChange={(val) => updateDrawing(dr.id, { gannBoxProps: { ...dr.gannBoxProps!, priceBackground: { ...dr.gannBoxProps!.priceBackground!, enabled: val } } })} />
                    <SettingsToggle label="Fond Temps" theme="light" checked={dr.gannBoxProps.timeBackground?.enabled || false} onChange={(val) => updateDrawing(dr.id, { gannBoxProps: { ...dr.gannBoxProps!, timeBackground: { ...dr.gannBoxProps!.timeBackground!, enabled: val } } })} />
                    <div style={{ marginTop: "8px", marginBottom: "4px", fontSize: "10px", color: "#787b86", fontWeight: 700, textTransform: "uppercase" }}>Étiquettes</div>
                    <SettingsToggle label="Gauche" theme="light" checked={dr.gannBoxProps.showLabels?.left || false} onChange={(val) => updateDrawing(dr.id, { gannBoxProps: { ...dr.gannBoxProps!, showLabels: { ...dr.gannBoxProps!.showLabels, left: val } } })} />
                    <SettingsToggle label="Haut" theme="light" checked={dr.gannBoxProps.showLabels?.top || false} onChange={(val) => updateDrawing(dr.id, { gannBoxProps: { ...dr.gannBoxProps!, showLabels: { ...dr.gannBoxProps!.showLabels, top: val } } })} />
                </>
            )}
            {drType === "anchored_volume_profile" && dr.anchoredVolumeProfileProps && (
                <>
                    <SettingsToggle label="Étendre à gauche" theme="light" checked={dr.anchoredVolumeProfileProps.extendLeft || false} onChange={(val) => updateDrawing(dr.id, { anchoredVolumeProfileProps: { ...dr.anchoredVolumeProfileProps!, extendLeft: val } })} />
                    <SettingsToggle label="Étendre à droite" theme="light" checked={dr.anchoredVolumeProfileProps.extendRight || false} onChange={(val) => updateDrawing(dr.id, { anchoredVolumeProfileProps: { ...dr.anchoredVolumeProfileProps!, extendRight: val } })} />
                    <div style={{ marginTop: "8px", marginBottom: "4px", fontSize: "10px", color: "#787b86", fontWeight: 700, textTransform: "uppercase" }}>Affichage</div>
                    <SettingsToggle label="Afficher POC" theme="light" checked={dr.anchoredVolumeProfileProps.showPOC !== false} onChange={(val) => updateDrawing(dr.id, { anchoredVolumeProfileProps: { ...dr.anchoredVolumeProfileProps!, showPOC: val } })} />
                    <SettingsToggle label="Zone de Valeur" theme="light" checked={dr.anchoredVolumeProfileProps.showValueArea !== false} onChange={(val) => updateDrawing(dr.id, { anchoredVolumeProfileProps: { ...dr.anchoredVolumeProfileProps!, showValueArea: val } })} />
                </>
            )}
            {(drType === "fib_retracement" || drType === "fib_channel" || drType === "trend_based_fib_extension" || drType === "fib_time_zone" || drType === "fib_speed_resistance_fan") && dr.fibProps && (
                <>
                    <SettingsToggle label="Inverser" theme="light" checked={dr.fibProps.reverse} onChange={(val) => updateDrawing(dr.id, { fibProps: { ...dr.fibProps!, reverse: val } })} />
                    {drType !== "fib_speed_resistance_fan" && (
                        <>
                            <SettingsToggle label="Étendre Gauche" theme="light" checked={dr.fibProps.extendLines === "left" || dr.fibProps.extendLines === "both"} 
                                            onChange={(val) => {
                                                const cur = dr.fibProps!.extendLines;
                                                const next = val ? (cur === "right" || cur === "both" ? "both" : "left") : (cur === "both" ? "right" : "none");
                                                updateDrawing(dr.id, { fibProps: { ...dr.fibProps!, extendLines: next as "none" | "left" | "right" | "both" } });
                                            }} />
                            <SettingsToggle label="Étendre Droite" theme="light" checked={dr.fibProps.extendLines === "right" || dr.fibProps.extendLines === "both"} 
                                            onChange={(val) => {
                                                const cur = dr.fibProps!.extendLines;
                                                const next = val ? (cur === "left" || cur === "both" ? "both" : "right") : (cur === "both" ? "left" : "none");
                                                updateDrawing(dr.id, { fibProps: { ...dr.fibProps!, extendLines: next as "none" | "left" | "right" | "both" } });
                                            }} />
                        </>
                    )}
                    <SettingsToggle label="Niveaux" theme="light" checked={dr.fibProps.showLevels} onChange={(val) => updateDrawing(dr.id, { fibProps: { ...dr.fibProps!, showLevels: val } })} />
                    <SettingsToggle label="Prix" theme="light" checked={dr.fibProps.showPrices} onChange={(val) => updateDrawing(dr.id, { fibProps: { ...dr.fibProps!, showPrices: val } })} />
                </>
            )}
            {drType === "fib_speed_resistance_arcs" && dr.fibSpeedResistanceArcsProps && (
                <>
                    <SettingsToggle label="Niveaux" theme="light" checked={true} disabled onChange={() => {}} />
                    <SettingsToggle label="Cercle Plein" theme="light" checked={dr.fibSpeedResistanceArcsProps.fullCircles || false} onChange={(val) => updateDrawing(dr.id, { fibSpeedResistanceArcsProps: { ...dr.fibSpeedResistanceArcsProps!, fullCircles: val } })} />
                    <SettingsToggle label="Fond" theme="light" checked={dr.fibSpeedResistanceArcsProps.background.enabled} onChange={(val) => updateDrawing(dr.id, { fibSpeedResistanceArcsProps: { ...dr.fibSpeedResistanceArcsProps!, background: { ...dr.fibSpeedResistanceArcsProps!.background, enabled: val } } })} />
                    <SettingsToggle label="Étiquettes" theme="light" checked={dr.fibSpeedResistanceArcsProps.showLabels} onChange={(val) => updateDrawing(dr.id, { fibSpeedResistanceArcsProps: { ...dr.fibSpeedResistanceArcsProps!, showLabels: val } })} />
                </>
            )}
            {drType === "fib_circles" && dr.fibCirclesProps && (
                <>
                    <SettingsToggle label="Fond" theme="light" checked={dr.fibCirclesProps.background.enabled} onChange={(val) => updateDrawing(dr.id, { fibCirclesProps: { ...dr.fibCirclesProps!, background: { ...dr.fibCirclesProps!.background, enabled: val } } })} />
                    <SettingsToggle label="Étiquettes" theme="light" checked={dr.fibCirclesProps.showLabels} onChange={(val) => updateDrawing(dr.id, { fibCirclesProps: { ...dr.fibCirclesProps!, showLabels: val } })} />
                </>
            )}
            {drType === "fib_spiral" && dr.fibSpiralProps && (
                <>
                    <SettingsToggle label="Inverser" theme="light" checked={dr.fibSpiralProps.reverse} onChange={(val) => updateDrawing(dr.id, { fibSpiralProps: { ...dr.fibSpiralProps!, reverse: val } })} />
                    <SettingsToggle label="Sens Inverse" theme="light" checked={dr.fibSpiralProps.counterclockwise || false} onChange={(val) => updateDrawing(dr.id, { fibSpiralProps: { ...dr.fibSpiralProps!, counterclockwise: val } })} />
                    <SettingsToggle label="Fond" theme="light" checked={dr.fibSpiralProps.background?.enabled || false} onChange={(val) => updateDrawing(dr.id, { fibSpiralProps: { ...dr.fibSpiralProps!, background: { ...dr.fibSpiralProps!.background!, enabled: val } } })} />
                </>
            )}
            {drType === "fib_wedge" && dr.fibWedgeProps && (
                <>
                    <SettingsToggle label="Fond" theme="light" checked={dr.fibWedgeProps.background.enabled} onChange={(val) => updateDrawing(dr.id, { fibWedgeProps: { ...dr.fibWedgeProps!, background: { ...dr.fibWedgeProps!.background, enabled: val } } })} />
                    <SettingsToggle label="Étiquettes" theme="light" checked={dr.fibWedgeProps.showLabels} onChange={(val) => updateDrawing(dr.id, { fibWedgeProps: { ...dr.fibWedgeProps!, showLabels: val } })} />
                </>
            )}
            {drType === "trend_based_fib_time" && dr.trendBasedFibTimeProps && (
                <>
                    <SettingsToggle label="Fond" theme="light" checked={dr.trendBasedFibTimeProps.fillBackground} onChange={(val) => updateDrawing(dr.id, { trendBasedFibTimeProps: { ...dr.trendBasedFibTimeProps!, fillBackground: val } })} />
                    <SettingsToggle label="Niveaux" theme="light" checked={dr.trendBasedFibTimeProps.showLevels} onChange={(val) => updateDrawing(dr.id, { trendBasedFibTimeProps: { ...dr.trendBasedFibTimeProps!, showLevels: val } })} />
                </>
            )}
            {drType === "pitchfan" && dr.pitchfanProps && (
                <>
                    <SettingsToggle label="Fond" theme="light" checked={dr.pitchfanProps.fillBackground} onChange={(val) => updateDrawing(dr.id, { pitchfanProps: { ...dr.pitchfanProps!, fillBackground: val } })} />
                    <SettingsToggle label="Lignes" theme="light" checked={true} disabled onChange={() => {}} />
                </>
            )}
        </div>
    );
};
