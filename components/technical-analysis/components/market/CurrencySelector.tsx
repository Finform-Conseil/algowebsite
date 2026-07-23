"use client";

import React from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { useTechnicalAnalysisPortalTarget } from "@/components/technical-analysis/components/common/portal/useTechnicalAnalysisPortalTarget";

interface CurrencyOption {
  code: string;
  name: string;
  marker: string;
  markerType?: "flag" | "badge";
}

const CURRENCY_DROPDOWN_WIDTH = 240;
const CURRENCY_DROPDOWN_MARGIN = 8;
const CURRENCY_SEARCH_INPUT_ID_PREFIX = "technical-analysis-currency-search";
const CURRENCY_LISTBOX_ID_PREFIX = "technical-analysis-currency-listbox";
const VISUALLY_HIDDEN_STYLE: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

const MARKET_CURRENCIES = [
  { code: "XOF", name: "West African CFA Franc (BCEAO)", marker: "CFA", markerType: "badge" },
  { code: "XAF", name: "Central African CFA Franc (BEAC)", marker: "CFA", markerType: "badge" },
  { code: "NGN", name: "Nigerian Naira", marker: "🇳🇬", markerType: "flag" },
  { code: "KES", name: "Kenyan Shilling", marker: "🇰🇪", markerType: "flag" },
  { code: "ZAR", name: "South African Rand", marker: "🇿🇦", markerType: "flag" },
  { code: "MAD", name: "Moroccan Dirham", marker: "🇲🇦", markerType: "flag" },
  { code: "EGP", name: "Egyptian Pound", marker: "🇪🇬", markerType: "flag" },
  { code: "GHS", name: "Ghanaian Cedi", marker: "🇬🇭", markerType: "flag" },
  { code: "USD", name: "US Dollar", marker: "🇺🇸", markerType: "flag" },
  { code: "EUR", name: "Euro", marker: "🇪🇺", markerType: "flag" },
  { code: "GBP", name: "British Pound", marker: "🇬🇧", markerType: "flag" },
] as const satisfies readonly CurrencyOption[];
export type CurrencyCode = (typeof MARKET_CURRENCIES)[number]["code"];

export interface CurrencySelectorProps {
  selectedCurrency: CurrencyCode;
  setSelectedCurrency: (val: CurrencyCode) => void;
  isCurrencyOpen: boolean;
  setIsCurrencyOpen: (val: boolean) => void;
  currencyQuery: string;
  setCurrencyQuery: (val: string) => void;
  currencyBtnRef: React.RefObject<HTMLButtonElement>;
  currencyPos: { top: number; left: number };
  setCurrencyPos: (pos: { top: number; left: number }) => void;
}

const resolveDropdownPosition = (rect: DOMRect) => {
  const maxLeft = Math.max(CURRENCY_DROPDOWN_MARGIN, window.innerWidth - CURRENCY_DROPDOWN_WIDTH - CURRENCY_DROPDOWN_MARGIN);
  const left = Math.min(Math.max(rect.right - CURRENCY_DROPDOWN_WIDTH, CURRENCY_DROPDOWN_MARGIN), maxLeft);
  return { top: rect.bottom + 4, left };
};

export const MemoizedCurrencySelector = React.memo(function CurrencySelector({
  selectedCurrency,
  setSelectedCurrency,
  isCurrencyOpen,
  setIsCurrencyOpen,
  currencyQuery,
  setCurrencyQuery,
  currencyBtnRef,
  currencyPos,
  setCurrencyPos,
}: CurrencySelectorProps) {
  const currencyInstanceId = React.useId().replace(/:/g, "");
  const currencySearchInputId = `${CURRENCY_SEARCH_INPUT_ID_PREFIX}-${currencyInstanceId}`;
  const currencyListboxId = `${CURRENCY_LISTBOX_ID_PREFIX}-${currencyInstanceId}`;
  const portalTarget = useTechnicalAnalysisPortalTarget();
  const [isClientMounted, setIsClientMounted] = React.useState(false);

  React.useEffect(() => {
    setIsClientMounted(true);
  }, []);

  const normalizedCurrencyQuery = currencyQuery.trim().toLowerCase();
  const filteredCurrencies = React.useMemo(
    () =>
      MARKET_CURRENCIES.filter(
        (currency) =>
          currency.code.toLowerCase().includes(normalizedCurrencyQuery) ||
          currency.name.toLowerCase().includes(normalizedCurrencyQuery),
      ),
    [normalizedCurrencyQuery],
  );

  const toggleCurrencyDropdown = () => {
    if (!isCurrencyOpen && currencyBtnRef.current) {
      const rect = currencyBtnRef.current.getBoundingClientRect();
      setCurrencyPos(resolveDropdownPosition(rect));
    }
    setIsCurrencyOpen(!isCurrencyOpen);
  };

  const selectCurrency = React.useCallback((currencyCode: CurrencyCode) => {
    setSelectedCurrency(currencyCode);
    setIsCurrencyOpen(false);
    setCurrencyQuery("");
    currencyBtnRef.current?.focus();
  }, [currencyBtnRef, setCurrencyQuery, setIsCurrencyOpen, setSelectedCurrency]);

  const currencyDropdown = isClientMounted && isCurrencyOpen && portalTarget
    ? createPortal(
        <div
          className="gp-currency-dropdown-portal"
          style={{ top: currencyPos.top, left: currencyPos.left }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="gp-currency-header">Currencies</div>
          <div className="gp-currency-search">
            <i className="bi bi-search" style={{ color: "#787b86", fontSize: "12px" }}></i>
            <label htmlFor={currencySearchInputId} style={VISUALLY_HIDDEN_STYLE}>
              Search currencies
            </label>
            <input
              autoFocus
              id={currencySearchInputId}
              name="technicalAnalysisCurrencySearch"
              type="text"
              placeholder="Search"
              value={currencyQuery}
              onChange={(e) => setCurrencyQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  setIsCurrencyOpen(false);
                  setCurrencyQuery("");
                }
              }}
            />
          </div>
          <div id={currencyListboxId} className="gp-currency-list gp-custom-scrollbar" role="listbox" aria-label="Currency conversion targets">
            {filteredCurrencies.map((currency) => (
              <div
                id={`${currencyListboxId}-${currency.code}`}
                key={currency.code}
                className={clsx("gp-currency-item", selectedCurrency === currency.code && "active")}
                role="option"
                tabIndex={0}
                aria-selected={selectedCurrency === currency.code}
                onClick={() => selectCurrency(currency.code)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectCurrency(currency.code);
                  }
                }}
              >
                <span className={clsx("gp-currency-flag", currency.markerType === "badge" && "gp-currency-badge")}>
                  {currency.marker}
                </span>
                <div className="gp-currency-info">
                  <span className="gp-currency-code">{currency.code}</span>
                  <span className="gp-currency-name">{currency.name}</span>
                </div>
              </div>
            ))}
            {filteredCurrencies.length === 0 && (
              <div style={{ padding: "16px", textAlign: "center", color: "#787b86", fontSize: "12px" }}>
                No currencies found
              </div>
            )}
          </div>
        </div>,
        portalTarget,
      )
    : null;

  return (
    <>
      <button
        ref={currencyBtnRef}
        className="gp-currency-btn"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isCurrencyOpen}
        aria-controls={isCurrencyOpen ? currencyListboxId : undefined}
        aria-label={`Selected currency ${selectedCurrency}`}
        onClick={(e) => {
          e.stopPropagation();
          toggleCurrencyDropdown();
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape" && isCurrencyOpen) {
            e.preventDefault();
            e.stopPropagation();
            setIsCurrencyOpen(false);
            setCurrencyQuery("");
          }
        }}
      >
        <span>{selectedCurrency}</span>
        <i className="bi bi-chevron-down" style={{ fontSize: "10px", marginTop: "2px" }}></i>
      </button>
      {currencyDropdown}
    </>
  );
});
