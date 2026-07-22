"use client";

import { useContext } from "react";
import { TechnicalAnalysisPortalContext } from "./TechnicalAnalysisPortalProvider";

export function useTechnicalAnalysisPortalTarget(): HTMLElement | null {
  return useContext(TechnicalAnalysisPortalContext);
}
