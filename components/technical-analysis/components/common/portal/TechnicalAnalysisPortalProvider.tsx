"use client";

import React, { createContext, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";

export const TechnicalAnalysisPortalContext = createContext<HTMLElement | null>(null);

const PORTAL_ROOT_ID = "technical-analysis-portal-root";

interface TechnicalAnalysisPortalProviderProps {
  children: React.ReactNode;
}

export const TechnicalAnalysisPortalProvider: React.FC<TechnicalAnalysisPortalProviderProps> = ({ children }) => {
  const portalRootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;

    let el = document.getElementById(PORTAL_ROOT_ID);
    if (!el) {
      el = document.createElement("div");
      el.id = PORTAL_ROOT_ID;
      el.className = "technical-analysis-root technical-analysis-bootstrap-scope technical-analysis-portal-root";
      document.body.appendChild(el);
    }
    portalRootRef.current = el;

    return () => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
      portalRootRef.current = null;
    };
  }, []);

  const value = useMemo(() => portalRootRef.current, [portalRootRef.current]);

  return (
    <TechnicalAnalysisPortalContext.Provider value={value}>
      {children}
    </TechnicalAnalysisPortalContext.Provider>
  );
};
