"use client";

import { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { setModalOpen } from "../store/technicalAnalysisSlice";
import { SavedAnalysis } from "../config/TechnicalAnalysisTypes";
import { useTechnicalAnalysisActions } from "./useTechnicalAnalysisActions";
import { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";
import { useGlobalNotification } from "@/components/design-system/layouts/HeaderHome/context/GlobalNotificationContext";

/**
 * [TENOR 2026 CLEAN] useModalOrchestrator
 * Encapsulates all modal-related state that was previously littered across
 * TechnicalAnalysis.tsx as props passed down to ModalOrchestrator.
 * 
 * Responsibilities:
 *   - Owns `savedAnalysesList` local state (localStorage-backed)
 *   - Exposes `handleDeleteAnalysis` (previously inline in TechnicalAnalysis.tsx)
 *   - Wires `handleLoadAnalysis` from useTechnicalAnalysisActions
 *   - Accepts setChartData as a dependency to propagate simulation resets
 */
export const useModalOrchestrator = (
    setChartData: React.Dispatch<React.SetStateAction<ChartDataPoint[]>>,
) => {
    const dispatch = useDispatch();
    const { addNotification } = useGlobalNotification();
    const [savedAnalysesList, setSavedAnalysesList] = useState<SavedAnalysis[]>([]);

    const { handleLoadAnalysis } = useTechnicalAnalysisActions(setChartData, setSavedAnalysesList);

    const handleDeleteAnalysis = useCallback(
        (id: string, e: React.MouseEvent) => {
            e.stopPropagation();
            const updated = savedAnalysesList.filter((item) => item.id !== id);
            localStorage.setItem("savedAnalyses", JSON.stringify(updated));
            setSavedAnalysesList(updated);
            addNotification({
                title: "Analyse supprimée",
                message: "L'analyse a été retirée de l'historique",
                type: "info",
                iconType: "faTrash",
            });
        },
        [savedAnalysesList, addNotification],
    );

    const openLoadModal = useCallback(() => {
        const saved: SavedAnalysis[] = JSON.parse(localStorage.getItem("savedAnalyses") || "[]");
        saved.sort(
            (a, b) =>
                new Date(b.config.savedAt).getTime() - new Date(a.config.savedAt).getTime(),
        );
        setSavedAnalysesList(saved);
        dispatch(setModalOpen({ modal: "loadAnalysis", isOpen: true }));
    }, [dispatch]);

    return {
        savedAnalysesList,
        handleLoadAnalysis,
        handleDeleteAnalysis,
        openLoadModal,
    };
};
// --- EOF ---
