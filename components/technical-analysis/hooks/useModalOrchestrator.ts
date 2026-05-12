"use client";

import { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { setModalOpen } from "../store/technicalAnalysisSlice";
import { SavedAnalysis } from "../config/TechnicalAnalysisTypes";
import { useTechnicalAnalysisActions } from "./useTechnicalAnalysisActions";
import { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";
import { useGlobalNotification } from "@/components/design-system/layouts/HeaderHome/context/GlobalNotificationContext";
import { idbGet, idbSet } from "./useDrawingManager";

/**
 * [TENOR 2026 CLEAN] useModalOrchestrator
 * Encapsulates all modal-related state that was previously littered across
 * TechnicalAnalysis.tsx as props passed down to ModalOrchestrator.
 * 
 * [TENOR 2026 SRE FIX] SCAR-ORCHESTRATOR-DELETE-SYNC
 * Fully migrated to IndexedDB (idbGet, idbSet) to eradicate localStorage limits
 * and ensure absolute data consistency with useTechnicalAnalysisActions.
 * 
 * Responsibilities:
 * - Owns `savedAnalysesList` local state (IndexedDB-backed)
 * - Exposes `handleDeleteAnalysis` (Async DB deletion)
 * - Wires `handleLoadAnalysis` from useTechnicalAnalysisActions
 * - Accepts setChartData as a dependency to propagate simulation resets
 */
export const useModalOrchestrator = (
  setChartData: React.Dispatch<React.SetStateAction<ChartDataPoint[]>>,
) => {
  const dispatch = useDispatch();
  const { addNotification } = useGlobalNotification();
  const [savedAnalysesList, setSavedAnalysesList] = useState<SavedAnalysis[]>([]);
  
  const { handleLoadAnalysis } = useTechnicalAnalysisActions(setChartData, setSavedAnalysesList);

  const handleDeleteAnalysis = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const updated = savedAnalysesList.filter((item) => item.id !== id);
        
        // [TENOR 2026 SRE] Pessimistic UI Update: Await DB confirmation before UI change
        await idbSet("savedAnalyses", updated);
        
        setSavedAnalysesList(updated);
        
        addNotification({
          title: "Analyse supprimée",
          message: "L'analyse a été retirée de l'historique",
          type: "info",
          iconType: "faTrash",
        });
      } catch (error) {
        console.error("[SRE] Error deleting analysis from IndexedDB:", error);
        addNotification({
          title: "Erreur de suppression",
          message: "Impossible de supprimer l'analyse de la base de données.",
          type: "error",
          iconType: "faTimesCircle",
        });
      }
    },
    [savedAnalysesList, addNotification],
  );

  const openLoadModal = useCallback(async () => {
    try {
      // 1. Fetch existing analyses from IndexedDB
      let saved: SavedAnalysis[] = await idbGet<SavedAnalysis[]>("savedAnalyses") || [];

      // 2. Silent Migration Fallback (localStorage -> IndexedDB)
      if (saved.length === 0) {
        const legacy = localStorage.getItem("savedAnalyses");
        if (legacy) {
          try {
            saved = JSON.parse(legacy);
            await idbSet("savedAnalyses", saved); // Persist migrated data
            localStorage.removeItem("savedAnalyses"); // Cleanup legacy
          } catch (e) {
            console.warn("[SRE] Failed to parse legacy savedAnalyses", e);
          }
        }
      }

      // 3. Sort by date descending
      saved.sort(
        (a, b) => new Date(b.config.savedAt).getTime() - new Date(a.config.savedAt).getTime(),
      );
      
      setSavedAnalysesList(saved);
      dispatch(setModalOpen({ modal: "loadAnalysis", isOpen: true }));
    } catch (error) {
      console.error("[SRE] Error loading analyses from IndexedDB:", error);
      addNotification({
        title: "Erreur de chargement",
        message: "Impossible de charger l'historique des analyses.",
        type: "error",
        iconType: "faTimesCircle",
      });
    }
  }, [dispatch, addNotification]);

  return {
    savedAnalysesList,
    handleLoadAnalysis,
    handleDeleteAnalysis,
    openLoadModal,
  };
};
// --- EOF ---