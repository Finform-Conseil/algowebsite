import { useState, useEffect, useRef } from "react";
import type { CurrencyCode } from "../components/market/CurrencySelector";

/**
 * [TENOR 2026 SRE] useCurrencyState
 * [ADR-005] State Extraction: Encapsulates the Currency Selector state and 
 * click-outside logic to prevent root component bloat.
 * Designed to be consumed via React Context (CurrencyContext).
 */
export const useCurrencyState = (initialCurrency: CurrencyCode) => {
  const [isCurrencyOpen, setIsCurrencyOpen] = useState<boolean>(false);
  const [currencyQuery, setCurrencyQuery] = useState<string>("");
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(initialCurrency);
  const [currencyPos, setCurrencyPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const currencyBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isCurrencyOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        currencyBtnRef.current && 
        !currencyBtnRef.current.contains(target) && 
        !target.closest(".gp-currency-dropdown-portal")
      ) {
        setIsCurrencyOpen(false);
      }
    };
    
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [isCurrencyOpen]);

  return {
    isCurrencyOpen,
    setIsCurrencyOpen,
    currencyQuery,
    setCurrencyQuery,
    selectedCurrency,
    setSelectedCurrency,
    currencyPos,
    setCurrencyPos,
    currencyBtnRef,
  };
};

// --- EOF ---