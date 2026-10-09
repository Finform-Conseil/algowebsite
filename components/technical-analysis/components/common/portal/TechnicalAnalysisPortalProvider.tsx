"use client";

import React, { createContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";

export const TechnicalAnalysisPortalContext = createContext<HTMLElement | null>(null);

const PORTAL_ROOT_ID = "technical-analysis-portal-root";

interface TechnicalAnalysisPortalProviderProps {
  children: React.ReactNode;
}

export const TechnicalAnalysisPortalProvider: React.FC<TechnicalAnalysisPortalProviderProps> = ({ children }) => {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;

    let el = document.getElementById(PORTAL_ROOT_ID);
    if (!el) {
      el = document.createElement("div");
      el.id = PORTAL_ROOT_ID;
      el.className = "technical-analysis-root technical-analysis-bootstrap-scope technical-analysis-portal-root";
      document.body.appendChild(el);
    }
    setPortalRoot(el);

    return () => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
      setPortalRoot(null);
    };
  }, []);

  const value = portalRoot;

  return (
    <TechnicalAnalysisPortalContext.Provider value={value}>
      {children}
    </TechnicalAnalysisPortalContext.Provider>
  );
};
